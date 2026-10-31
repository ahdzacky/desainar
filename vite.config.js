import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev only: serve /api/analyze with the same logic the Vercel Function runs in
// production. The key is re-read from .env.local on every request, so adding it
// does not need a server restart.
function devApi() {
  return {
    name: 'desainar-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'Gunakan POST.' });
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
          const { GEMINI_API_KEY } = loadEnv(server.config.mode, process.cwd(), '');
          const { analyzeRoom } = await server.ssrLoadModule('/server/analyze.js');
          send(200, await analyzeRoom(body, GEMINI_API_KEY));
        } catch (err) {
          send(err.statusCode ?? 502, { error: err.message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
});
