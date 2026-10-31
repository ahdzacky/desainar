import { Brain, Zap } from 'lucide-react';
import { MODES } from '../data/options.js';
import Brand from './Brand.jsx';

const ICONS = { instant: Zap, deep: Brain };

export default function Header({ mode, onModeChange }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="" width="40" height="40" className="size-10 shrink-0" />
          <div>
            <h1 className="text-xl leading-none">
              <Brand />
            </h1>
            <p className="mt-1 text-base leading-tight font-medium text-muted">AI Interior & AR Furniture</p>
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-hairline bg-subtle p-1 text-base" title="Gemma 4 engine">
          {Object.entries(MODES).map(([id, engine]) => {
            const Icon = ICONS[id];
            const active = id === mode;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 whitespace-nowrap transition ${
                  active ? 'bg-primary font-semibold text-white shadow-hover' : 'font-medium text-muted hover:text-ink'
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
