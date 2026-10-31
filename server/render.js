// Concept render proxy for Pollinations (open-weight FLUX text-to-image).
// Without a key the classic endpoint allows one image per 45 s per IP and answers
// 402 (sometimes an *image* of an error message), so only a 200 image response is
// passed on. With POLLINATIONS_KEY (a secret sk_ key) there is no per-IP limit.
const BUDGET_MS = 50_000;

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

const int = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function fetchRender({ prompt, seed, width, height } = {}, apiKey) {
  const text = String(prompt ?? '').trim().slice(0, 700);
  if (!text) throw httpError(400, 'Prompt render kosong.');
  const params = new URLSearchParams({
    width: String(int(width, 256, 1280, 1024)),
    height: String(int(height, 256, 1280, 640)),
    seed: String(int(seed, 0, 1_000_000_000, 1)),
    nologo: 'true',
  });
  const url = apiKey
    ? `https://gen.pollinations.ai/image/${encodeURIComponent(text)}?model=black-forest-labs/flux.1-schnell&${params}`
    : `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?${params}`;
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  const deadline = Date.now() + BUDGET_MS;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4 && deadline - Date.now() > 6_000; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(deadline - Date.now()) });
      const type = res.headers.get('content-type') ?? '';
      if (res.ok && type.startsWith('image/')) return { body: Buffer.from(await res.arrayBuffer()), type };
      lastStatus = res.status;
      if (![402, 429].includes(res.status) && res.status < 500) break;
      // Free limit: wait as long as the server asks, if that still fits the budget.
      const waitMs = ((Number(res.headers.get('retry-after')) || 3) + 0.5) * 1000;
      if (deadline - Date.now() - waitMs < 8_000) break;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } catch {
      lastStatus = 0;
    }
  }
  if (lastStatus === 402 || lastStatus === 429) {
    throw httpError(503, 'Batas render gratis tercapai (1 gambar per 45 detik). Coba "Variasi baru" sebentar lagi.');
  }
  throw httpError(503, 'Server render sedang penuh. Coba "Variasi baru" sebentar lagi.');
}
