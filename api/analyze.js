import { analyzeRoom } from '../server/analyze.js';

// Vercel Function: POST /api/analyze. The key stays on the server.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST.' });
  try {
    res.status(200).json(await analyzeRoom(req.body ?? {}, process.env.GEMINI_API_KEY));
  } catch (err) {
    res.status(err.statusCode ?? 502).json({ error: err.message });
  }
}
