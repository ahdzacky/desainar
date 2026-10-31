import { GoogleGenAI } from '@google/genai';
import { CATALOG, CATEGORIES } from '../src/data/catalog.js';
import { MODES, ROOM_TYPES, STYLES, findStyle } from '../src/data/options.js';

const HEX = /^#[0-9a-f]{6}$/i;
const ANNOTATION_TYPES = ['wall_zone', 'light_source', 'placement_zone'];
const SCALES = ['Compact', 'Medium', 'Spacious'];

// Gemma writes ~45 tokens/s, so output length sets the latency. The work is split
// into two prompts that run in parallel, each asking only for fields the UI shows.
const ANALYSIS_PROMPT = `Kamu adalah DESAINAR, spesialis desain interior. Analisa foto ruangan, lalu balas HANYA dengan satu objek JSON valid (tanpa markdown) persis berbentuk:
{
  "room_identification": { "detected_room_type": "living | family | bedroom | dining | office", "estimated_room_scale": "Compact | Medium | Spacious" },
  "spatial_annotations": [{ "type": "wall_zone | light_source | placement_zone", "label": "", "x_percent": 0, "y_percent": 0, "w_percent": 0, "h_percent": 0 }],
  "color_and_wall_analysis": {
    "current_wall": { "detected_name": "", "hex": "#RRGGBB", "undertone": "Warm | Cool | Neutral", "wall_critique": "" },
    "detected_room_palette": [{ "name": "", "hex": "#RRGGBB" }],
    "recommended_wall_palette": [{ "name": "", "hex": "#RRGGBB", "finish": "", "reason": "" }]
  },
  "spatial_metrics": { "lighting_analysis": "", "negative_space_balance": "", "style_alignment_score": 0 },
  "interior_critique": ""
}
Aturan:
- Bahasa Indonesia, SINGKAT: setiap teks maksimal 12 kata, interior_critique maksimal 2 kalimat pendek, label anotasi maksimal 5 kata.
- Koordinat dalam persen terhadap foto: x_percent dan y_percent adalah TITIK TENGAH anotasi (x 0 = kiri, 100 = kanan; y 0 = atas, 100 = bawah). w_percent dan h_percent adalah lebar dan tinggi zona di foto.
- spatial_annotations: 1 wall_zone di bidang dinding dominan, 1 light_source di jendela atau lampu utama (jika terlihat), dan 2 placement_zone di area lantai kosong yang realistis untuk furniture baru: "Zona #1: …" untuk area kosong terbesar, "Zona #2: …" untuk area kedua.
- detected_room_palette tepat 3 warna berurutan: 60% dinding, 30% lantai/kayu, 10% aksen. recommended_wall_palette tepat 2 yang cocok dengan gaya target: cat dinding utama, lalu accent wall. Semua hex berformat #RRGGBB.
- style_alignment_score (0-100) menilai seberapa ruangan SAAT INI sudah sesuai gaya target.
- Jika foto bukan ruangan interior, tetap isi JSON sebaik mungkin dan jelaskan di interior_critique.`;

const PICKS_PROMPT = `Kamu adalah DESAINAR, spesialis furniture. Lihat foto ruangan, lalu pilih furniture dari katalog untuk mendesain ulang ruangan ke gaya target. Balas HANYA dengan satu objek JSON valid (tanpa markdown) persis berbentuk:
{
  "recommendations": [{ "item_id": "", "match_score": 0, "design_reason": "", "ar_placement_guide": "", "zone_label": "" }],
  "design_render_prompt": ""
}
Aturan:
- recommendations tepat 4 item. item_id WAJIB dari katalog, utamakan kategori berbeda, cocok dengan gaya target, tipe ruangan, dan ruang kosong di foto, urut dari match_score (0-100) tertinggi.
- design_reason dan ar_placement_guide dalam Bahasa Indonesia, maksimal 12 kata. ar_placement_guide menyebut posisi nyata di foto, misalnya "di lantai kosong dekat jendela kiri".
- zone_label: "Zona #1" untuk area lantai kosong terbesar, "Zona #2" untuk area kosong kedua.
- design_render_prompt dalam Bahasa Inggris, 30-40 kata: foto interior fotorealistik ruangan ini setelah didesain ulang dengan gaya target; sebut tipe ruangan, furniture pilihan, material, dan pencahayaan. Jangan sebut warna cat dinding. Tanpa merek.`;

function catalogTable() {
  return CATALOG.map(
    (item) =>
      `- ${item.id} | ${CATEGORIES[item.category]?.label ?? item.category} | gaya: ${item.styles.join(', ')} | ruang: ${item.rooms.join(', ')} | ${item.dims.w}x${item.dims.d}x${item.dims.h} m | ${item.material}`,
  ).join('\n');
}

function contextPrompt(style, confirmedRoom, withCatalog) {
  const room = confirmedRoom
    ? `${confirmedRoom.id} (${confirmedRoom.label}), sudah dikonfirmasi pengguna`
    : 'deteksi dari foto';
  const lines = [`Gaya target: ${style.name} (${style.brief}).`, `Tipe ruangan: ${room}.`];
  if (withCatalog) lines.push(`Katalog furniture (id | kategori | gaya | ruang | ukuran | material):\n${catalogTable()}`);
  return lines.join('\n');
}

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function toHttpError(err) {
  if (err.statusCode) return err;
  if (err.status === 503) return httpError(503, 'Gemma sedang sibuk karena banyak dipakai. Coba lagi beberapa detik lagi.');
  if (err.status === 429) return httpError(429, 'Batas kuota Gemma tercapai. Tunggu sebentar lalu coba lagi.');
  if (err.status === 504 || !err.status) return httpError(504, 'Gemma terlalu lama merespons. Coba lagi.');
  return httpError(502, `Gemma menolak permintaan (${err.status}): ${err.message}`);
}

function matchRoom(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return ROOM_TYPES.find((r) => [r.id, r.en.toLowerCase(), r.label.toLowerCase()].includes(v));
}

const text = (value, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const hex = (value, fallback) => (HEX.test(value ?? '') ? value.toUpperCase() : fallback);
const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// Gemma sometimes wraps JSON in ```json fences or adds a sentence around it.
function parseJson(raw) {
  const body = String(raw ?? '');
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) throw httpError(502, 'Gemma tidak mengembalikan JSON. Coba lagi.');
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw httpError(502, 'JSON dari Gemma tidak bisa dibaca. Coba lagi.');
  }
}

// Vercel stops the function at 60 s; keep a few seconds for parsing and the reply.
const BUDGET_MS = 55_000;
const MIN_RETRY_MS = 15_000;

// One Gemma call with JSON mode (works for Gemma 4 on the Gemini API, checked
// 31 Oct 2026). Thinking stays off. Under load Gemma answers 503 or queues for
// ~20 s, so each attempt gets the time left in the budget, and a retry (Deep falls
// back to Instant) only happens when enough of it remains.
async function generateJson(ai, { engine, system, prompt, photo, deadline }) {
  const plan = engine === 'deep' ? ['deep', 'instant'] : ['instant', 'instant'];
  let lastError;
  for (const [i, key] of plan.entries()) {
    const remaining = deadline - Date.now();
    if (i > 0 && remaining < MIN_RETRY_MS) break;
    try {
      const response = await ai.models.generateContent({
        model: MODES[key].model,
        contents: [{ role: 'user', parts: [{ inlineData: photo }, { text: prompt }] }],
        config: {
          systemInstruction: system,
          temperature: 0.4,
          maxOutputTokens: 1536,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: 'MINIMAL' },
          httpOptions: { timeout: remaining },
        },
      });
      return { data: parseJson(response.text), mode: key, tokens: response.usageMetadata?.candidatesTokenCount ?? 0 };
    } catch (err) {
      lastError = err;
      // Bad request or auth problems will not fix themselves on a retry.
      if ([400, 401, 403, 404].includes(err.status)) break;
    }
  }
  throw toHttpError(lastError);
}

// Valid JSON is not the same as trustworthy data: clamp numbers, check hex
// colours and only keep catalog ids that exist, then fill the gaps.
function normalize(raw, style, confirmedRoom) {
  const id = raw.room_identification ?? {};
  const room = confirmedRoom ?? matchRoom(id.detected_room_type) ?? ROOM_TYPES[0];

  const annotations = (Array.isArray(raw.spatial_annotations) ? raw.spatial_annotations : [])
    .filter((a) => ANNOTATION_TYPES.includes(a?.type))
    .slice(0, 8)
    .map((a) => ({
      type: a.type,
      label: text(a.label, a.type === 'light_source' ? 'Sumber cahaya' : 'Zona'),
      x_percent: clamp(a.x_percent, 2, 98, 50),
      y_percent: clamp(a.y_percent, 2, 98, 50),
      w_percent: clamp(a.w_percent, 8, 70, 28),
      h_percent: clamp(a.h_percent, 8, 60, 22),
    }));

  const colors = raw.color_and_wall_analysis ?? {};
  const wall = colors.current_wall ?? {};
  const defaultPalette = [
    { role: '60% Dominan (Dinding)', name: 'Dinding', hex: '#E5E7EB' },
    { role: '30% Sekunder (Lantai/Kayu)', name: 'Lantai', hex: '#A47E58' },
    { role: '10% Aksen', name: 'Aksen', hex: '#374151' },
  ];
  const palette = defaultPalette.map((fallback, i) => {
    const entry = colors.detected_room_palette?.[i] ?? {};
    return { role: fallback.role, name: text(entry.name, fallback.name), hex: hex(entry.hex, fallback.hex) };
  });
  const wallPaints = (Array.isArray(colors.recommended_wall_palette) ? colors.recommended_wall_palette : [])
    .slice(0, 2)
    .map((p, i) => ({
      type: i === 0 ? 'Cat Dinding Utama' : 'Accent Wall',
      name: text(p.name, i === 0 ? 'Warm Alabaster' : 'Clay Greige'),
      hex: hex(p.hex, i === 0 ? '#E8E2D5' : '#C2B6A3'),
      finish: text(p.finish, 'Matte'),
      reason: text(p.reason),
    }));

  const seen = new Set();
  const recommendations = (Array.isArray(raw.recommendations) ? raw.recommendations : [])
    .filter((r) => CATALOG.some((item) => item.id === r?.item_id) && !seen.has(r.item_id) && seen.add(r.item_id))
    .map((r) => ({
      item_id: r.item_id,
      match_score: Math.round(clamp(r.match_score, 0, 100, 80)),
      role_badge: 'Rekomendasi Gemma',
      design_reason: text(r.design_reason, 'Cocok dengan gaya dan ruangan ini.'),
      ar_placement_guide: text(r.ar_placement_guide, 'Letakkan di area lantai yang kosong.'),
      zone_label: text(r.zone_label),
    }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);

  // Fewer than 3 usable picks: top up with catalog items that fit the style and room.
  const fits = (item) => (item.styles.includes(style.id) ? 2 : 0) + (item.rooms.includes(room.id) ? 1 : 0);
  for (const item of [...CATALOG].sort((a, b) => fits(b) - fits(a))) {
    if (recommendations.length >= 3) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    recommendations.push({
      item_id: item.id,
      match_score: 60 + fits(item) * 8,
      role_badge: 'Pilihan Katalog',
      design_reason: `Sesuai gaya ${style.name} untuk ${room.label}.`,
      ar_placement_guide: 'Letakkan di area lantai yang kosong.',
      zone_label: '',
    });
  }

  const metrics = raw.spatial_metrics ?? {};
  const primaryWall = wallPaints[0] ?? { name: 'Warm Alabaster', hex: '#E8E2D5' };
  const scene = text(
    raw.design_render_prompt,
    `Photorealistic interior photography of a ${style.name} ${room.en}, natural materials, warm daylight, Architectural Digest style`,
  );
  return {
    room_identification: {
      room_type: room.id,
      estimated_room_scale: SCALES.includes(id.estimated_room_scale) ? id.estimated_room_scale : 'Medium',
    },
    spatial_annotations: annotations,
    color_and_wall_analysis: {
      current_wall: {
        detected_name: text(wall.detected_name, palette[0].name),
        hex: hex(wall.hex, palette[0].hex),
        undertone: text(wall.undertone, 'Neutral'),
        wall_critique: text(wall.wall_critique),
      },
      detected_room_palette: palette,
      recommended_wall_palette: wallPaints,
    },
    spatial_metrics: {
      lighting_analysis: text(metrics.lighting_analysis),
      negative_space_balance: text(metrics.negative_space_balance),
      style_alignment_score: Math.round(clamp(metrics.style_alignment_score, 0, 100, 50)),
    },
    interior_critique: text(raw.interior_critique),
    recommendations,
    // The wall colour comes from the analysis call, so both halves stay consistent.
    design_render_prompt: `${scene} Walls painted ${primaryWall.name} (${primaryWall.hex}).`,
  };
}

export async function analyzeRoom({ image, style, roomType, mode } = {}, apiKey) {
  if (!apiKey) throw httpError(500, 'GEMINI_API_KEY belum diset di server.');
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(image ?? '');
  if (!match) throw httpError(400, 'Foto tidak valid. Kirim sebagai data URL base64.');

  const photo = { mimeType: match[1], data: match[2] };
  const targetStyle = findStyle(style) ?? STYLES[0];
  const confirmedRoom = roomType ? matchRoom(roomType) : undefined;
  const engine = MODES[mode] ? mode : 'instant';
  const ai = new GoogleGenAI({ apiKey });

  const started = Date.now();
  const deadline = started + BUDGET_MS;
  const [analysis, picks] = await Promise.allSettled([
    generateJson(ai, { engine, photo, deadline, system: ANALYSIS_PROMPT, prompt: contextPrompt(targetStyle, confirmedRoom, false) }),
    generateJson(ai, { engine, photo, deadline, system: PICKS_PROMPT, prompt: contextPrompt(targetStyle, confirmedRoom, true) }),
  ]);
  // The analysis is the core of the result; without picks the catalog fills in.
  if (analysis.status === 'rejected') throw analysis.reason;
  const parts = [analysis.value, picks.value].filter(Boolean);

  return {
    ...normalize({ ...analysis.value.data, ...picks.value?.data }, targetStyle, confirmedRoom),
    meta: {
      model: MODES[analysis.value.mode].model,
      mode: analysis.value.mode,
      fallback: parts.some((part) => part.mode !== engine),
      picks_from_catalog: picks.status === 'rejected',
      style: targetStyle.id,
      latency_ms: Date.now() - started,
      output_tokens: parts.reduce((sum, part) => sum + part.tokens, 0),
    },
  };
}
