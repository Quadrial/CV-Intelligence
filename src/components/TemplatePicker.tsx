import type { TemplateId } from './CVTemplate';

interface Props {
  selected: TemplateId;
  onChange: (t: TemplateId) => void;
}

const templates: { id: TemplateId; label: string; description: string; accent: string }[] = [
  { id: 'modern',  label: 'Modern',  description: 'Coloured header, skill pills', accent: 'border-indigo-500 bg-indigo-900/20 text-indigo-300' },
  { id: 'minimal', label: 'Minimal', description: 'Clean, whitespace-focused',    accent: 'border-slate-400 bg-slate-700/30 text-slate-300' },
  { id: 'classic', label: 'Classic', description: 'Traditional serif layout',     accent: 'border-amber-500 bg-amber-900/20 text-amber-300' },
];

export default function TemplatePicker({ selected, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {templates.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 px-4 py-3 rounded-xl border-2 text-left transition ${
            selected === t.id ? t.accent : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
          }`}
        >
          <p className="text-sm font-semibold">{t.label}</p>
          <p className="text-xs opacity-70 mt-0.5">{t.description}</p>
        </button>
      ))}
    </div>
  );
}
