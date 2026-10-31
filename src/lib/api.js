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

// Concept render via Pollinations (open-weight text-to-image, no key needed).
// Keeps the photo's orientation so the before/after tabs line up.
export function renderUrl(prompt, photo, seed) {
  const landscape = !photo || photo.width >= photo.height;
  const [width, height] = landscape ? [1024, 640] : [640, 1024];
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
}
