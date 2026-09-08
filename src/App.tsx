import { useEffect, useMemo, useState } from 'react';
import TreeView from './components/TreeView';
import DetailDrawer from './components/DetailDrawer';
import ComparisonDock from './components/ComparisonDock';
import ComparisonModal from './components/ComparisonModal';
import { ALL_NODES, isSelectable } from './lib/tree';
import { loadSelections, saveSelections } from './lib/storage';
import type { Selections, SelectionSlot } from './types';

function App() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selections>(() => loadSelections());
  const [showComparison, setShowComparison] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    saveSelections(selections);
  }, [selections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showAbout) setShowAbout(false);
      else if (showComparison) setShowComparison(false);
      else if (activeNodeId) setActiveNodeId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAbout, showComparison, activeNodeId]);

  const handleSetSelection = (slot: SelectionSlot, id: string | null) => {
    setSelections((prev) => {
      const next = { ...prev, [slot]: id };
      // A career can't occupy two slots at once
      if (id) {
        (Object.keys(next) as SelectionSlot[]).forEach((s) => {
          if (s !== slot && next[s] === id) next[s] = null;
        });
      }
      return next;
    });
  };

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return ALL_NODES.filter((n) => isSelectable(n) && n.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">🌳 The Computing Tree of Life</h1>
          <p className="text-xs text-slate-500">
            An evolutionary map of computing &amp; IT careers — click any node to explore, then build your career research paper.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search careers…"
              className="w-52 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {searchResults.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setActiveNodeId(n.id);
                        setSearch('');
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-indigo-50"
                    >
                      {n.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => setShowAbout(true)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            How to use
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <TreeView onOpenNode={setActiveNodeId} selections={selections} activeNodeId={activeNodeId} />
      </main>

      <ComparisonDock
        selections={selections}
        onOpenNode={setActiveNodeId}
        onClearSlot={(slot) => handleSetSelection(slot, null)}
        onOpenComparison={() => setShowComparison(true)}
      />

      {activeNodeId && (
        <DetailDrawer
          nodeId={activeNodeId}
          onClose={() => setActiveNodeId(null)}
          onOpenNode={setActiveNodeId}
          selections={selections}
          onSetSelection={handleSetSelection}
        />
      )}

      {showComparison && <ComparisonModal selections={selections} onClose={() => setShowComparison(false)} />}

      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-bold text-slate-900">How to use this tool</h2>
            <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Pan and zoom the tree (drag to pan, scroll or the +/− buttons to zoom).</li>
              <li>Click any node to open its details. Branch nodes (green/teal) explain a whole field; solid-colored leaf nodes are specific careers.</li>
              <li>On a career's detail panel, fill in each worksheet section — education, salary, availability, an expert interview, your skills checklist, and your reflection. Everything saves automatically in this browser.</li>
              <li>Use the buttons at the top of a career's panel to set it as your <strong>Main Career</strong> or one of two <strong>Related Careers</strong> — pick related careers that branch near your main one on the tree.</li>
              <li>Open <strong>Compare &amp; Export</strong> at the bottom any time to see all three side by side, copy the text, or print/save a PDF for your paper.</li>
            </ol>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              ⚠ Salary and outlook figures here are approximate starting points for research, not live government data. Always confirm current numbers — and find your local/state data — using the BLS and O*NET links in each career panel.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
