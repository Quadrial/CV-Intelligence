import { useState } from 'react';
import type { TailoredCV, WorkExperience, TechnicalProject, Education, Certification, Publication, Reference } from '../types/cv';

interface Props {
  cv: TailoredCV;
  onSave: (updated: TailoredCV) => void;
  onCancel: () => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';
const textareaCls = inputCls + ' resize-none';

function SectionHead({ title }: { title: string }) {
  return <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide mb-3">{title}</h4>;
}

export default function EditableCVForm({ cv, onSave, onCancel }: Props) {
  const [d, setD] = useState<TailoredCV>({ ...cv });

  const set = (field: keyof TailoredCV, value: unknown) =>
    setD(prev => ({ ...prev, [field]: value }));

  // ── list helpers ──────────────────────────────────────────────────────────
  function updateList<T>(field: keyof TailoredCV, idx: number, patch: Partial<T>) {
    setD(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).map((item, i) => i === idx ? { ...item, ...patch } : item),
    }));
  }
  function removeFromList(field: keyof TailoredCV, idx: number) {
    setD(prev => ({ ...prev, [field]: (prev[field] as unknown[]).filter((_, i) => i !== idx) }));
  }
  function addToList<T>(field: keyof TailoredCV, empty: T) {
    setD(prev => ({ ...prev, [field]: [...(prev[field] as T[]), empty] }));
  }

  const removeBtn = (field: keyof TailoredCV, idx: number) => (
    <button
      type="button"
      onClick={() => removeFromList(field, idx)}
      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  const addBtn = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition mt-2"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Edit Your CV</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition">
            Cancel
          </button>
          <button onClick={() => onSave(d)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition">
            Save Changes
          </button>
        </div>
      </div>

      {/* ── Contact ── */}
      <div>
        <SectionHead title="Contact Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputCls} value={d.fullName} placeholder="Full Name" onChange={e => set('fullName', e.target.value)} />
          <input className={inputCls} value={d.phone} placeholder="Phone" onChange={e => set('phone', e.target.value)} />
          <input className={inputCls} type="email" value={d.email} placeholder="Email" onChange={e => set('email', e.target.value)} />
          <input className={inputCls} value={d.location} placeholder="Location" onChange={e => set('location', e.target.value)} />
          <input className={inputCls} value={d.linkedinUrl ?? ''} placeholder="LinkedIn URL" onChange={e => set('linkedinUrl', e.target.value)} />
          <input className={inputCls} value={d.githubUrl ?? ''} placeholder="GitHub URL" onChange={e => set('githubUrl', e.target.value)} />
          <input className={inputCls} value={d.portfolioUrl ?? ''} placeholder="Portfolio URL" onChange={e => set('portfolioUrl', e.target.value)} />
        </div>
      </div>

      {/* ── Summary ── */}
      <div>
        <SectionHead title="Professional Summary" />
        <textarea className={textareaCls} rows={4} value={d.tailoredSummary} placeholder="Professional summary..." onChange={e => set('tailoredSummary', e.target.value)} />
      </div>

      {/* ── Skills ── */}
      <div>
        <SectionHead title="Core Competencies" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Technical Skills</label>
            <textarea className={textareaCls} rows={3} value={d.technicalSkills} placeholder="React, TypeScript, Node.js..." onChange={e => set('technicalSkills', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Soft Skills</label>
            <textarea className={textareaCls} rows={3} value={d.softSkills} placeholder="Leadership, Communication..." onChange={e => set('softSkills', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Education ── */}
      <div>
        <SectionHead title="Education" />
        <div className="space-y-3">
          {(d.education ?? []).map((edu, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-4 space-y-2">
              {removeBtn('education', i)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={inputCls} value={edu.degree} placeholder="Degree" onChange={e => updateList<Education>('education', i, { degree: e.target.value })} />
                <input className={inputCls} value={edu.institution} placeholder="Institution" onChange={e => updateList<Education>('education', i, { institution: e.target.value })} />
                <input className={inputCls} value={edu.graduationYear} placeholder="Graduation Year" onChange={e => updateList<Education>('education', i, { graduationYear: e.target.value })} />
                <input className={inputCls} value={edu.honors ?? ''} placeholder="Honors (optional)" onChange={e => updateList<Education>('education', i, { honors: e.target.value })} />
              </div>
            </div>
          ))}
          {addBtn('Add Education', () => addToList<Education>('education', { degree: '', institution: '', graduationYear: '', honors: '' }))}
        </div>
      </div>

      {/* ── Experience ── */}
      <div>
        <SectionHead title="Work Experience" />
        <div className="space-y-3">
          {(d.experience ?? []).map((exp, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-4 space-y-2">
              {removeBtn('experience', i)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={inputCls} value={exp.jobTitle} placeholder="Job Title" onChange={e => updateList<WorkExperience>('experience', i, { jobTitle: e.target.value })} />
                <input className={inputCls} value={exp.company} placeholder="Company" onChange={e => updateList<WorkExperience>('experience', i, { company: e.target.value })} />
                <input className={inputCls} value={exp.startDate} placeholder="Start Date" onChange={e => updateList<WorkExperience>('experience', i, { startDate: e.target.value })} />
                <input className={inputCls} value={exp.endDate ?? ''} placeholder="End Date (blank = Present)" onChange={e => updateList<WorkExperience>('experience', i, { endDate: e.target.value || null })} />
              </div>
              <textarea className={textareaCls} rows={4} value={exp.description} placeholder="Description..." onChange={e => updateList<WorkExperience>('experience', i, { description: e.target.value })} />
            </div>
          ))}
          {addBtn('Add Experience', () => addToList<WorkExperience>('experience', { jobTitle: '', company: '', startDate: '', endDate: null, description: '' }))}
        </div>
      </div>

      {/* ── Projects ── */}
      <div>
        <SectionHead title="Technical Projects" />
        <div className="space-y-3">
          {(d.projects ?? []).map((proj, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-4 space-y-2">
              {removeBtn('projects', i)}
              <input className={inputCls} value={proj.name} placeholder="Project Name" onChange={e => updateList<TechnicalProject>('projects', i, { name: e.target.value })} />
              <input className={inputCls} value={proj.techStack} placeholder="Tech Stack" onChange={e => updateList<TechnicalProject>('projects', i, { techStack: e.target.value })} />
              <textarea className={textareaCls} rows={2} value={proj.description} placeholder="Description..." onChange={e => updateList<TechnicalProject>('projects', i, { description: e.target.value })} />
              <textarea className={textareaCls} rows={2} value={proj.contribution} placeholder="Your contribution..." onChange={e => updateList<TechnicalProject>('projects', i, { contribution: e.target.value })} />
            </div>
          ))}
          {addBtn('Add Project', () => addToList<TechnicalProject>('projects', { name: '', description: '', techStack: '', contribution: '' }))}
        </div>
      </div>

      {/* ── Certifications ── */}
      <div>
        <SectionHead title="Certifications" />
        <div className="space-y-3">
          {(d.certifications ?? []).map((cert, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-4">
              {removeBtn('certifications', i)}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={inputCls} value={cert.name} placeholder="Certificate Name" onChange={e => updateList<Certification>('certifications', i, { name: e.target.value })} />
                <input className={inputCls} value={cert.issuer} placeholder="Issuer" onChange={e => updateList<Certification>('certifications', i, { issuer: e.target.value })} />
                <input className={inputCls} value={cert.year} placeholder="Year" onChange={e => updateList<Certification>('certifications', i, { year: e.target.value })} />
              </div>
            </div>
          ))}
          {addBtn('Add Certification', () => addToList<Certification>('certifications', { name: '', issuer: '', year: '' }))}
        </div>
      </div>

      {/* ── Memberships ── */}
      <div>
        <SectionHead title="Professional Memberships" />
        <textarea className={textareaCls} rows={3} value={d.memberships ?? ''} placeholder="IEEE Member, NSE..." onChange={e => set('memberships', e.target.value)} />
      </div>

      {/* ── Awards ── */}
      <div>
        <SectionHead title="Awards & Honors" />
        <textarea className={textareaCls} rows={3} value={d.awards ?? ''} placeholder="Dean's List, scholarships..." onChange={e => set('awards', e.target.value)} />
      </div>

      {/* ── Publications ── */}
      <div>
        <SectionHead title="Research & Publications" />
        <div className="space-y-3">
          {(d.publications ?? []).map((pub, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-4">
              {removeBtn('publications', i)}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={inputCls} value={pub.title} placeholder="Title" onChange={e => updateList<Publication>('publications', i, { title: e.target.value })} />
                <input className={inputCls} value={pub.year} placeholder="Year" onChange={e => updateList<Publication>('publications', i, { year: e.target.value })} />
                <input className={inputCls} value={pub.link ?? ''} placeholder="Link (optional)" onChange={e => updateList<Publication>('publications', i, { link: e.target.value })} />
              </div>
            </div>
          ))}
          {addBtn('Add Publication', () => addToList<Publication>('publications', { title: '', year: '', link: '' }))}
        </div>
      </div>

      {/* ── Research Interests ── */}
      {(d.researchInterests !== undefined) && (
        <div>
          <SectionHead title="Research Interests" />
          <textarea className={textareaCls} rows={2} value={d.researchInterests ?? ''} placeholder="Research interests..." onChange={e => set('researchInterests', e.target.value)} />
        </div>
      )}

      {/* ── References ── */}
      {(d.references?.length ?? 0) > 0 && (
        <div>
          <SectionHead title="References" />
          <div className="space-y-3">
            {d.references.map((ref, i) => (
              <div key={i} className="relative bg-slate-700 rounded-lg p-4">
                {removeBtn('references', i)}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className={inputCls} value={ref.name} placeholder="Name" onChange={e => updateList<Reference>('references', i, { name: e.target.value })} />
                  <input className={inputCls} value={ref.relationship ?? ''} placeholder="Relationship / Title" onChange={e => updateList<Reference>('references', i, { relationship: e.target.value })} />
                  <input className={inputCls} value={ref.email} placeholder="Email" onChange={e => updateList<Reference>('references', i, { email: e.target.value })} />
                  <input className={inputCls} value={ref.phone ?? ''} placeholder="Phone (optional)" onChange={e => updateList<Reference>('references', i, { phone: e.target.value })} />
                </div>
              </div>
            ))}
            {addBtn('Add Reference', () => addToList<Reference>('references', { name: '', email: '', relationship: '', phone: '' }))}
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition">
          Cancel
        </button>
        <button onClick={() => onSave(d)} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}
