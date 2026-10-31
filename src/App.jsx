import { useMemo, useState } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import ArStage from './components/ArStage.jsx';
import Brand from './components/Brand.jsx';
import Header from './components/Header.jsx';
import InsightPanel from './components/InsightPanel.jsx';
import StylePicker from './components/StylePicker.jsx';
import VisualPanel from './components/VisualPanel.jsx';
import { findItem } from './data/catalog.js';
import { MODES, findStyle } from './data/options.js';
import { requestAnalysis } from './lib/api.js';
import { compressPhoto } from './lib/image.js';

const REPO_URL = 'https://github.com/ahdzacky/desainar';

export default function App() {
  const [mode, setMode] = useState('instant');
  const [style, setStyle] = useState('japandi');
  const [photo, setPhoto] = useState(null);
  const [roomType, setRoomType] = useState(null); // only set when the user picks a room
  const [result, setResult] = useState(null);
  const [ranWith, setRanWith] = useState(null); // style + mode behind the result on screen
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [paintIndex, setPaintIndex] = useState(0);

  const loading = status === 'loading';
  const stale = result && ranWith && (ranWith.style !== style || ranWith.mode !== mode);

  async function analyze(overrides = {}) {
    const params = { photo, style, mode, roomType, ...overrides };
    if (!params.photo) return;
    setStatus('loading');
    setError('');
    try {
      const data = await requestAnalysis({ ...params, image: params.photo.dataUrl });
      setResult(data);
      setRanWith({ style: params.style, mode: params.mode });
      setPaintIndex(0);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  async function onFile(file) {
    if (!file) return;
    try {
      const next = await compressPhoto(file);
      setPhoto(next);
      setResult(null);
      setRoomType(null);
      analyze({ photo: next, roomType: null });
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  // Saved Gemma result for a sample photo: works even when the venue Wi-Fi or the API is down.
  async function onDemo() {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/demo/demo.json');
      if (!res.ok) throw new Error('The demo data is not available.');
      const demo = await res.json();
      const next = await compressPhoto(await (await fetch(demo.photo)).blob());
      setPhoto(next);
      setRoomType(null);
      setStyle(demo.result.meta.style);
      setMode(demo.result.meta.mode);
      setResult({ ...demo.result, demo_render: demo.render });
      setRanWith({ style: demo.result.meta.style, mode: demo.result.meta.mode });
      setPaintIndex(0);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function onRoomChange(id) {
    setRoomType(id);
    analyze({ roomType: id });
  }

  const picks = useMemo(
    () =>
      (result?.recommendations ?? [])
        .map((rec) => ({ ...rec, item: findItem(rec.item_id) }))
        .filter((pick) => pick.item),
    [result],
  );
  const paint = result?.color_and_wall_analysis.recommended_wall_palette[paintIndex];
  const styleName = findStyle(style)?.name ?? style;

  return (
    <div className="flex min-h-screen flex-col">
      <Header mode={mode} onModeChange={setMode} />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-5 pb-12">
        <StylePicker value={style} onChange={setStyle} />

        <VisualPanel
          photo={photo}
          result={result}
          loading={loading}
          styleName={styleName}
          roomType={roomType}
          paint={paint}
          onRoomChange={onRoomChange}
          onFile={onFile}
          onDemo={onDemo}
        />

        {result?.meta && !loading && (
          <p className="-mt-3 text-center text-[11px] text-muted">
            Analysed by <span className="font-mono text-primary">{result.meta.model}</span> in{' '}
            {(result.meta.latency_ms / 1000).toFixed(1)} s
            {result.meta.fallback && <span className="block text-secondary">Deep mode was busy, so Instant answered.</span>}
          </p>
        )}

        {stale && !loading && (
          <button
            type="button"
            onClick={() => analyze()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-surface px-4 py-3 text-xs font-semibold text-primary hover:bg-primary-soft"
          >
            <RefreshCw className="size-3.5" />
            Re-analyse: {styleName} · {MODES[mode].title}
          </button>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 rounded-lg border border-error-ink/20 bg-error-soft p-4 text-xs text-error-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p>{error}</p>
              {photo && (
                <button type="button" onClick={() => analyze()} className="font-semibold underline underline-offset-4">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            <InsightPanel result={result} paintIndex={paintIndex} onPaintSelect={setPaintIndex} />
            <ArStage picks={picks} paint={paint} />
          </>
        )}
      </main>

      <footer className="bg-primary-deep px-4 py-7 text-center text-[11px] leading-relaxed text-white/75">
        <div className="mx-auto max-w-lg space-y-2">
          <p className="text-base">
            <Brand className="text-white" accent="text-on-dark" />
          </p>
          <p>
            Room analysis by Gemma 4 (open-weight) via the Gemini API · Concept renders by Pollinations · AR by Google
            &lt;model-viewer&gt; · 3D models from Poly Haven (CC0)
          </p>
          <p>Built at Hacktoberfest Hack Day Kota Batam × Batam Innovation Center 2026</p>
          <p className="border-t border-white/15 pt-3 text-white">
            © 2026 Ahmad Miftahul Zaki · Released under the{' '}
            <a href={`${REPO_URL}/blob/main/LICENSE`} className="font-semibold text-on-dark underline-offset-4 hover:underline">
              MIT License
            </a>{' '}
            ·{' '}
            <a href={REPO_URL} className="font-semibold text-on-dark underline-offset-4 hover:underline">
              Source on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
