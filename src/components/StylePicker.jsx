import { Landmark } from 'lucide-react';
import { STYLES } from '../data/options.js';

export default function StylePicker({ value, onChange }) {
  return (
    <section className="space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate uppercase">
        <Landmark className="size-3.5 text-primary" />
        1. Choose an interior style
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={`rounded-lg border p-2.5 text-left transition ${
              value === style.id
                ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/15'
                : 'border-hairline bg-surface text-ink hover:border-primary/50 hover:shadow-hover'
            }`}
          >
            <div className="text-xs font-semibold">
              {style.emoji} {style.label}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">{style.hint}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
