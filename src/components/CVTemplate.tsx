import type { TailoredCV } from '../types/cv';

interface Props { cv: TailoredCV; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => (l.startsWith('•') ? l : `• ${l}`));
  return (
    <ul className="space-y-0.5 mt-1">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-[11px] text-gray-700 leading-relaxed">
          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
          <span>{line.replace(/^•\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillPills({ text }: { text: string }) {
  const items = text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((skill, i) => (
        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded border border-indigo-100 font-medium">
          {skill}
        </span>
      ))}
    </div>
  );
}

export default function CVTemplate({ cv }: Props) {
  const links = [
    cv.linkedinUrl && { label: 'LinkedIn', url: cv.linkedinUrl },
    cv.githubUrl && { label: 'GitHub', url: cv.githubUrl },
    cv.portfolioUrl && { label: 'Portfolio', url: cv.portfolioUrl },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div className="bg-white text-gray-800 font-sans leading-relaxed p-10 min-h-[297mm] w-full">

      {/* ── Header ── */}
      <div className="text-center mb-6">
        <h1 className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">{cv.fullName}</h1>
        <p className="text-[11px] text-gray-500 mt-1.5 tracking-wide">
          {[cv.email, cv.phone, cv.location].filter(Boolean).join('  ·  ')}
        </p>
        {links.length > 0 && (
          <p className="text-[11px] mt-1">
            {links.map((l, i) => (
              <span key={l.url}>
                {i > 0 && <span className="text-gray-300 mx-1">|</span>}
                <a href={l.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{l.label}</a>
              </span>
            ))}
          </p>
        )}
        <div className="mt-4 border-t-2 border-indigo-500" />
      </div>

      {/* ── 1. Professional Summary ── */}
      {cv.tailoredSummary && (
        <Section title="Professional Summary">
          <p className="text-[11px] text-gray-700 leading-relaxed">{cv.tailoredSummary}</p>
        </Section>
      )}

      {/* ── 2. Education ── */}
      {cv.education?.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <div key={i} className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-[13px] text-gray-900">{edu.degree}</p>
                <p className="text-[11px] text-gray-500">{edu.institution}{edu.honors ? ` — ${edu.honors}` : ''}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 ml-4">{edu.graduationYear}</span>
            </div>
          ))}
        </Section>
      )}

      {/* ── 3. Core Competencies ── */}
      {(cv.technicalSkills || cv.softSkills) && (
        <Section title="Core Competencies">
          {cv.technicalSkills && (
            <div className="mb-2">
              <p className="text-[11px] font-semibold text-gray-700 mb-1">Technical Skills</p>
              <SkillPills text={cv.technicalSkills} />
            </div>
          )}
          {cv.softSkills && (
            <div>
              <p className="text-[11px] font-semibold text-gray-700 mb-1">Soft Skills</p>
              <SkillPills text={cv.softSkills} />
            </div>
          )}
        </Section>
      )}

      {/* ── 4. Work Experience ── */}
      {cv.experience?.length > 0 && (
        <Section title="Work Experience">
          {cv.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold text-[13px] text-gray-900">{exp.jobTitle}</p>
                <span className="text-[11px] text-gray-400 shrink-0 ml-4">
                  {exp.startDate} – {exp.endDate ?? 'Present'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 italic">{exp.company}</p>
              {exp.description && <BulletList text={exp.description} />}
            </div>
          ))}
        </Section>
      )}

      {/* ── 5. Technical Projects ── */}
      {cv.projects?.length > 0 && (
        <Section title="Technical Projects">
          {cv.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-[13px] text-gray-900">{proj.name}</p>
                {proj.techStack && (
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {proj.techStack}
                  </span>
                )}
              </div>
              {proj.description && <p className="text-[11px] text-gray-600 mt-0.5">{proj.description}</p>}
              {proj.contribution && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  <span className="font-medium text-gray-700">Contribution: </span>{proj.contribution}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── 6. Certifications ── */}
      {cv.certifications?.length > 0 && (
        <Section title="Certifications">
          <ul className="space-y-1">
            {cv.certifications.map((cert, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-700">
                <span className="text-gray-400 shrink-0">•</span>
                <span>
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer ? ` — ${cert.issuer}` : ''}
                  {cert.year ? ` (${cert.year})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── 7. Professional Memberships ── */}
      {cv.memberships && (
        <Section title="Professional Memberships">
          <BulletList text={cv.memberships} />
        </Section>
      )}

      {/* ── 8. Awards & Honors ── */}
      {cv.awards && (
        <Section title="Awards & Honors">
          <BulletList text={cv.awards} />
        </Section>
      )}

      {/* ── 9. Research & Publications ── */}
      {cv.publications?.length > 0 && (
        <Section title="Research & Publications">
          <ul className="space-y-1">
            {cv.publications.map((pub, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-700">
                <span className="text-gray-400 shrink-0">•</span>
                <span>
                  {pub.title}{pub.year ? ` (${pub.year})` : ''}
                  {pub.link && (
                    <a href={pub.link} target="_blank" rel="noreferrer" className="text-indigo-500 ml-1 hover:underline">↗</a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
