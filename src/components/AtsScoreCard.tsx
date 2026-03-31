import type { AtsScore } from '../types/cv';

interface Props { ats: AtsScore; }

function scoreColor(score: number) {
  if (score >= 75) return { ring: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700', label: 'Strong Match', labelColor: 'text-emerald-400' };
  if (score >= 50) return { ring: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700', label: 'Moderate Match', labelColor: 'text-amber-400' };
  return { ring: 'text-red-400', bg: 'bg-red-900/30 border-red-700', label: 'Weak Match', labelColor: 'text-red-400' };
}

export default function AtsScoreCard({ ats }: Props) {
  const c = scoreColor(ats.score);
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (ats.score / 100) * circumference;

  return (
    <div className={`rounded-xl border p-5 ${c.bg}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Circular gauge */}
        <div className="relative shrink-0 w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-700" />
            <circle
              cx="40" cy="40" r="36" fill="none" strokeWidth="7"
              stroke="currentColor" className={c.ring}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${c.ring}`}>{ats.score}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wide">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm">ATS Score</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.labelColor}`}>{c.label}</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">{ats.feedback}</p>
        </div>
      </div>

      {/* Keywords */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ats.matchedKeywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-1.5">✓ Matched Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {ats.matchedKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-[11px] rounded-full">{kw}</span>
              ))}
            </div>
          </div>
        )}
        {ats.missingKeywords.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-red-400 mb-1.5">✗ Still Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {ats.missingKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-900/40 border border-red-700 text-red-300 text-[11px] rounded-full">{kw}</span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">These couldn't be added — consider addressing them in your cover letter or interview.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-xs">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All key job requirements are covered in your CV.
          </div>
        )}
      </div>
      {ats.missingKeywords.length < 4 && ats.score >= 70 && (
        <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-700 pt-3">
          ✦ Relevant missing keywords were automatically added to your skills section to improve your ATS match.
        </p>
      )}
    </div>
  );
}
