import { Brain, Compass, Zap } from 'lucide-react';
import { MODES } from '../data/options.js';
import Brand from './Brand.jsx';

const ICONS = { instant: Zap, deep: Brain };

export default function Header({ mode, onModeChange }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary shadow-hover">
            <Compass className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg leading-none">
              <Brand />
            </h1>
            <p className="mt-1 text-[10.5px] leading-tight font-medium text-muted">AI Interior & AR Furniture</p>
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-hairline bg-subtle p-1 text-[11px]" title="Gemma 4 engine">
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
