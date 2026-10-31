import { useEffect, useRef, useState } from 'react';
import { Layers, MapPin, View } from 'lucide-react';
import { CATEGORIES } from '../data/catalog.js';
import Brand from './Brand.jsx';

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
  const tint = paint?.hex ?? '#D5E3FD';

  return (
    <section className="space-y-2">
      <div className="px-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Layers className="size-4 text-primary" />
          <span>
            <Brand className="text-ink" /> Furniture WebAR Stage
          </span>
        </h3>
        <p className="text-[11px] text-muted">
          Wall simulation: <strong className="text-primary">{paint ? `${paint.name} (${paint.hex})` : 'original colour'}</strong>
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline shadow-hover">
        <model-viewer
          src={pick.item.glb}
          poster={pick.item.poster || undefined}
          alt={pick.item.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls
          camera-orbit="-30deg 75deg 175%"
          max-camera-orbit="auto auto 300%"
          touch-action="pan-y"
          shadow-intensity="1"
          environment-image="neutral"
          style={{ background: `radial-gradient(circle at 50% 45%, ${tint} 0%, #e6eeff 62%, #d5e3fd 100%)` }}
        >
          <div ref={hud} className="absolute top-3 right-3 left-3 z-20 rounded-lg border border-hairline bg-surface/95 p-3 text-xs shadow-overlay backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  {category.emoji} {category.label}
                </span>
                <span className="truncate text-xs font-bold text-ink">{pick.item.name}</span>
              </div>
              <span className="shrink-0 rounded-sm border border-chip-border bg-chip px-2 py-0.5 text-[10px] font-semibold text-secondary">
                {pick.match_score}% match
              </span>
            </div>
            <p className="text-[11px] leading-snug text-slate">{pick.design_reason}</p>
            <div className="mt-1.5 flex items-start gap-1.5 border-t border-hairline pt-1.5 text-[11px]">
              <MapPin className="mt-px size-3.5 shrink-0 text-primary" />
              <span className="shrink-0 font-semibold text-primary">AR placement:</span>
              <span className="text-slate">{pick.ar_placement_guide}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted">
              {pick.item.dims.w} × {pick.item.dims.d} × {pick.item.dims.h} m · 1:1 scale
            </div>
          </div>

          <div className="ar-scan pointer-events-none absolute bottom-[190px] left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-md border border-hairline bg-surface/95 px-4 py-2 text-xs font-medium whitespace-nowrap text-primary shadow-overlay backdrop-blur-md">
            👋 Move your phone slowly to scan the floor…
          </div>
          <div className="ar-lost absolute bottom-[190px] left-1/2 z-20 hidden -translate-x-1/2 rounded-md bg-error-soft px-4 py-2 text-xs font-medium whitespace-nowrap text-error-ink shadow-overlay">
            ⚠️ Floor not found yet. Point at a well-lit floor.
          </div>

          <button
            slot="ar-button"
            type="button"
            className="absolute bottom-[128px] left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-bold whitespace-nowrap text-white shadow-overlay transition hover:bg-primary-deep active:scale-95"
          >
            <View className="size-4" /> View in Your Room (AR)
          </button>

          <div ref={slider} className="absolute right-0 bottom-3 left-0 z-20 px-3">
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
              {picks.map((p, i) => (
                <button
                  key={p.item_id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex w-40 shrink-0 flex-col rounded-lg border bg-surface/95 p-2.5 text-left shadow-overlay backdrop-blur-md transition ${
                    i === active ? 'border-primary ring-2 ring-primary/15' : 'border-hairline hover:border-primary/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`truncate text-[10px] font-bold ${i === active ? 'text-primary' : 'text-muted'}`}>
                      {CATEGORIES[p.item.category].emoji} {CATEGORIES[p.item.category].label}
                    </span>
                    <span className="rounded-sm bg-subtle px-1.5 text-[10px] font-bold text-slate">{p.match_score}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {p.item.poster ? (
                      <img src={p.item.poster} alt="" className="size-9 rounded-md bg-subtle object-contain p-0.5" />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-md bg-subtle text-lg">
                        {CATEGORIES[p.item.category].emoji}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-ink">{p.item.name}</div>
                      <div className="truncate text-[10px] text-muted">{p.zone_label || p.role_badge}</div>
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
