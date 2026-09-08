import type { Skill, SkillStatus } from '../types';

const STATUS_OPTIONS: { value: SkillStatus; label: string; classes: string }[] = [
  { value: 'not-yet', label: 'Not yet', classes: 'bg-slate-100 text-slate-600 border-slate-300' },
  { value: 'in-progress', label: 'In progress', classes: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'achieved', label: 'Achieved', classes: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
];

const CATEGORY_LABEL: Record<Skill['category'], string> = {
  technical: 'Technical',
  hard: 'Hard skill',
  soft: 'Soft skill',
};

const CATEGORY_DOT: Record<Skill['category'], string> = {
  technical: 'bg-indigo-500',
  hard: 'bg-cyan-600',
  soft: 'bg-rose-500',
};

interface SkillChecklistProps {
  skills: Skill[];
  statusByName: Record<string, SkillStatus>;
  onChange: (skillName: string, status: SkillStatus) => void;
}

export default function SkillChecklist({ skills, statusByName, onChange }: SkillChecklistProps) {
  if (!skills.length) {
    return <p className="text-sm text-slate-500">No skills listed for this node.</p>;
  }

  const achievedCount = skills.filter((s) => statusByName[s.name] === 'achieved').length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {achievedCount} of {skills.length} skills marked achieved
        </p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${skills.length ? (achievedCount / skills.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {skills.map((skill) => {
          const status = statusByName[skill.name] ?? 'not-yet';
          return (
            <li
              key={skill.name}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[skill.category]}`} aria-hidden />
                <span className="text-sm text-slate-800">{skill.name}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {CATEGORY_LABEL[skill.category]}
                </span>
              </div>
              <div className="flex gap-1" role="radiogroup" aria-label={`Progress for ${skill.name}`}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={status === opt.value}
                    onClick={() => onChange(skill.name, opt.value)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      status === opt.value ? opt.classes : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
