import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, saveProfile } from '../services/profileService';
import { getSettings, savePersonalApiKey, type UserSettings } from '../services/settingsService';
import { parseCVFile } from '../utils/cvParser';
import type {
  CVProfile, WorkExperience, Education, TechnicalProject, Certification, Publication,
} from '../types/cv';

const emptyProfile = (): CVProfile => ({
  fullName: '', phone: '', email: '', location: '',
  linkedinUrl: '', githubUrl: '', portfolioUrl: '',
  summary: '', technicalSkills: '', softSkills: '',
  experience: [], projects: [], education: [],
  certifications: [], memberships: '', awards: '', publications: [],
});

const emptyExp = (): WorkExperience => ({ jobTitle: '', company: '', startDate: '', endDate: null, description: '' });
const emptyEdu = (): Education => ({ degree: '', institution: '', graduationYear: '', honors: '' });
const emptyProject = (): TechnicalProject => ({ name: '', description: '', techStack: '', contribution: '' });
const emptyCert = (): Certification => ({ name: '', issuer: '', year: '' });
const emptyPub = (): Publication => ({ title: '', year: '', link: '' });

// ── Reusable section wrapper ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
const textareaCls = inputCls + ' resize-none';

/** Convert plain text lines into bullet-point lines */
function formatAsBullets(text: string): string {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => (l.startsWith('•') ? l : `• ${l}`))
    .join('\n');
}

function BulletTextarea({
  value, onChange, rows = 4, placeholder,
}: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <textarea
        className={textareaCls}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => onChange(formatAsBullets(value))}
        className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Format as bullet points
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CVProfile>(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [saved, s] = await Promise.all([getProfile(user.id), getSettings(user.id)]);
      if (saved) setProfile(saved);
      setSettings(s);
      setApiKey(s.personalApiKey ?? '');
      setLoading(false);
    })();
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await saveProfile(user.id, profile);
      showToast('success', 'Profile saved successfully.');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseCVFile(file);
      setProfile(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined && v !== '')),
      }));
      showToast('success', 'CV parsed — please review and fill any missing fields.');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Could not parse file.');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveKey = async () => {
    setSavingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await savePersonalApiKey(user.id, apiKey);
      setSettings(prev => prev ? { ...prev, personalApiKey: apiKey } : prev);
      showToast('success', 'API key saved.');
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to save key.');
    } finally {
      setSavingKey(false);
    }
  };

  // ── List helpers ─────────────────────────────────────────────────────────────
  function addItem<T>(key: keyof CVProfile, empty: T) {
    setProfile(p => ({ ...p, [key]: [...(p[key] as T[]), empty] }));
  }
  function removeItem<T>(key: keyof CVProfile, idx: number) {
    setProfile(p => ({ ...p, [key]: (p[key] as T[]).filter((_, i) => i !== idx) }));
  }
  function updateItem<T>(key: keyof CVProfile, idx: number, patch: Partial<T>) {
    setProfile(p => ({
      ...p,
      [key]: (p[key] as T[]).map((item, i) => i === idx ? { ...item, ...patch } : item),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all
          ${toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My CV Profile</h2>
          <p className="text-slate-400 text-sm mt-0.5">Fill this in once — we'll use it to tailor your CV to any job.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white text-sm transition disabled:opacity-50"
          >
            {parsing ? (
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {parsing ? 'Parsing...' : 'Upload CV'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <Section title="Header">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className={inputCls} value={profile.fullName} placeholder="Jane Doe"
              onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} />
          </Field>
          <Field label="Phone Number">
            <input className={inputCls} value={profile.phone} placeholder="+1 555 000 0000"
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          </Field>
          <Field label="Professional Email">
            <input className={inputCls} type="email" value={profile.email} placeholder="jane@example.com"
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Location (City, State/Country)">
            <input className={inputCls} value={profile.location} placeholder="Lagos, Nigeria"
              onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
          </Field>
        </div>
      </Section>

      {/* ── Links ── */}
      <Section title="Links">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="LinkedIn URL">
            <input className={inputCls} value={profile.linkedinUrl ?? ''} placeholder="https://linkedin.com/in/..."
              onChange={e => setProfile(p => ({ ...p, linkedinUrl: e.target.value }))} />
          </Field>
          <Field label="GitHub URL">
            <input className={inputCls} value={profile.githubUrl ?? ''} placeholder="https://github.com/..."
              onChange={e => setProfile(p => ({ ...p, githubUrl: e.target.value }))} />
          </Field>
          <Field label="Portfolio URL">
            <input className={inputCls} value={profile.portfolioUrl ?? ''} placeholder="https://yoursite.com"
              onChange={e => setProfile(p => ({ ...p, portfolioUrl: e.target.value }))} />
          </Field>
        </div>
      </Section>

      {/* ── Summary ── */}
      <Section title="Professional Summary">
        <Field label="3–4 sentences covering your expertise, key achievements, and value proposition">
          <textarea className={textareaCls} rows={4} value={profile.summary}
            placeholder="Results-driven software engineer with 5+ years of experience..."
            onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} />
        </Field>
      </Section>

      {/* ── Skills ── */}
      <Section title="Core Competencies">
        <div className="space-y-4">
          <Field label="Technical Skills (languages, frameworks, tools)">
            <textarea className={textareaCls} rows={3} value={profile.technicalSkills}
              placeholder="React, TypeScript, Node.js, PostgreSQL, Docker..."
              onChange={e => setProfile(p => ({ ...p, technicalSkills: e.target.value }))} />
          </Field>
          <Field label="Soft Skills (leadership, problem-solving, etc.)">
            <textarea className={textareaCls} rows={2} value={profile.softSkills}
              placeholder="Team leadership, Agile, Communication, Problem-solving..."
              onChange={e => setProfile(p => ({ ...p, softSkills: e.target.value }))} />
          </Field>
        </div>
      </Section>

      {/* ── Work Experience ── */}
      <Section title="Work Experience">
        <div className="space-y-6">
          {profile.experience.map((exp, i) => (
            <div key={i} className="border border-slate-700 rounded-lg p-4 space-y-3 relative">
              <button onClick={() => removeItem('experience', i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Job Title">
                  <input className={inputCls} value={exp.jobTitle} placeholder="Senior Software Engineer"
                    onChange={e => updateItem<WorkExperience>('experience', i, { jobTitle: e.target.value })} />
                </Field>
                <Field label="Company">
                  <input className={inputCls} value={exp.company} placeholder="Acme Corp"
                    onChange={e => updateItem<WorkExperience>('experience', i, { company: e.target.value })} />
                </Field>
                <Field label="Start Date">
                  <input className={inputCls} value={exp.startDate} placeholder="Jan 2022"
                    onChange={e => updateItem<WorkExperience>('experience', i, { startDate: e.target.value })} />
                </Field>
                <Field label="End Date (leave blank if current)">
                  <input className={inputCls} value={exp.endDate ?? ''} placeholder="Dec 2024 or Present"
                    onChange={e => updateItem<WorkExperience>('experience', i, { endDate: e.target.value || null })} />
                </Field>
              </div>
              <Field label="Description (STAR method — one achievement per line, we'll format as bullets)">
                <BulletTextarea
                  rows={4}
                  value={exp.description}
                  placeholder="Led migration of monolith to microservices, reducing deploy time by 60%&#10;Mentored 3 junior engineers and conducted weekly code reviews&#10;Delivered feature X that increased user retention by 25%"
                  onChange={v => updateItem<WorkExperience>('experience', i, { description: v })}
                />
              </Field>
            </div>
          ))}
          <button onClick={() => addItem('experience', emptyExp())}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Work Experience
          </button>
        </div>
      </Section>

      {/* ── Projects ── */}
      <Section title="Technical Projects">
        <div className="space-y-6">
          {profile.projects.map((proj, i) => (
            <div key={i} className="border border-slate-700 rounded-lg p-4 space-y-3 relative">
              <button onClick={() => removeItem('projects', i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Field label="Project Name">
                <input className={inputCls} value={proj.name} placeholder="Real-time Chat App"
                  onChange={e => updateItem<TechnicalProject>('projects', i, { name: e.target.value })} />
              </Field>
              <Field label="Tech Stack">
                <input className={inputCls} value={proj.techStack} placeholder="React, Node.js, Socket.io, Redis"
                  onChange={e => updateItem<TechnicalProject>('projects', i, { techStack: e.target.value })} />
              </Field>
              <Field label="Description">
                <BulletTextarea
                  rows={2}
                  value={proj.description}
                  placeholder="A scalable real-time messaging platform supporting 10k concurrent users..."
                  onChange={v => updateItem<TechnicalProject>('projects', i, { description: v })}
                />
              </Field>
              <Field label="Your Specific Contribution">
                <BulletTextarea
                  rows={2}
                  value={proj.contribution}
                  placeholder="Designed the WebSocket architecture and implemented message persistence..."
                  onChange={v => updateItem<TechnicalProject>('projects', i, { contribution: v })}
                />
              </Field>
            </div>
          ))}
          <button onClick={() => addItem('projects', emptyProject())}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>
      </Section>

      {/* ── Education ── */}
      <Section title="Education">
        <div className="space-y-4">
          {profile.education.map((edu, i) => (
            <div key={i} className="border border-slate-700 rounded-lg p-4 space-y-3 relative">
              <button onClick={() => removeItem('education', i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Degree">
                  <input className={inputCls} value={edu.degree} placeholder="B.Sc. Computer Science"
                    onChange={e => updateItem<Education>('education', i, { degree: e.target.value })} />
                </Field>
                <Field label="Institution">
                  <input className={inputCls} value={edu.institution} placeholder="University of Lagos"
                    onChange={e => updateItem<Education>('education', i, { institution: e.target.value })} />
                </Field>
                <Field label="Graduation Year">
                  <input className={inputCls} value={edu.graduationYear} placeholder="2020"
                    onChange={e => updateItem<Education>('education', i, { graduationYear: e.target.value })} />
                </Field>
                <Field label="Academic Honors (optional)">
                  <input className={inputCls} value={edu.honors ?? ''} placeholder="First Class Honours"
                    onChange={e => updateItem<Education>('education', i, { honors: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => addItem('education', emptyEdu())}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Education
          </button>
        </div>
      </Section>

      {/* ── Certifications ── */}
      <Section title="Certifications">
        <div className="space-y-4">
          {profile.certifications.map((cert, i) => (
            <div key={i} className="border border-slate-700 rounded-lg p-4 relative">
              <button onClick={() => removeItem('certifications', i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Certificate Name">
                  <input className={inputCls} value={cert.name} placeholder="AWS Solutions Architect"
                    onChange={e => updateItem<Certification>('certifications', i, { name: e.target.value })} />
                </Field>
                <Field label="Issuer">
                  <input className={inputCls} value={cert.issuer} placeholder="Amazon Web Services"
                    onChange={e => updateItem<Certification>('certifications', i, { issuer: e.target.value })} />
                </Field>
                <Field label="Year">
                  <input className={inputCls} value={cert.year} placeholder="2023"
                    onChange={e => updateItem<Certification>('certifications', i, { year: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => addItem('certifications', emptyCert())}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Certification
          </button>
        </div>
      </Section>

      {/* ── Memberships ── */}
      <Section title="Professional Memberships">
        <Field label="Affiliations with engineering bodies or technical organizations">
          <BulletTextarea
            rows={3}
            value={profile.memberships}
            placeholder="IEEE Member&#10;Nigerian Society of Engineers (NSE)&#10;ACM"
            onChange={v => setProfile(p => ({ ...p, memberships: v }))}
          />
        </Field>
      </Section>

      {/* ── Awards ── */}
      <Section title="Awards & Honors">
        <Field label="Scholarships, Dean's list, competition wins, etc.">
          <BulletTextarea
            rows={3}
            value={profile.awards}
            placeholder="Dean's List 2019–2020&#10;Google Africa Developer Scholarship&#10;1st Place, Hackathon 2022"
            onChange={v => setProfile(p => ({ ...p, awards: v }))}
          />
        </Field>
      </Section>

      {/* ── Publications ── */}
      <Section title="Research & Publications">
        <div className="space-y-4">
          {profile.publications.map((pub, i) => (
            <div key={i} className="border border-slate-700 rounded-lg p-4 relative">
              <button onClick={() => removeItem('publications', i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Title">
                  <input className={inputCls} value={pub.title} placeholder="Thesis or paper title"
                    onChange={e => updateItem<Publication>('publications', i, { title: e.target.value })} />
                </Field>
                <Field label="Year">
                  <input className={inputCls} value={pub.year} placeholder="2023"
                    onChange={e => updateItem<Publication>('publications', i, { year: e.target.value })} />
                </Field>
                <Field label="Link (optional)">
                  <input className={inputCls} value={pub.link ?? ''} placeholder="https://..."
                    onChange={e => updateItem<Publication>('publications', i, { link: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => addItem('publications', emptyPub())}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Publication
          </button>
        </div>
      </Section>

      {/* ── API Key Settings ── */}
      <Section title="Gemini API Key">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            You get 2 free CV generations on us. Add your own free Gemini API key for unlimited use.{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Get a free key here ↗
            </a>
          </p>
          {settings && (
            <p className={`text-xs font-medium ${settings.personalApiKey ? 'text-emerald-400' : 'text-amber-400'}`}>
              {settings.personalApiKey
                ? '✓ Personal API key saved — unlimited generations active'
                : `${Math.max(0, 2 - settings.freeUsageCount)} free generation(s) remaining`}
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIza..."
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showApiKey ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              disabled={savingKey || !apiKey.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition shrink-0"
            >
              {savingKey ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        </div>
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
