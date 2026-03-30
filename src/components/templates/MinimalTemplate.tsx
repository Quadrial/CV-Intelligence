import type { TailoredCV } from '../../types/cv';

interface Props { cv: TailoredCV; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">{title}</h3>
      <div className="border-t border-gray-100 pt-3">{children}</div>
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('•') ? l : `• ${l}`);
  return (
    <ul className="space-y-0.5 mt-1">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-[11px] text-gray-600 leading-relaxed">
          <span className="text-gray-300 shrink-0">–</span>
          <span>{line.replace(/^•\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MinimalTemplate({ cv }: Props) {
  const links = [
    cv.linkedinUrl && { label: 'linkedin', url: cv.linkedinUrl },
    cv.githubUrl && { label: 'github', url: cv.githubUrl },
    cv.portfolioUrl && { label: 'portfolio', url: cv.portfolioUrl },
  ].filter(Boolean) as { label: string; url: string }[];

  const skills = (text: string) => text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="bg-white font-sans leading-relaxed p-12 min-h-[297mm] w-full text-gray-800">
      {/* Header — left-aligned, clean */}
      <div className="mb-8">
        <h1 className="text-[24px] font-light text-gray-900 tracking-wide">{cv.fullName}</h1>
        <p className="text-[11px] text-gray-400 mt-1">{[cv.email, cv.phone, cv.location].filter(Boolean).join('  ·  ')}</p>
        {links.length > 0 && (
          <p className="text-[11px] mt-0.5 text-gray-400">
            {links.map((l, i) => <span key={l.url}>{i > 0 && <span className="mx-1.5">·</span>}<a href={l.url} target="_blank" rel="noreferrer" className="hover:text-gray-700">{l.label}</a></span>)}
          </p>
        )}
      </div>

      {cv.tailoredSummary && <Section title="Summary"><p className="text-[11px] text-gray-600 leading-relaxed">{cv.tailoredSummary}</p></Section>}

      {cv.education?.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-1.5">
              <div><p className="text-[12px] font-medium text-gray-800">{edu.degree}</p><p className="text-[11px] text-gray-400">{edu.institution}{edu.honors ? `, ${edu.honors}` : ''}</p></div>
              <span className="text-[11px] text-gray-400 shrink-0 ml-4">{edu.graduationYear}</span>
            </div>
          ))}
        </Section>
      )}

      {(cv.technicalSkills || cv.softSkills) && (
        <Section title="Skills">
          {cv.technicalSkills && (
            <p className="text-[11px] text-gray-600 mb-1">
              <span className="font-medium text-gray-700">Technical — </span>
              {skills(cv.technicalSkills).join(', ')}
            </p>
          )}
          {cv.softSkills && (
            <p className="text-[11px] text-gray-600">
              <span className="font-medium text-gray-700">Soft — </span>
              {skills(cv.softSkills).join(', ')}
            </p>
          )}
        </Section>
      )}

      {cv.experience?.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <p className="text-[12px] font-medium text-gray-800">{exp.jobTitle} <span className="font-normal text-gray-400">· {exp.company}</span></p>
                <span className="text-[11px] text-gray-400 shrink-0 ml-4">{exp.startDate} – {exp.endDate ?? 'Present'}</span>
              </div>
              {exp.description && <BulletList text={exp.description} />}
            </div>
          ))}
        </Section>
      )}

      {cv.projects?.length > 0 && (
        <Section title="Projects">
          {cv.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <p className="text-[12px] font-medium text-gray-800">{proj.name}{proj.techStack && <span className="font-normal text-gray-400 text-[11px]"> · {proj.techStack}</span>}</p>
              {proj.description && <p className="text-[11px] text-gray-600 mt-0.5">{proj.description}</p>}
              {proj.contribution && <p className="text-[11px] text-gray-500 mt-0.5">{proj.contribution}</p>}
            </div>
          ))}
        </Section>
      )}

      {cv.certifications?.length > 0 && (
        <Section title="Certifications">
          {cv.certifications.map((cert, i) => (
            <p key={i} className="text-[11px] text-gray-600 mb-0.5">
              {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ''}{cert.year ? ` (${cert.year})` : ''}
            </p>
          ))}
        </Section>
      )}

      {cv.memberships && <Section title="Memberships"><BulletList text={cv.memberships} /></Section>}
      {cv.awards && <Section title="Awards"><BulletList text={cv.awards} /></Section>}

      {cv.publications?.length > 0 && (
        <Section title="Publications">
          {cv.publications.map((pub, i) => (
            <p key={i} className="text-[11px] text-gray-600 mb-0.5">
              {pub.title}{pub.year ? ` (${pub.year})` : ''}
              {pub.link && <a href={pub.link} target="_blank" rel="noreferrer" className="text-gray-400 ml-1 hover:underline">↗</a>}
            </p>
          ))}
        </Section>
      )}
    </div>
  );
}
