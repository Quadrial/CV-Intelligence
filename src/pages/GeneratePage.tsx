import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/profileService';
import { tailorCV } from '../services/tailoringService';
import { saveHistory } from '../services/historyService';
import { exportPDF, exportDocx, generateFileName } from '../services/exportService';
import CVTemplate from '../components/CVTemplate';
import type { CVProfile, TailoredCV } from '../types/cv';

type Step = 'input' | 'loading' | 'preview';

export default function GeneratePage() {
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState('');
  const [jdError, setJdError] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [tailored, setTailored] = useState<TailoredCV | null>(null);
  const [aiError, setAiError] = useState('');
  const [exportError, setExportError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const p = await getProfile(user.id);
      setProfile(p);
      setProfileLoading(false);
    })();
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGenerate = async () => {
    setJdError('');
    setAiError('');

    if (!jobDescription.trim()) {
      setJdError('Please paste a job description before generating.');
      return;
    }
    if (!profile) return; // button is disabled anyway

    setStep('loading');
    try {
      const result = await tailorCV(profile, jobDescription);
      setTailored(result);

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveHistory(user.id, jobDescription, result).catch(() => {/* non-fatal */});
      }

      setStep('preview');
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setStep('input');
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!tailored) return;
    setExportError('');
    setShowExportMenu(false);
    try {
      const fileName = generateFileName(tailored.fullName, format);
      if (format === 'pdf') await exportPDF(tailored, fileName);
      else await exportDocx(tailored, fileName);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed. Please try again.');
    }
  };

  const handleReset = () => {
    setStep('input');
    setTailored(null);
    setAiError('');
    setExportError('');
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">Generate Tailored CV</h2>
        <p className="text-slate-400 text-sm mt-0.5">Paste a job description and we'll tailor your CV to match it.</p>
      </div>

      {/* No profile warning */}
      {!profile && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/30 border border-amber-700 text-amber-300 text-sm">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>You haven't saved a CV profile yet. <Link to="/profile" className="underline font-medium hover:text-amber-200">Complete your profile</Link> first so we have content to tailor.</span>
        </div>
      )}

      {/* ── INPUT STEP ── */}
      {step === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job description */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => { setJobDescription(e.target.value); setJdError(''); }}
                rows={16}
                placeholder="Paste the full job description here — the more detail, the better the tailoring..."
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
              />
              {jdError && <p className="text-red-400 text-xs mt-1">{jdError}</p>}
            </div>

            {aiError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {aiError}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!profile}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Tailored CV
            </button>
          </div>

          {/* Tips panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-white">Tips for best results</h3>
            <ul className="space-y-3 text-xs text-slate-400">
              {[
                'Paste the complete job description including responsibilities and requirements.',
                'Make sure your profile has detailed work experience with STAR-method descriptions.',
                'The AI will reorder and emphasize the most relevant parts of your CV.',
                'Review the preview before downloading — you can regenerate if needed.',
                
              ].map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>

            {profile && (
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Profile loaded</p>
                <p className="text-sm font-medium text-white">{profile.fullName}</p>
                <p className="text-xs text-slate-400">{profile.experience?.length ?? 0} experience entries · {profile.education?.length ?? 0} education entries</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOADING STEP ── */}
      {step === 'loading' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-16 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 rounded-full" />
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Tailoring your CV...</p>
            <p className="text-slate-400 text-sm mt-1">Gemini AI is analysing the job description and adapting your profile.</p>
          </div>
        </div>
      )}

      {/* ── PREVIEW STEP ── */}
      {step === 'preview' && tailored && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
            <div>
              <p className="text-white font-semibold text-sm">CV ready for download</p>
              <p className="text-slate-400 text-xs mt-0.5">Review the preview below, then download in your preferred format.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition"
              >
                ← New Job
              </button>

              {/* Export dropdown */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 overflow-hidden">
                    <button onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition">
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      Download PDF
                    </button>
                    <button onClick={() => handleExport('docx')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition border-t border-slate-600">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      Download Word
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {exportError && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{exportError}</div>
          )}

          {/* CV Preview */}
          <div className="bg-slate-700 rounded-xl p-4 overflow-auto">
            <div className="max-w-[794px] mx-auto shadow-2xl rounded-lg overflow-hidden">
              <CVTemplate cv={tailored} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
