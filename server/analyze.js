import { GoogleGenAI } from '@google/genai';
import { CATALOG, CATEGORIES } from '../src/data/catalog.js';
import { MODES, ROOM_TYPES, STYLES, findStyle } from '../src/data/options.js';

const HEX = /^#[0-9a-f]{6}$/i;
const ANNOTATION_TYPES = ['wall_zone', 'light_source', 'placement_zone'];
const SCALES = ['Compact', 'Medium', 'Spacious'];

const SYSTEM_PROMPT = `Kamu adalah DESAINAR, spesialis desain interior dan penataan furniture.
Analisa foto ruangan dari pengguna, lalu balas HANYA dengan satu objek JSON valid (tanpa markdown, tanpa teks lain) dengan bentuk persis seperti ini:
{
  "room_identification": {
    "detected_room_type": "living | family | bedroom | dining | office",
    "estimated_room_scale": "Compact | Medium | Spacious",
    "current_vibe": "1 kalimat suasana ruangan saat ini"
  },
  "spatial_annotations": [
    { "type": "wall_zone | light_source | placement_zone", "label": "teks pendek", "x_percent": 0, "y_percent": 0, "w_percent": 0, "h_percent": 0 }
  ],
  "color_and_wall_analysis": {
    "current_wall": { "detected_name": "", "hex": "#RRGGBB", "undertone": "Warm | Cool | Neutral", "wall_critique": "" },
    "detected_room_palette": [
      { "role": "60% Dominan (Dinding)", "name": "", "hex": "#RRGGBB" },
      { "role": "30% Sekunder (Lantai/Kayu)", "name": "", "hex": "#RRGGBB" },
      { "role": "10% Aksen", "name": "", "hex": "#RRGGBB" }
    ],
    "recommended_wall_palette": [
      { "type": "Cat Dinding Utama", "name": "", "hex": "#RRGGBB", "finish": "", "reason": "" },
      { "type": "Accent Wall", "name": "", "hex": "#RRGGBB", "finish": "", "reason": "" }
    ]
  },
  "spatial_metrics": { "lighting_analysis": "", "negative_space_balance": "", "style_alignment_score": 0 },
  "interior_critique": "2-3 kalimat",
  "recommendations": [
    { "rank": 1, "item_id": "", "match_score": 0, "role_badge": "", "color_contribution": "", "design_reason": "", "ar_placement_guide": "", "zone_label": "" }
  ],
  "design_render_prompt": ""
}

Aturan:
- Semua teks untuk pengguna dalam Bahasa Indonesia yang singkat (maksimal sekitar 25 kata per field), kecuali design_render_prompt.
- Koordinat dalam persen terhadap foto: x_percent dan y_percent adalah TITIK TENGAH anotasi (x 0 = kiri, 100 = kanan; y 0 = atas, 100 = bawah). w_percent dan h_percent adalah lebar dan tinggi zona di foto.
- spatial_annotations berisi 1 wall_zone di bidang dinding dominan, 1 light_source di jendela atau sumber cahaya utama (jika terlihat), dan 2-3 placement_zone di area lantai kosong yang realistis untuk furniture baru. Label placement_zone diawali "Zona #1", "Zona #2", dan seterusnya.
- Terapkan aturan 60-30-10 untuk palet. Semua hex berformat #RRGGBB.
- recommendations berisi 3-5 item. item_id WAJIB diambil dari katalog yang diberikan, utamakan kategori yang berbeda, cocok dengan gaya target dan tipe ruangan, urut dari match_score tertinggi. zone_label menyebut zona tujuan (misalnya "Zona #1").
- style_alignment_score (0-100) menilai seberapa ruangan SAAT INI sudah sesuai gaya target.
- design_render_prompt dalam Bahasa Inggris, 40-70 kata: foto arsitektur interior fotorealistik dari ruangan ini setelah didesain ulang dengan gaya target; sebutkan tipe ruangan, nama dan hex cat dinding rekomendasi, furniture yang direkomendasikan, material, dan pencahayaan. Tanpa nama merek.
- Jika foto bukan ruangan interior, tetap isi JSON sebaik mungkin dan jelaskan di interior_critique.`;

function catalogTable() {
  return CATALOG.map(
    (item) =>
      `- ${item.id} | ${CATEGORIES[item.category]?.label ?? item.category} | gaya: ${item.styles.join(', ')} | ruang: ${item.rooms.join(', ')} | ${item.dims.w}x${item.dims.d}x${item.dims.h} m | ${item.material}`,
  ).join('\n');
}

function userPrompt(style, confirmedRoom) {
  const room = confirmedRoom
    ? `${confirmedRoom.id} (${confirmedRoom.label}), sudah dikonfirmasi pengguna`
    : 'deteksi dari foto';
  return `Gaya target: ${style.name} (${style.brief}).
Tipe ruangan: ${room}.
Katalog furniture (id | kategori | gaya | ruang | ukuran | material):
${catalogTable()}`;
}

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
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
      type: text(p.type, i === 0 ? 'Cat Dinding Utama' : 'Accent Wall'),
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
      role_badge: text(r.role_badge, 'Rekomendasi'),
      color_contribution: text(r.color_contribution),
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
      color_contribution: '',
      design_reason: `Sesuai gaya ${style.name} untuk ${room.label}.`,
      ar_placement_guide: 'Letakkan di area lantai yang kosong.',
      zone_label: '',
    });
  }

  const metrics = raw.spatial_metrics ?? {};
  const primaryWall = wallPaints[0] ?? { name: 'Warm Alabaster', hex: '#E8E2D5' };
  return {
    room_identification: {
      room_type: room.id,
      estimated_room_scale: SCALES.includes(id.estimated_room_scale) ? id.estimated_room_scale : 'Medium',
      current_vibe: text(id.current_vibe),
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
    design_render_prompt: text(
      raw.design_render_prompt,
      `Photorealistic interior architecture photography of a ${style.name} ${room.en}, walls painted ${primaryWall.name} ${primaryWall.hex}, natural materials, warm daylight, Architectural Digest style`,
    ),
  };
}

export async function analyzeRoom({ image, style, roomType, mode } = {}, apiKey) {
  if (!apiKey) throw httpError(500, 'GEMINI_API_KEY belum diset di server.');
  const photo = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(image ?? '');
  if (!photo) throw httpError(400, 'Foto tidak valid. Kirim sebagai data URL base64.');

  const targetStyle = findStyle(style) ?? STYLES[0];
  const confirmedRoom = roomType ? matchRoom(roomType) : undefined;
  const engine = MODES[mode] ? mode : 'instant';

  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    {
      role: 'user',
      parts: [{ inlineData: { mimeType: photo[1], data: photo[2] } }, { text: userPrompt(targetStyle, confirmedRoom) }],
    },
  ];
  const base = { systemInstruction: SYSTEM_PROMPT, temperature: 0.4, maxOutputTokens: 4096 };
  const thinking = { thinkingConfig: { thinkingLevel: engine === 'deep' ? 'HIGH' : 'MINIMAL' } };
  // The Gemma docs do not promise JSON mode, so step down if the API rejects a config.
  const configs = [
    { ...base, ...thinking, responseMimeType: 'application/json' },
    { ...base, ...thinking },
    base,
  ];

  const started = Date.now();
  let response;
  for (const [i, config] of configs.entries()) {
    try {
      response = await ai.models.generateContent({ model: MODES[engine].model, contents, config });
      break;
    } catch (err) {
      if (err.status !== 400 || i === configs.length - 1) {
        throw httpError(err.status === 429 ? 429 : 502, `Gemma error: ${err.message}`);
      }
    }
  }

  return {
    ...normalize(parseJson(response.text), targetStyle, confirmedRoom),
    meta: { model: MODES[engine].model, mode: engine, style: targetStyle.id, latency_ms: Date.now() - started },
  };
}
