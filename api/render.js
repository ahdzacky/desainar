import { fetchRender } from '../server/render.js';

// Vercel Function: GET /api/render?prompt=&seed=&width=&height=
// Same query, same image, so the CDN may cache it for a week.
export default async function handler(req, res) {
  try {
    const { body, type } = await fetchRender(req.query, process.env.POLLINATIONS_KEY);
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.status(200).send(body);
  } catch (err) {
    res.status(err.statusCode ?? 502).json({ error: err.message });
  }
}
