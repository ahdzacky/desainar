import { useEffect, useState } from 'react';
import { Camera, ImageIcon, ImageUp, LoaderCircle, RefreshCw, ScanEye, Sparkles, WandSparkles } from 'lucide-react';
import { ROOM_TYPES, findRoom } from '../data/options.js';
import { renderUrl } from '../lib/api.js';

const TABS = [
  { id: 'orig', label: 'Foto Asli', icon: ImageIcon },
  { id: 'analysis', label: 'Gambar Analisa', icon: ScanEye },
  { id: 'render', label: 'Desain AI', icon: WandSparkles },
];

const STAGES = [
  'Mengenali tipe ruangan…',
  'Memetakan zona kosong & arah cahaya…',
  'Membaca palet warna 60-30-10…',
  'Memilih furniture dari katalog 3D…',
  'Menyusun kritik desain…',
];

// Tailwind only ships class names it can see, so zone colours are spelled out.
const ZONE_STYLES = [
  { box: 'border-emerald-400 bg-emerald-500/15', tag: 'bg-emerald-400' },
  { box: 'border-amber-400 bg-amber-500/15', tag: 'bg-amber-400' },
  { box: 'border-sky-400 bg-sky-500/15', tag: 'bg-sky-400' },
];

function PhotoButton({ capture, icon: Icon, label, onFile, variant = 'secondary' }) {
  const styles = {
    primary: 'bg-amber-500 text-stone-950 hover:bg-amber-400 px-3 py-2.5',
    secondary: 'border border-stone-700 bg-stone-950 text-stone-200 hover:border-stone-600 px-3 py-2.5',
    floating: 'border border-stone-700 bg-stone-950/85 text-stone-100 backdrop-blur-md hover:bg-stone-900 px-3 py-1.5 shadow-lg',
  };
  return (
    <label className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition ${styles[variant]}`}>
      <Icon className={`size-3.5 ${variant === 'floating' ? 'text-amber-400' : ''}`} />
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function AnalysisOverlay({ annotations, currentWall, paint }) {
  let zone = 0;
  return (
    <>
      <div className="blueprint absolute inset-0" />
      <div className="absolute inset-0 bg-linear-to-t from-stone-950/80 via-transparent to-transparent" />
      {annotations.map((a, i) => {
        const pos = { left: `${a.x_percent}%`, top: `${a.y_percent}%` };
        if (a.type === 'placement_zone') {
          const style = ZONE_STYLES[zone++ % ZONE_STYLES.length];
          // Keep the label inside the photo when the zone sits near an edge.
          const anchor = a.x_percent > 65 ? 'right-0' : a.x_percent < 35 ? 'left-0' : 'left-1/2 -translate-x-1/2';
          return (
            <div
              key={i}
              style={{ ...pos, width: `${a.w_percent}%`, height: `${a.h_percent}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed ${style.box}`}
            >
              <span
                className={`absolute -top-2.5 max-w-44 truncate rounded-full px-2 py-0.5 text-[9px] font-extrabold text-stone-950 shadow ${anchor} ${style.tag}`}
              >
                {a.label}
              </span>
            </div>
          );
        }
        if (a.type === 'light_source') {
          return (
            <div
              key={i}
              style={pos}
              className="absolute max-w-[45%] -translate-x-1/2 -translate-y-1/2 truncate rounded-full border border-sky-400/70 bg-sky-950/90 px-2.5 py-1 text-[10px] font-semibold text-sky-200 shadow-lg"
            >
              ☀️ {a.label}
            </div>
          );
        }
        return (
          <div
            key={i}
            style={pos}
            className="absolute flex max-w-[60%] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-amber-400/80 bg-stone-950/90 px-2.5 py-1.5 text-[10px] shadow-lg"
          >
            <span className="flex shrink-0">
              <span className="size-3 rounded-full border border-white/70" style={{ background: currentWall.hex }} />
              {paint && <span className="-ml-1 size-3 rounded-full border border-white" style={{ background: paint.hex }} />}
            </span>
            <span className="line-clamp-2 font-bold text-amber-300">{a.label}</span>
          </div>
        );
      })}
    </>
  );
}

export default function VisualPanel({ photo, result, loading, styleName, roomType, paint, onRoomChange, onFile, onDemo }) {
  const [tab, setTab] = useState('analysis');
  const [variant, setVariant] = useState(0);
  const [renderStatus, setRenderStatus] = useState('loading');
  const [stage, setStage] = useState(0);

  // The demo result ships a pre-rendered image for its first variant.
  const render = result ? (variant === 0 && result.demo_render) || renderUrl(result.design_render_prompt, photo, variant) : '';
  useEffect(() => setRenderStatus('loading'), [render]);
  useEffect(() => {
    if (!result) return;
    setTab('analysis');
    setVariant(0);
  }, [result]);
  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const timer = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(timer);
  }, [loading]);

  if (!photo) {
    return (
      <section className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/60 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15">
          <Camera className="size-6 text-amber-400" />
        </div>
        <h2 className="mt-3 text-sm font-bold">2. Potret ruangan Anda</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-400">
          Gemma 4 mengenali tipe ruangan, memetakan zona kosong, membaca warna dinding, lalu memilih furniture 3D yang bisa
          langsung dicoba di ruangan lewat AR.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PhotoButton capture icon={Camera} label="Kamera" onFile={onFile} variant="primary" />
          <PhotoButton icon={ImageUp} label="Galeri" onFile={onFile} />
        </div>
        <button type="button" onClick={onDemo} className="mt-4 text-xs font-medium text-amber-300 underline underline-offset-4">
          Coba dengan foto contoh
        </button>
      </section>
    );
  }

  const view = result && !loading ? tab : 'orig';
  const room = findRoom(result?.room_identification.room_type ?? roomType);
  const captions = {
    orig: '📷 Foto ruangan (Before)',
    analysis: '📐 Peta spasial Gemma 4',
    render: '✨ Konsep desain (After)',
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-xl">
      <div className="grid grid-cols-3 gap-1 border-b border-stone-800 bg-stone-950 p-1.5 text-[11px]">
        {TABS.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            type="button"
            disabled={!result || loading}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition disabled:opacity-40 ${
              view === id ? 'bg-amber-500 font-bold text-stone-950 shadow' : 'font-medium text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icon className="size-3.5" />
            <span>
              {i + 1}. {label}
            </span>
          </button>
        ))}
      </div>

      <div className="relative bg-stone-950">
        {view === 'render' ? (
          <div className="relative" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
            <img
              key={render}
              src={render}
              alt="Konsep desain interior dari AI"
              onLoad={() => setRenderStatus('done')}
              onError={() => setRenderStatus('error')}
              className={`absolute inset-0 size-full object-cover transition duration-500 ${renderStatus === 'done' ? 'opacity-100' : 'opacity-0'}`}
            />
            {renderStatus !== 'done' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                {renderStatus === 'loading' ? (
                  <>
                    <LoaderCircle className="size-7 animate-spin text-amber-400" />
                    <p className="text-xs font-semibold text-amber-200">Melukis konsep desain… (10–30 detik)</p>
                  </>
                ) : (
                  <p className="text-xs text-red-300">Render gagal dimuat. Coba variasi baru.</p>
                )}
              </div>
            )}
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold text-stone-950 shadow-lg">
              <Sparkles className="size-3" /> DESAINAR Concept (After)
            </span>
            <button
              type="button"
              onClick={() => setVariant((v) => v + 1)}
              className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-stone-950/90 px-3 py-1.5 text-[11px] font-semibold text-amber-300 shadow-lg backdrop-blur-md hover:bg-stone-900"
            >
              <RefreshCw className="size-3" /> Variasi baru
            </button>
          </div>
        ) : (
          <div className="relative">
            <img
              src={photo.dataUrl}
              alt="Foto ruangan"
              className={`block w-full ${view === 'analysis' ? 'brightness-75 contrast-110' : ''}`}
            />
            {view === 'analysis' && (
              <AnalysisOverlay
                annotations={result.spatial_annotations}
                currentWall={result.color_and_wall_analysis.current_wall}
                paint={paint}
              />
            )}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-950/70 backdrop-blur-[2px]">
                <LoaderCircle className="size-7 animate-spin text-amber-400" />
                <p className="text-xs font-semibold text-amber-200">{STAGES[stage]}</p>
                <p className="text-[10px] text-stone-400">Gemma 4 sedang menganalisa foto Anda (±20 detik)</p>
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="absolute top-3 right-3 z-20">
            <PhotoButton capture icon={Camera} label="Potret Baru" onFile={onFile} variant="floating" />
          </div>
        )}

      </div>

      <div className="flex items-center justify-between gap-2 border-t border-stone-800/80 bg-stone-950 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {room && (
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wider text-stone-950 uppercase">
              {room.label}
            </span>
          )}
          <span className="rounded-md border border-stone-800 bg-stone-900 px-2 py-0.5 text-[10px] text-stone-200">
            Gaya: <strong className="text-amber-300">{styleName}</strong>
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-amber-300">{captions[view]}</span>
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-stone-800/80 bg-stone-950/60 p-3 text-[11px]">
        <span className="mr-1 shrink-0 text-stone-400">Tipe Ruang:</span>
        {ROOM_TYPES.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={loading}
            onClick={() => onRoomChange(r.id)}
            className={`shrink-0 rounded-lg border px-2.5 py-1 transition disabled:opacity-50 ${
              room?.id === r.id
                ? 'border-amber-500/40 bg-amber-500/20 font-semibold text-amber-300'
                : 'border-stone-800 bg-stone-900 font-medium text-stone-400 hover:text-stone-200'
            }`}
          >
            {r.emoji} {r.label}
          </button>
        ))}
      </div>
    </section>
  );
}
