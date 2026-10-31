import { Brain, Compass, Zap } from 'lucide-react';
import { MODES } from '../data/options.js';

const ICONS = { instant: Zap, deep: Brain };

export default function Header({ mode, onModeChange }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-800/80 bg-stone-950/85 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <Compass className="size-5 text-stone-950" />
          </div>
          <div>
            <h1 className="text-lg leading-none font-extrabold tracking-wider">
              DES<span className="text-amber-400">AI</span>N<span className="text-amber-400">AR</span>
            </h1>
            <p className="mt-1 text-[10.5px] font-medium text-stone-400">AI Interior Design & AR Furniture</p>
          </div>
        </div>

        <div className="flex items-center rounded-xl border border-stone-800 bg-stone-900 p-1 text-[11px]" title="Mesin Gemma 4">
          {Object.entries(MODES).map(([id, engine]) => {
            const Icon = ICONS[id];
            const active = id === mode;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  active ? 'bg-amber-500 font-semibold text-stone-950' : 'font-medium text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="size-3" />
                <span>{engine.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
