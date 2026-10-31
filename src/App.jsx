import { useMemo, useState } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import ArStage from './components/ArStage.jsx';
import Header from './components/Header.jsx';
import InsightPanel from './components/InsightPanel.jsx';
import StylePicker from './components/StylePicker.jsx';
import VisualPanel from './components/VisualPanel.jsx';
import { findItem } from './data/catalog.js';
import { MODES, findStyle } from './data/options.js';
import { requestAnalysis } from './lib/api.js';
import { compressPhoto } from './lib/image.js';

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
      if (!res.ok) throw new Error('Data demo belum tersedia.');
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
    <>
      <Header mode={mode} onModeChange={setMode} />

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-5 pb-16">
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
          <p className="-mt-3 text-center text-[11px] text-stone-500">
            Dianalisa oleh <span className="font-mono text-amber-400/90">{result.meta.model}</span> dalam{' '}
            {(result.meta.latency_ms / 1000).toFixed(1)} detik
            {result.meta.fallback && <span className="block text-amber-300/80">Mode Deep sedang sibuk, dialihkan ke Instant.</span>}
          </p>
        )}

        {stale && !loading && (
          <button
            type="button"
            onClick={() => analyze()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            <RefreshCw className="size-3.5" />
            Analisa ulang: {styleName} · {MODES[mode].title}
          </button>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-800/70 bg-red-950/40 p-4 text-xs text-red-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p>{error}</p>
              {photo && (
                <button type="button" onClick={() => analyze()} className="font-semibold text-red-100 underline underline-offset-4">
                  Coba lagi
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

        <footer className="space-y-1 pt-4 text-center text-[10px] leading-relaxed text-stone-500">
          <p>
            Analisa ruangan: Gemma 4 (open-weight) lewat Gemini API · Konsep render: Pollinations · AR: Google
            &lt;model-viewer&gt;
          </p>
          <p>Model 3D: Poly Haven (CC0) · Dibuat di Hacktoberfest Hack Day Kota Batam 2026</p>
        </footer>
      </main>
    </>
  );
}
