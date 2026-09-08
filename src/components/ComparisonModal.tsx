import { useMemo, useState } from 'react';
import { NODES_BY_ID } from '../lib/tree';
import { loadNodeState } from '../lib/storage';
import type { Selections, SelectionSlot, StudentNodeState, CareerNode } from '../types';

interface ComparisonModalProps {
  selections: Selections;
  onClose: () => void;
}

const SLOT_LABEL: Record<SelectionSlot, string> = {
  main: 'Main Career',
  related1: 'Related Career 1',
  related2: 'Related Career 2',
};

const SLOT_ORDER: SelectionSlot[] = ['main', 'related1', 'related2'];

function skillSummary(node: CareerNode, state: StudentNodeState): string {
  if (!node.skills.length) return '—';
  return node.skills
    .map((s) => {
      const status = state.skillStatus[s.name] ?? 'not-yet';
      const mark = status === 'achieved' ? '✓' : status === 'in-progress' ? '~' : '✗';
      return `${mark} ${s.name}`;
    })
    .join('\n');
}

function buildPlainText(rows: { slot: SelectionSlot; node: CareerNode; state: StudentNodeState }[]): string {
  const lines: string[] = ['CAREER RESEARCH — PAPER HELPER COMPARISON', ''];
  for (const { slot, node, state } of rows) {
    lines.push(`=== ${SLOT_LABEL[slot]}: ${node.name} ===`);
    lines.push(`Job Description: ${node.description}`);
    lines.push(`Key Tasks: ${node.tasks.join('; ')}`);
    lines.push(
      `Education Required: ${node.education?.typicalEntry ?? ''} | Degrees: ${node.education?.degrees.join(', ') ?? ''} | Certifications: ${node.education?.certifications.join(', ') ?? ''}`,
    );
    lines.push(
      `Salary and Benefits: Median ${node.salary?.median != null ? `$${node.salary.median.toLocaleString('en-US')}` : 'n/a'} (${node.salary?.range}); Benefits: ${node.salary?.benefits.join(', ') ?? ''}`,
    );
    lines.push(
      `Job Availability — National: ${node.availability?.nationalGrowthPct != null ? `${node.availability.nationalGrowthPct}% growth` : 'n/a'}, ${node.availability?.annualOpenings != null ? `${node.availability.annualOpenings.toLocaleString('en-US')} annual openings` : 'n/a'} (${node.availability?.projectionWindow}). Local: ${state.localAvailability || '(not filled in yet)'}`,
    );
    lines.push(`Interview Notes: ${state.notes.filter(Boolean).join(' | ') || '(none yet)'}`);
    lines.push(`Essential Skills:\n${skillSummary(node, state)}`);
    lines.push(`Opinion on Career: ${state.opinion || '(not filled in yet)'}`);
    lines.push(`Sources: BLS: ${node.sources?.bls ?? 'n/a'} | O*NET: ${node.sources?.onet ?? 'n/a'}`);
    if (node.sources?.fallbackNote) lines.push(`Note: ${node.sources.fallbackNote}`);
    lines.push('');
  }
  return lines.join('\n');
}

export default function ComparisonModal({ selections, onClose }: ComparisonModalProps) {
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    return SLOT_ORDER.filter((slot) => selections[slot]).map((slot) => {
      const node = NODES_BY_ID.get(selections[slot]!)!;
      const state = loadNodeState(node.id);
      return { slot, node, state };
    });
  }, [selections]);

  const handleCopy = async () => {
    const text = buildPlainText(rows);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl print:max-h-none print:w-full print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Paper Helper — Comparison View</h2>
            <p className="text-sm text-slate-500">Mirrors your research paper's worksheet — transcribe or export.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? '✓ Copied!' : 'Copy as text'}
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Print / Save PDF
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-auto p-6">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">Select a Main Career and up to two Related Careers from the tree to compare them here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="w-40 border border-slate-200 p-2">Career</th>
                    <th className="border border-slate-200 p-2">Job Description</th>
                    <th className="border border-slate-200 p-2">Education Required</th>
                    <th className="border border-slate-200 p-2">Salary & Benefits</th>
                    <th className="border border-slate-200 p-2">Job Availability</th>
                    <th className="border border-slate-200 p-2">Interview Expert</th>
                    <th className="border border-slate-200 p-2">Opinion on Career</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ slot, node, state }) => (
                    <tr key={slot} className="align-top">
                      <td className="border border-slate-200 p-2 font-semibold text-slate-800">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-500">{SLOT_LABEL[slot]}</div>
                        {node.name}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">{node.description}</td>
                      <td className="border border-slate-200 p-2 text-slate-700">
                        <p className="mb-1">{node.education?.typicalEntry}</p>
                        <p className="text-xs text-slate-500">Certs: {node.education?.certifications.join(', ')}</p>
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">
                        <p className="font-semibold">
                          {node.salary?.median != null ? `$${node.salary.median.toLocaleString('en-US')}` : 'n/a'}
                        </p>
                        <p className="text-xs text-slate-500">{node.salary?.range}</p>
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">
                        <p>
                          <span className="font-semibold">National:</span>{' '}
                          {node.availability?.nationalGrowthPct != null ? `${node.availability.nationalGrowthPct}% growth` : 'n/a'},{' '}
                          {node.availability?.annualOpenings != null ? `${node.availability.annualOpenings.toLocaleString('en-US')} openings/yr` : 'n/a'}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold">Local:</span> {state.localAvailability || <em className="text-slate-400">not filled in</em>}
                        </p>
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">
                        {state.notes.filter(Boolean).length ? (
                          <ul className="list-disc space-y-1 pl-4">
                            {state.notes.filter(Boolean).map((n, i) => (
                              <li key={i}>{n}</li>
                            ))}
                          </ul>
                        ) : (
                          <em className="text-slate-400">No notes yet</em>
                        )}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">
                        {state.opinion || <em className="text-slate-400">Not filled in yet</em>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {rows.map(({ slot, node, state }) => (
                  <div key={slot} className="rounded-lg border border-slate-200 p-3">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">{node.name} — Skills Checklist</h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {node.skills.map((s) => {
                        const status = state.skillStatus[s.name] ?? 'not-yet';
                        return (
                          <li key={s.name} className="flex items-center justify-between gap-2">
                            <span>{s.name}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                status === 'achieved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : status === 'in-progress'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {status === 'achieved' ? 'Achieved' : status === 'in-progress' ? 'In progress' : 'Not yet'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-2 flex flex-col gap-0.5 text-xs">
                      {node.sources?.bls && (
                        <a href={node.sources.bls} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          BLS OOH profile ↗
                        </a>
                      )}
                      {node.sources?.onet && (
                        <a href={node.sources.onet} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          O*NET profile ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
