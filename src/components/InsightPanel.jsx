import { Move, PaintBucket, Palette, Sparkles, Sun } from 'lucide-react';
import { inkFor } from '../lib/image.js';

const SHARES = [60, 30, 10];

export default function InsightPanel({ result, paintIndex, onPaintSelect }) {
  const { room_identification: room, spatial_metrics: metrics, color_and_wall_analysis: colors } = result;
  const wall = colors.current_wall;

  return (
    <>
      <section className="space-y-3 rounded-xl border border-hairline bg-surface p-5">
        <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Sparkles className="size-4 text-primary" /> DESAINAR Designer Critique
          </h3>
          <span className="shrink-0 rounded-sm border border-hairline bg-subtle px-2 py-0.5 text-base font-semibold text-slate">
            {room.estimated_room_scale} room
          </span>
        </div>
        {result.interior_critique && <p className="text-base leading-relaxed text-slate">{result.interior_critique}</p>}

        <div className="space-y-1">
          <div className="flex justify-between text-base text-muted">
            <span>Match with the target style</span>
            <span className="font-semibold text-primary">{metrics.style_alignment_score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-subtle ring-1 ring-hairline">
            <div className="h-full bg-primary" style={{ width: `${metrics.style_alignment_score}%` }} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {metrics.lighting_analysis && (
            <div className="rounded-lg border border-hairline bg-subtle p-3 text-base leading-snug text-slate">
              <div className="mb-1 flex items-center gap-1 font-semibold text-secondary">
                <Sun className="size-3.5" /> Lighting
              </div>
              {metrics.lighting_analysis}
            </div>
          )}
          {metrics.negative_space_balance && (
            <div className="rounded-lg border border-hairline bg-subtle p-3 text-base leading-snug text-slate">
              <div className="mb-1 flex items-center gap-1 font-semibold text-primary">
                <Move className="size-3.5" /> Circulation & Negative Space
              </div>
              {metrics.negative_space_balance}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-5">
        <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Palette className="size-4 text-primary" /> Wall & Colour Analysis (60-30-10)
          </h3>
          <span className="shrink-0 rounded-sm border border-chip-border bg-chip px-2 py-0.5 text-base font-semibold text-secondary">
            Colour Harmony AI
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-base text-muted">Colour proportions in the photo:</p>
          <div className="flex h-10 w-full overflow-hidden rounded-md border border-hairline text-base font-bold">
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

        <div className="flex items-start gap-3 rounded-lg border border-hairline bg-subtle p-3">
          <div className="size-10 shrink-0 rounded-md border border-hairline" style={{ background: wall.hex }} />
          <div className="text-base leading-snug">
            <div className="font-bold text-ink">
              Current wall: {wall.detected_name} <span className="font-mono font-medium text-muted">{wall.hex}</span>
            </div>
            <div className="text-muted">Undertone: {wall.undertone}</div>
            {wall.wall_critique && <p className="mt-1 text-slate">{wall.wall_critique}</p>}
          </div>
        </div>

        {colors.recommended_wall_palette.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-base font-semibold text-primary">
              <PaintBucket className="size-3.5" /> Recommended wall paint (tap to preview on the AR stage)
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {colors.recommended_wall_palette.map((paint, i) => (
                <button
                  key={paint.hex + i}
                  type="button"
                  onClick={() => onPaintSelect(i)}
                  className={`flex items-start gap-3 rounded-lg border bg-surface p-3 text-left transition hover:shadow-hover ${
                    paintIndex === i ? 'border-primary ring-2 ring-primary/15' : 'border-hairline hover:border-primary/50'
                  }`}
                >
                  <div className="size-10 shrink-0 rounded-md border border-hairline" style={{ background: paint.hex }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-bold tracking-wide uppercase ${paintIndex === i ? 'text-primary' : 'text-muted'}`}>
                        {paint.type}
                      </span>
                      <span className="font-mono text-base text-muted">{paint.hex}</span>
                    </div>
                    <div className="truncate text-base font-bold text-ink">{paint.name}</div>
                    <div className="mt-0.5 text-base leading-snug text-muted">
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
