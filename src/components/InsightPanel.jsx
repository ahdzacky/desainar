import { PaintBucket, Palette, Sparkles, Sun, Move } from 'lucide-react';
import { inkFor } from '../lib/image.js';

const SHARES = [60, 30, 10];

export default function InsightPanel({ result, paintIndex, onPaintSelect }) {
  const { room_identification: room, spatial_metrics: metrics, color_and_wall_analysis: colors } = result;
  const wall = colors.current_wall;

  return (
    <>
      <section className="space-y-3 rounded-2xl border border-stone-800 bg-stone-900/90 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-amber-400" /> Kritik Desainer DESAINAR
          </h3>
          <span className="rounded-full border border-stone-800 bg-stone-950 px-2.5 py-0.5 text-[11px] text-stone-400">
            Skala: {room.estimated_room_scale}
          </span>
        </div>
        {result.interior_critique && <p className="text-sm leading-relaxed text-stone-200">{result.interior_critique}</p>}
        {room.current_vibe && <p className="text-xs text-stone-400">Suasana sekarang: {room.current_vibe}</p>}

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-stone-400">
            <span>Kesesuaian dengan gaya target</span>
            <span className="font-semibold text-amber-300">{metrics.style_alignment_score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-800">
            <div className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500" style={{ width: `${metrics.style_alignment_score}%` }} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {metrics.lighting_analysis && (
            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3 text-[11px] leading-snug text-stone-300">
              <div className="mb-1 flex items-center gap-1 font-semibold text-sky-300">
                <Sun className="size-3.5" /> Pencahayaan
              </div>
              {metrics.lighting_analysis}
            </div>
          )}
          {metrics.negative_space_balance && (
            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3 text-[11px] leading-snug text-stone-300">
              <div className="mb-1 flex items-center gap-1 font-semibold text-emerald-300">
                <Move className="size-3.5" /> Sirkulasi & Ruang Kosong
              </div>
              {metrics.negative_space_balance}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-800 bg-stone-900/90 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Palette className="size-4 text-amber-400" /> Analisis Warna & Dinding (60-30-10)
          </h3>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] text-stone-400">Proporsi warna di foto saat ini:</p>
          <div className="flex h-8 w-full overflow-hidden rounded-xl border border-stone-700/70 text-[10px] font-bold">
            {colors.detected_room_palette.map((c, i) => (
              <div
                key={c.role}
                title={`${c.role}: ${c.name} ${c.hex}`}
                style={{ width: `${SHARES[i]}%`, background: c.hex, color: inkFor(c.hex) }}
                className="flex items-center justify-center truncate px-1"
              >
                {SHARES[i]}%{i < 2 && ` ${c.name}`}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-950/70 p-3">
          <div className="size-10 shrink-0 rounded-lg border border-stone-700" style={{ background: wall.hex }} />
          <div className="text-[11px] leading-snug">
            <div className="font-bold text-stone-200">
              Dinding sekarang: {wall.detected_name} <span className="font-mono text-stone-400">{wall.hex}</span>
            </div>
            <div className="text-stone-400">Undertone: {wall.undertone}</div>
            {wall.wall_critique && <p className="mt-1 text-stone-300">{wall.wall_critique}</p>}
          </div>
        </div>

        {colors.recommended_wall_palette.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <PaintBucket className="size-3.5" /> Rekomendasi cat dinding (klik untuk simulasi di panggung AR)
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {colors.recommended_wall_palette.map((paint, i) => (
                <button
                  key={paint.hex + i}
                  type="button"
                  onClick={() => onPaintSelect(i)}
                  className={`flex items-start gap-3 rounded-xl border-2 bg-stone-950/80 p-3 text-left transition hover:bg-stone-950 ${
                    paintIndex === i ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="size-10 shrink-0 rounded-lg border border-stone-700" style={{ background: paint.hex }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase ${paintIndex === i ? 'text-amber-400' : 'text-stone-400'}`}>
                        {paint.type}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">{paint.hex}</span>
                    </div>
                    <div className="truncate text-xs font-bold text-white">{paint.name}</div>
                    <div className="mt-0.5 text-[10px] leading-snug text-stone-400">
                      {paint.finish}
                      {paint.reason && ` • ${paint.reason}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
