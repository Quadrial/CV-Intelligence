import type { TailoredCV } from '../../types/cv';

interface Props { cv: TailoredCV; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800 whitespace-nowrap">{title}</h3>
        <div className="flex-1 border-t-2 border-gray-800" />
      </div>
      {children}
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('•') ? l : `• ${l}`);
  return (
    <ul className="space-y-0.5 mt-1">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-[11px] text-gray-700 leading-relaxed">
          <span className="text-gray-500 shrink-0">•</span>
          <span>{line.replace(/^•\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ClassicTemplate({ cv }: Props) {
  const links = [
    cv.linkedinUrl && { label: 'LinkedIn', url: cv.linkedinUrl },
    cv.githubUrl && { label: 'GitHub', url: cv.githubUrl },
    cv.portfolioUrl && { label: 'Portfolio', url: cv.portfolioUrl },
  ].filter(Boolean) as { label: string; url: string }[];

  const skills = (text: string) => text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

  return (
    <div className="bg-white font-serif leading-relaxed p-10 min-h-[297mm] w-full text-gray-900">
      {/* Classic centered header */}
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-[26px] font-bold tracking-wide uppercase">{cv.fullName}</h1>
        <p className="text-[11px] text-gray-600 mt-1">{[cv.email, cv.phone, cv.location].filter(Boolean).join('  |  ')}</p>
        {links.length > 0 && (
          <p className="text-[11px] text-gray-500 mt-0.5">
            {links.map((l, i) => <span key={l.url}>{i > 0 && <span className="mx-2">|</span>}<a href={l.url} target="_blank" rel="noreferrer" className="hover:underline">{l.label}</a></span>)}
          </p>
        )}
      </div>

      {cv.tailoredSummary && (
        <Section title="Professional Summary">
          <p className="text-[11px] text-gray-700 leading-relaxed italic">{cv.tailoredSummary}</p>
        </Section>
      )}

      {cv.education?.length > 0 && (
        <Section title="Education">
          {cv.education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-2">
              <div>
                <p className="font-bold text-[12px]">{edu.degree}</p>
                <p className="text-[11px] text-gray-600">{edu.institution}{edu.honors ? ` — ${edu.honors}` : ''}</p>
              </div>
              <span className="text-[11px] text-gray-500 shrink-0 ml-4">{edu.graduationYear}</span>
            </div>
          ))}
        </Section>
      )}

      {(cv.technicalSkills || cv.softSkills) && (
        <Section title="Core Competencies">
          {cv.technicalSkills && (
            <p className="text-[11px] text-gray-700 mb-1">
              <span className="font-bold">Technical: </span>{skills(cv.technicalSkills).join(' · ')}
            </p>
          )}
          {cv.softSkills && (
            <p className="text-[11px] text-gray-700">
              <span className="font-bold">Soft Skills: </span>{skills(cv.softSkills).join(' · ')}
            </p>
          )}
        </Section>
      )}

      {cv.experience?.length > 0 && (
        <Section title="Professional Experience">
          {cv.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-[12px]">{exp.jobTitle}, <span className="font-normal italic">{exp.company}</span></p>
                <span className="text-[11px] text-gray-500 shrink-0 ml-4">{exp.startDate} – {exp.endDate ?? 'Present'}</span>
              </div>
              {exp.description && <BulletList text={exp.description} />}
            </div>
          ))}
        </Section>
      )}

      {cv.projects?.length > 0 && (
        <Section title="Technical Projects">
          {cv.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <p className="font-bold text-[12px]">{proj.name}{proj.techStack && <span className="font-normal text-gray-500 text-[11px]"> ({proj.techStack})</span>}</p>
              {proj.description && <p className="text-[11px] text-gray-700 mt-0.5">{proj.description}</p>}
              {proj.contribution && <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-semibold">Contribution: </span>{proj.contribution}</p>}
            </div>
          ))}
        </Section>
      )}

      {cv.certifications?.length > 0 && (
        <Section title="Certifications">
          <ul className="space-y-0.5">
            {cv.certifications.map((cert, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-700">
                <span className="shrink-0">•</span>
                <span><span className="font-semibold">{cert.name}</span>{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.year ? ` (${cert.year})` : ''}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cv.memberships && <Section title="Professional Memberships"><BulletList text={cv.memberships} /></Section>}
      {cv.awards && <Section title="Awards & Honors"><BulletList text={cv.awards} /></Section>}

      {cv.publications?.length > 0 && (
        <Section title="Research & Publications">
          <ul className="space-y-0.5">
            {cv.publications.map((pub, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-700">
                <span className="shrink-0">•</span>
                <span>{pub.title}{pub.year ? ` (${pub.year})` : ''}{pub.link && <a href={pub.link} target="_blank" rel="noreferrer" className="text-gray-500 ml-1 hover:underline">↗</a>}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
