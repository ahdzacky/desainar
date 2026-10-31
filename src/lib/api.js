export async function requestAnalysis({ image, style, mode, roomType }) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, style, mode, roomType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}. Coba lagi.`);
  return data;
}

// Same prompt, same seed: the first render of a result is cached by the CDN.
function seedFor(text) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 100000;
}

// Concept render via our /api/render proxy to Pollinations. Keeps the photo's
// orientation so the before/after tabs line up; `variant` moves to a new seed.
export function renderUrl(prompt, photo, variant = 0) {
  const landscape = !photo || photo.width >= photo.height;
  const [width, height] = landscape ? [1024, 640] : [640, 1024];
  const params = new URLSearchParams({ prompt, width, height, seed: seedFor(prompt) + variant });
  return `/api/render?${params}`;
}
