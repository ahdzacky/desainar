import { useEffect, useRef, useState } from 'react';
import { Layers, View } from 'lucide-react';
import { CATEGORIES } from '../data/catalog.js';

export default function ArStage({ picks, paint }) {
  const [active, setActive] = useState(0);
  const hud = useRef(null);
  const slider = useRef(null);

  useEffect(() => setActive(0), [picks]);

  // During a WebXR session, taps on the HUD or carousel must not move the model.
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    const els = [hud.current, slider.current].filter(Boolean);
    els.forEach((el) => el.addEventListener('beforexrselect', stop));
    return () => els.forEach((el) => el.removeEventListener('beforexrselect', stop));
  }, []);

  if (!picks.length) return null;
  const pick = picks[Math.min(active, picks.length - 1)];
  const category = CATEGORIES[pick.item.category];
  const tint = paint?.hex ?? '#35302B';

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Layers className="size-4 text-amber-400" />
          <span>
            DES<span className="text-amber-400">AI</span>N<span className="text-amber-400">AR</span> Furniture WebAR Stage
          </span>
        </h3>
        <p className="text-[11px] text-stone-400">
          Simulasi dinding: <strong className="text-amber-300">{paint ? `${paint.name} (${paint.hex})` : 'warna asli'}</strong>
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-800 shadow-2xl">
        <model-viewer
          src={pick.item.glb}
          poster={pick.item.poster || undefined}
          alt={pick.item.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          environment-image="neutral"
          style={{ background: `radial-gradient(circle at 50% 40%, ${tint}66 0%, #0c0a09 85%)` }}
        >
          <div ref={hud} className="absolute top-3 right-3 left-3 z-20 rounded-2xl border border-stone-800 bg-stone-950/85 p-3 text-xs shadow-lg backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-stone-950 uppercase">
                  {category.emoji} {category.label}
                </span>
                <span className="truncate text-xs font-bold text-white">{pick.item.name}</span>
              </div>
              <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {pick.match_score}% Match
              </span>
            </div>
            <p className="text-[11px] leading-snug text-stone-300">{pick.design_reason}</p>
            <div className="mt-1.5 flex items-start gap-1.5 border-t border-stone-800/80 pt-1.5 text-[11px] font-medium text-emerald-400">
              <span className="shrink-0">📍 Posisi AR:</span>
              <span className="text-stone-200">{pick.ar_placement_guide}</span>
            </div>
            <div className="mt-1 text-[10px] text-stone-500">
              {pick.item.dims.w} × {pick.item.dims.d} × {pick.item.dims.h} m · skala 1:1
            </div>
          </div>

          <div className="ar-scan pointer-events-none absolute bottom-[190px] left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/40 bg-stone-950/80 px-4 py-2 text-xs whitespace-nowrap text-amber-300 shadow-xl backdrop-blur-md">
            👋 Gerakkan HP perlahan untuk memindai lantai…
          </div>
          <div className="ar-lost absolute bottom-[190px] left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-red-700 bg-red-950/90 px-4 py-2 text-xs whitespace-nowrap text-red-200 shadow-lg">
            ⚠️ Lantai belum terdeteksi. Arahkan ke lantai yang terang.
          </div>

          <button
            slot="ar-button"
            type="button"
            className="absolute bottom-[128px] left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs font-bold whitespace-nowrap text-stone-950 shadow-xl shadow-amber-500/30 transition hover:from-amber-400 hover:to-orange-400 active:scale-95"
          >
            <View className="size-4" /> Lihat di Ruangan Anda (AR)
          </button>

          <div ref={slider} className="absolute right-0 bottom-3 left-0 z-20 px-3">
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
              {picks.map((p, i) => (
                <button
                  key={p.item_id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex w-40 shrink-0 flex-col rounded-2xl border-2 bg-stone-950/90 p-2.5 text-left shadow-lg backdrop-blur-md transition ${
                    i === active ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`truncate text-[10px] font-bold ${i === active ? 'text-amber-400' : 'text-stone-400'}`}>
                      {CATEGORIES[p.item.category].emoji} {CATEGORIES[p.item.category].label}
                    </span>
                    <span className="rounded bg-stone-800 px-1.5 text-[10px] font-bold text-stone-300">{p.match_score}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {p.item.poster ? (
                      <img src={p.item.poster} alt="" className="size-9 rounded-lg bg-stone-900 object-contain p-0.5" />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-lg">
                        {CATEGORIES[p.item.category].emoji}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{p.item.name}</div>
                      <div className="truncate text-[10px] text-stone-400">{p.zone_label || p.role_badge}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </model-viewer>
      </div>
    </section>
  );
}
