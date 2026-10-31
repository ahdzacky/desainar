import { Landmark } from 'lucide-react';
import { STYLES } from '../data/options.js';

export default function StylePicker({ value, onChange }) {
  return (
    <section className="space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-400 uppercase">
        <Landmark className="size-3.5 text-amber-400" />
        1. Pilih Aliran Desain Interior
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={`rounded-xl border p-2.5 text-left transition ${
              value === style.id
                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                : 'border-stone-800 bg-stone-900/70 text-stone-300 hover:border-stone-700'
            }`}
          >
            <div className="text-xs font-semibold">
              {style.emoji} {style.label}
            </div>
            <div className="mt-0.5 text-[10px] text-stone-400">{style.hint}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
