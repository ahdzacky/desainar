// Shared by the client and the API function (server/analyze.js).

export const STYLES = [
  {
    id: 'japandi',
    name: 'Japandi / Wabi-Sabi',
    label: 'Japandi',
    hint: 'Organic & Wabi-Sabi',
    emoji: '🌿',
    brief: 'light natural wood, low-profile furniture, warm alabaster or greige walls, calm and organic',
  },
  {
    id: 'modern',
    name: 'Modern Minimalist',
    label: 'Modern',
    hint: 'Bauhaus & Clean',
    emoji: '📐',
    brief: 'form follows function, bold geometry, monochrome palette, clean surfaces',
  },
  {
    id: 'industrial',
    name: 'Industrial Loft',
    label: 'Industrial',
    hint: 'Raw Metal & Loft',
    emoji: '⚙️',
    brief: 'exposed materials (black steel, rough or dark wood, leather), strong structure, warm ambient lighting',
  },
  {
    id: 'midcentury',
    name: 'Mid-Century Modern',
    label: 'Mid-Century',
    hint: 'Warm Retro Iconic',
    emoji: '🛋️',
    brief: 'organic curved silhouettes, tapered wooden legs, warm walnut or teak with iconic accents',
  },
];

export const ROOM_TYPES = [
  { id: 'living', label: 'Living Room', emoji: '🛋️' },
  { id: 'family', label: 'Family Room', emoji: '📺' },
  { id: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { id: 'dining', label: 'Dining Room', emoji: '🍽️' },
  { id: 'office', label: 'Home Office', emoji: '💻' },
];

// Gemma 4 engines on the Gemini API. The API only accepts these model ids.
export const MODES = {
  instant: { model: 'gemma-4-26b-a4b-it', label: '26B-A4B', title: 'Instant (MoE, 4B active)' },
  deep: { model: 'gemma-4-31b-it', label: '31B Dense', title: 'Deep Designer (31B dense)' },
};

export const findStyle = (id) => STYLES.find((s) => s.id === id);
export const findRoom = (id) => ROOM_TYPES.find((r) => r.id === id);
