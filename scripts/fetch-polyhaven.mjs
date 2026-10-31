// Fetch CC0 models from Poly Haven and pack them for the AR viewer.
//
// Usage (from the project root, Node 24+, no npm install needed):
//   node scripts/fetch-polyhaven.mjs <polyhavenId>[=<kebab-id>] ...
//   node scripts/fetch-polyhaven.mjs mid_century_lounge_chair=lounge-chair-01 potted_plant_04
//
// For each id it downloads the 1k glTF (+ .bin and textures) into a temp folder
// (override with POLYHAVEN_TMP=<dir>), packs it into public/models/<kebab-id>.glb
// with @gltf-transform/cli (no Draco/meshopt, so iOS Quick Look can convert it),
// moves the origin to the bottom centre, saves the Poly Haven thumbnail as
// public/models/<kebab-id>.webp (needs cwebp, otherwise .png) and prints a
// CATALOG stub. Fill in category/styles/rooms/material, then paste it into
// src/data/catalog.js. Browse ids at https://polyhaven.com/models.

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'models');
const TMP = resolve(process.env.POLYHAVEN_TMP || mkdtempSync(join(tmpdir(), 'polyhaven-')));
const MAX_MB = 5;

const run = (cmd, args) =>
  execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
const gltf = (...args) => run('npx', ['--yes', '@gltf-transform/cli@4', ...args]);

async function get(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': 'desainar-fetch-polyhaven' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  if (!file) return res.json();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function fetchModel(phId, id) {
  const info = await get(`https://api.polyhaven.com/info/${phId}`);
  const { url, include = {} } = (await get(`https://api.polyhaven.com/files/${phId}`)).gltf['1k'].gltf;
  const dir = join(TMP, phId);
  const main = join(dir, url.split('/').pop());
  const downloads = [[url, main]];
  for (const [rel, file] of Object.entries(include)) {
    const target = resolve(dir, rel);
    if (!target.startsWith(dir + sep)) throw new Error(`unsafe include path: ${rel}`);
    downloads.push([file.url, target]);
  }
  await Promise.all(downloads.map(([from, to]) => get(from, to)));

  // Pack to one GLB (textures stay 1k JPG/PNG), then origin -> bottom centre.
  const glb = join(OUT, `${id}.glb`);
  const packed = join(TMP, `${id}.packed.glb`);
  gltf('copy', main, packed);
  gltf('center', packed, glb, '--pivot', 'below');

  // Scene bbox from `inspect`, e.g. "-0.9, 0, -0.41","0.9, 0.71, 0.41".
  const [min, max] = gltf('inspect', glb, '--format', 'csv')
    .match(/"([-\d.e, ]+)","([-\d.e, ]+)"/)
    .slice(1)
    .map((s) => s.split(',').map(Number));
  const [w, h, d] = max.map((v, i) => Math.round((v - min[i]) * 100) / 100);
  const mb = statSync(glb).size / 1e6;
  if (mb > MAX_MB) console.warn(`  ! ${id}.glb is ${mb.toFixed(1)} MB (> ${MAX_MB} MB), pick another model`);

  const png = join(TMP, `${id}.png`);
  await get(`https://cdn.polyhaven.com/asset_img/thumbs/${phId}.png?width=256&height=256`, png);
  let poster = `${id}.webp`;
  try {
    run('cwebp', ['-quiet', '-q', '80', png, '-o', join(OUT, poster)]);
  } catch {
    poster = `${id}.png`;
    copyFileSync(png, join(OUT, poster));
    console.warn(`  ! cwebp not available, poster saved as ${poster}`);
  }

  console.log(`// ${phId}: ${mb.toFixed(2)} MB, bbox min ${min.join(', ')}
  {
    id: '${id}',
    name: '${info.name.replace(/'/g, "\\'")}',
    category: '', // ${(info.categories || []).join(', ')}
    styles: [],
    rooms: [],
    dims: { w: ${w}, d: ${d}, h: ${h} },
    material: '',
    glb: '/models/${id}.glb',
    poster: '/models/${poster}',
    credit: 'Poly Haven (CC0)',
    source: 'https://polyhaven.com/a/${phId}',
  },`);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/fetch-polyhaven.mjs <polyhavenId>[=<kebab-id>] ...');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
for (const arg of args) {
  const [phId, id = phId.toLowerCase().replace(/[^a-z0-9]+/g, '-')] = arg.split('=');
  try {
    if (!/^[\w-]+$/.test(phId) || !/^[a-z0-9-]+$/.test(id)) throw new Error(`bad id: ${arg}`);
    await fetchModel(phId, id);
  } catch (err) {
    process.exitCode = 1;
    console.error(`FAILED ${phId}: ${err.message}`);
  }
}
