# Contributing to DESAINAR

Thank you for your interest in improving DESAINAR.

## Local Development

1. Clone the repository and install dependencies:

   ```bash
   git clone git@github.com:ahdzacky/desainar.git
   cd desainar
   npm install
   ```

2. Create `.env.local` from `.env.example` and configure your Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

   Set `GEMINI_API_KEY` from Google AI Studio. Optionally set `POLLINATIONS_KEY` if you want to bypass Pollinations' free rate limit when proxying renders through `/api/render`.

3. Start the Vite dev server and verify production builds before opening a pull request:

   ```bash
   npm run dev
   npm run build
   ```

## Pull Request Workflow

1. Create a descriptive branch from `main` (for example, `feat/new-furniture-item` or `docs/update-readme`).
2. Keep pull requests focused on a single improvement or fix.
3. Run `npm run build` to make sure the client bundle builds cleanly.
4. When collaborating with others, include `Co-authored-by:` trailers in commit messages where appropriate.

## 3D Catalogue Guidelines

When adding furniture models to `src/data/catalog.js` and `public/models/`:

- Prefer CC0-licensed assets (such as Poly Haven via `scripts/fetch-polyhaven.mjs`) or include proper license attribution in `README.md`.
- Keep scale realistic (`1 unit = 1 meter`) with the model origin centered at the base.
- Export `.glb` assets with reasonable file sizes (around 5 MB or less) for responsive WebAR loading on mobile devices.
