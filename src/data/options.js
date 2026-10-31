// Shared by the client and the API function (server/analyze.js).

export const STYLES = [
  {
    id: 'japandi',
    name: 'Japandi / Wabi-Sabi',
    label: 'Japandi',
    hint: 'Organik & Wabi-Sabi',
    emoji: '🌿',
    brief: 'kayu terang natural, garis rendah (low-profile), dinding warm alabaster / greige, tenang dan organik',
  },
  {
    id: 'modern',
    name: 'Modern Minimalist',
    label: 'Modern',
    hint: 'Bauhaus & Clean',
    emoji: '📐',
    brief: 'form follows function, geometris tegas, monokromatik, permukaan bersih',
  },
  {
    id: 'industrial',
    name: 'Industrial Loft',
    label: 'Industrial',
    hint: 'Raw Metal & Loft',
    emoji: '⚙️',
    brief: 'material ekspos: besi hitam, kayu kasar/gelap, kulit; struktur tegas dan pencahayaan warm ambient',
  },
  {
    id: 'midcentury',
    name: 'Mid-Century Modern',
    label: 'Mid-Century',
    hint: 'Warm Retro Iconic',
    emoji: '🛋️',
    brief: 'siluet lengkung organik, kaki kayu meruncing (tapered legs), kayu walnut/teak hangat dengan aksen ikonik',
  },
];

export const ROOM_TYPES = [
  { id: 'living', label: 'Ruang Tamu', en: 'Living Room', emoji: '🛋️' },
  { id: 'family', label: 'Ruang Keluarga', en: 'Family Room', emoji: '📺' },
  { id: 'bedroom', label: 'Kamar Tidur', en: 'Bedroom', emoji: '🛏️' },
  { id: 'dining', label: 'Ruang Makan', en: 'Dining Room', emoji: '🍽️' },
  { id: 'office', label: 'Ruang Kerja', en: 'Home Office', emoji: '💻' },
];

// Gemma 4 engines on the Gemini API. The API only accepts these model ids.
export const MODES = {
  instant: { model: 'gemma-4-26b-a4b-it', label: '26B-A4B', title: 'Instant (MoE)' },
  deep: { model: 'gemma-4-31b-it', label: '31B Dense', title: 'Deep Designer' },
};

export const findStyle = (id) => STYLES.find((s) => s.id === id);
export const findRoom = (id) => ROOM_TYPES.find((r) => r.id === id);
