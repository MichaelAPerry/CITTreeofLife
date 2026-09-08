import { NODES_BY_ID } from '../lib/tree';
import type { Selections, SelectionSlot } from '../types';

interface ComparisonDockProps {
  selections: Selections;
  onOpenNode: (id: string) => void;
  onClearSlot: (slot: SelectionSlot) => void;
  onOpenComparison: () => void;
}

const SLOT_META: { slot: SelectionSlot; label: string; dot: string }[] = [
  { slot: 'main', label: 'Main Career', dot: 'bg-yellow-400' },
  { slot: 'related1', label: 'Related Career 1', dot: 'bg-blue-400' },
  { slot: 'related2', label: 'Related Career 2', dot: 'bg-purple-400' },
];

export default function ComparisonDock({ selections, onOpenNode, onClearSlot, onOpenComparison }: ComparisonDockProps) {
  const filledCount = SLOT_META.filter((s) => selections[s.slot]).length;

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Paper Helper</span>
          {SLOT_META.map(({ slot, label, dot }) => {
            const id = selections[slot];
            const node = id ? NODES_BY_ID.get(id) : null;
            return (
              <div
                key={slot}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                  node ? 'border-slate-300 bg-slate-50' : 'border-dashed border-slate-300 bg-white text-slate-400'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="font-medium text-slate-500">{label}:</span>
                {node ? (
                  <>
                    <button className="font-semibold text-slate-800 hover:underline" onClick={() => onOpenNode(node.id)}>
                      {node.name}
                    </button>
                    <button
                      onClick={() => onClearSlot(slot)}
                      aria-label={`Remove ${label}`}
                      className="ml-1 text-slate-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span>Not selected</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onOpenComparison}
          disabled={filledCount === 0}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Compare & Export ({filledCount}/3)
        </button>
      </div>
    </div>
  );
}
