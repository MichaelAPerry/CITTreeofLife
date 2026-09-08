import type { ReactNode } from 'react';
import { NODES_BY_ID, getChildren, getAncestorChain, isSelectable } from '../lib/tree';
import type { Selections, SelectionSlot } from '../types';
import { useNodeState } from '../hooks/useNodeState';
import SkillChecklist from './SkillChecklist';
import InterviewExpert from './InterviewExpert';

interface DetailDrawerProps {
  nodeId: string;
  onClose: () => void;
  onOpenNode: (id: string) => void;
  selections: Selections;
  onSetSelection: (slot: SelectionSlot, id: string | null) => void;
}

const TYPE_LABEL: Record<string, string> = {
  root: 'Common Ancestor',
  domain: 'Domain',
  specialization: 'Specialization',
  career: 'Career',
  emerging: 'Emerging Career',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  root: 'bg-slate-800 text-white',
  domain: 'bg-emerald-100 text-emerald-800',
  specialization: 'bg-cyan-100 text-cyan-800',
  career: 'bg-indigo-100 text-indigo-800',
  emerging: 'bg-amber-100 text-amber-800',
};

function formatCurrency(n: number | null): string {
  if (n == null) return 'Not yet available';
  return `$${n.toLocaleString('en-US')}`;
}

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-100 py-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function DetailDrawer({ nodeId, onClose, onOpenNode, selections, onSetSelection }: DetailDrawerProps) {
  const node = NODES_BY_ID.get(nodeId);
  const [state, setState] = useNodeState(nodeId);

  if (!node) return null;

  const selectable = isSelectable(node);
  const mySlots = (Object.keys(selections) as SelectionSlot[]).filter((slot) => selections[slot] === nodeId);
  const ancestors = getAncestorChain(nodeId);
  const children = getChildren(nodeId);

  const slotButton = (slot: SelectionSlot, label: string) => {
    const isMine = selections[slot] === nodeId;
    const occupiedByOther = selections[slot] && selections[slot] !== nodeId;
    return (
      <button
        key={slot}
        onClick={() => onSetSelection(slot, isMine ? null : nodeId)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          isMine
            ? 'border-transparent bg-indigo-600 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
        }`}
        title={occupiedByOther ? `Replaces the current ${label}` : undefined}
      >
        {isMine ? `✓ ${label}` : `Set as ${label}`}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${node.name} details`}
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_BADGE_CLASS[node.type]}`}>
                  {TYPE_LABEL[node.type]}
                </span>
                {mySlots.map((slot) => (
                  <span key={slot} className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">
                    {slot === 'main' ? 'Your Main Career' : slot === 'related1' ? 'Related Career 1' : 'Related Career 2'}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{node.name}</h2>
              <p className="text-sm text-slate-500">{node.tagline}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close details"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <p className="mb-2 truncate text-xs text-slate-400">
            {ancestors.map((a) => a.name).join(' → ')}
          </p>

          {selectable && (
            <div className="flex flex-wrap gap-2 pt-1">
              {slotButton('main', 'Main Career')}
              {slotButton('related1', 'Related Career 1')}
              {slotButton('related2', 'Related Career 2')}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          <section className="border-b border-slate-100 py-5">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Overview</h3>
            <p className="text-sm leading-relaxed text-slate-700">{node.description}</p>
          </section>

          {!selectable && children.length > 0 && (
            <section className="border-b border-slate-100 py-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Branches from here</h3>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenNode(c.id)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {c.name} →
                  </button>
                ))}
              </div>
            </section>
          )}

          {selectable && (
            <>
              <Section title="Job Overview & Tasks" icon="🧭">
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                  {node.tasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Education Required" icon="🎓">
                <p className="mb-2 text-sm text-slate-700">
                  <span className="font-semibold">Typical entry:</span> {node.education?.typicalEntry}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Common degrees</p>
                    <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                      {node.education?.degrees.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Helpful certifications</p>
                    <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                      {node.education?.certifications.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>

              <Section title="Salary & Benefits" icon="💵">
                <div className="mb-3 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(node.salary?.median ?? null)}</span>
                  <span className="text-xs text-slate-500">median {node.salary?.period}, national (approx.)</span>
                </div>
                <p className="mb-2 text-sm text-slate-600">Typical range: {node.salary?.range}</p>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Common benefits</p>
                <ul className="flex flex-wrap gap-1.5">
                  {node.salary?.benefits.map((b) => (
                    <li key={b} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {b}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Job Availability" icon="📈">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">National (BLS/O*NET)</p>
                    <p className="text-sm text-slate-700">
                      Growth: <span className="font-semibold">{node.availability?.nationalGrowthPct != null ? `${node.availability.nationalGrowthPct}%` : 'n/a'}</span>{' '}
                      <span className="text-slate-500">({node.availability?.nationalGrowthLabel})</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Annual openings:{' '}
                      <span className="font-semibold">
                        {node.availability?.annualOpenings != null ? node.availability.annualOpenings.toLocaleString('en-US') : 'n/a'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">Projection window: {node.availability?.projectionWindow}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Local / state outlook</p>
                    <textarea
                      value={state.localAvailability}
                      onChange={(e) => setState({ ...state, localAvailability: e.target.value })}
                      rows={3}
                      placeholder="Look up your state on O*NET's 'State Wage & Employment' data or your local labor office, then jot down what you find here."
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Interview an Expert" icon="🎥">
                <InterviewExpert
                  careerName={node.name}
                  videos={node.videos}
                  searchQuery={node.videoSearchQuery}
                  customVideoId={state.customVideoId}
                  onCustomVideoIdChange={(id) => setState({ ...state, customVideoId: id })}
                  notes={state.notes}
                  onNoteChange={(i, value) => {
                    const next = [...state.notes] as typeof state.notes;
                    next[i] = value;
                    setState({ ...state, notes: next });
                  }}
                />
              </Section>

              <Section title="Essential Skills & Requirements" icon="✅">
                <SkillChecklist
                  skills={node.skills}
                  statusByName={state.skillStatus}
                  onChange={(skillName, status) =>
                    setState({ ...state, skillStatus: { ...state.skillStatus, [skillName]: status } })
                  }
                />
              </Section>

              <Section title="Your Reflection" icon="💭">
                <label className="mb-1.5 block text-sm text-slate-600">
                  Would you consider this career? Why or why not?
                </label>
                <textarea
                  value={state.opinion}
                  onChange={(e) => setState({ ...state, opinion: e.target.value })}
                  rows={5}
                  placeholder="Draft your reflection here — you can copy it into your paper later."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </Section>

              <Section title="Sources" icon="🔗">
                <div className="flex flex-col gap-2">
                  {node.sources?.bls && (
                    <a
                      href={node.sources.bls}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      ↗ BLS Occupational Outlook Handbook profile
                    </a>
                  )}
                  {node.sources?.onet && (
                    <a
                      href={node.sources.onet}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      ↗ O*NET Online profile
                    </a>
                  )}
                  {node.sources?.fallbackNote && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                      ⚠ {node.sources.fallbackNote}
                    </p>
                  )}
                  {!node.sources?.bls && (
                    <p className="text-xs text-slate-400">
                      No official BLS profile yet — see the note above for the closest related occupation.
                    </p>
                  )}
                </div>
              </Section>
            </>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
