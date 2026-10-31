// Concept renders from Pollinations (open-weight FLUX text-to-image).
// The free tier allows one image per 45 s per IP and answers 402 when it is used
// up, so every response is checked before it is shown.

const POLLINATIONS = 'https://image.pollinations.ai/prompt/';

// Same prompt, same seed: a result's first render is stable and cacheable.
function seedFor(text) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 100000;
}

async function fetchImage(url, signal) {
  const res = await fetch(url, { signal });
  const type = res.headers.get('content-type') ?? '';
  if (res.ok && type.startsWith('image/')) return URL.createObjectURL(await res.blob());
  throw new Error(`HTTP ${res.status}`);
}

// Browser first, because the viewer's own IP usually still has its free image.
// Then our /api/render proxy, which has no limit when the server has a
// POLLINATIONS_KEY. Keeps the photo's orientation so before/after line up.
export async function loadRender(prompt, photo, variant, signal) {
  const landscape = !photo || photo.width >= photo.height;
  const [width, height] = landscape ? [1024, 640] : [640, 1024];
  const seed = seedFor(prompt) + variant;
  try {
    const query = new URLSearchParams({ width, height, seed, nologo: 'true' });
    return await fetchImage(`${POLLINATIONS}${encodeURIComponent(prompt)}?${query}`, signal);
  } catch (err) {
    if (signal.aborted) throw err;
  }
  return fetchImage(`/api/render?${new URLSearchParams({ prompt, width, height, seed })}`, signal);
}
