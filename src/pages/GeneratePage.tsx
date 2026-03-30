import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/profileService';
import { tailorCV } from '../services/tailoringService';
import { saveHistory } from '../services/historyService';
import { exportPDF, exportDocx, generateFileName } from '../services/exportService';
import {
  getSettings, incrementUsage, savePersonalApiKey,
  hasFreeTrial, remainingFree, type UserSettings,
} from '../services/settingsService';
import CVTemplate from '../components/CVTemplate';
import TemplatePicker from '../components/TemplatePicker';
import ApiKeyModal from '../components/ApiKeyModal';
import type { CVProfile, TailoredCV } from '../types/cv';
import type { TemplateId } from '../components/CVTemplate';

type Step = 'input' | 'loading' | 'preview';

export default function GeneratePage() {
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jdError, setJdError] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [tailored, setTailored] = useState<TailoredCV | null>(null);
  const [aiError, setAiError] = useState('');
  const [exportError, setExportError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('modern');
  const [savingKey, setSavingKey] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const pendingGenerate = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [p, s] = await Promise.all([getProfile(user.id), getSettings(user.id)]);
      setProfile(p);
      setSettings(s);
      setProfileLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = (msg: string, type: 'error' | 'info' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 6000);
  };

  const runGenerate = async (apiKey?: string) => {
    setStep('loading');
    setAiError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) throw new Error('Not authenticated.');

      // Use app key only if within free limit and no personal key
      const useAppKey = !apiKey && settings && hasFreeTrial(settings);
      const keyToUse = apiKey || (useAppKey ? undefined : settings?.personalApiKey);

      const result = await tailorCV(profile, jobDescription, keyToUse);
      setTailored(result);

      // Increment free usage only when app key was used
      if (useAppKey) {
        await incrementUsage(user.id);
        setSettings(prev => prev ? { ...prev, freeUsageCount: prev.freeUsageCount + 1 } : prev);
      }

      await saveHistory(user.id, jobDescription, result).catch(() => {});
      setStep('preview');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setAiError(msg);
      showToast(msg);
      setStep('input');
    }
  };

  const handleGenerate = async () => {
    setJdError('');
    setAiError('');
    if (!jobDescription.trim()) { setJdError('Please paste a job description before generating.'); return; }
    if (!profile || !settings) return;

    // Has personal key → use it directly
    if (settings.personalApiKey) { await runGenerate(settings.personalApiKey); return; }

    // Still has free uses
    if (hasFreeTrial(settings)) { await runGenerate(); return; }

    // Out of free uses, no personal key → show modal
    pendingGenerate.current = true;
    setShowApiModal(true);
  };

  const handleSaveKey = async (key: string) => {
    setSavingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');
      await savePersonalApiKey(user.id, key);
      setSettings(prev => prev ? { ...prev, personalApiKey: key } : prev);
      setShowApiModal(false);
      if (pendingGenerate.current) {
        pendingGenerate.current = false;
        await runGenerate(key);
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Failed to save key.');
    } finally {
      setSavingKey(false);
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

  const handleReset = () => { setStep('input'); setTailored(null); setAiError(''); setExportError(''); };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const free = settings ? remainingFree(settings) : 0;
  const hasOwnKey = !!settings?.personalApiKey;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {showApiModal && (
        <ApiKeyModal
          onSave={handleSaveKey}
          onClose={() => { setShowApiModal(false); pendingGenerate.current = false; }}
          saving={savingKey}
        />
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-2xl rounded-xl border p-4 flex items-start gap-3 animate-in
          ${toast.type === 'error' ? 'bg-red-950 border-red-700 text-red-200' : 'bg-slate-800 border-slate-600 text-slate-200'}`}
          style={{ animation: 'slideIn 0.2s ease-out' }}
        >
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 text-sm leading-relaxed">{toast.msg}</div>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white transition shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Generate Tailored CV</h2>
          <p className="text-slate-400 text-sm mt-0.5">Paste a job description and we'll tailor your CV to match it.</p>
        </div>
        {/* Usage badge */}
        {settings && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            hasOwnKey
              ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
              : free > 0
              ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300'
              : 'bg-amber-900/30 border-amber-700 text-amber-300'
          }`}>
            {hasOwnKey ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Using your API key — unlimited</>
            ) : free > 0 ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" /> {free} free generation{free !== 1 ? 's' : ''} remaining</>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Free limit reached — <button onClick={() => setShowApiModal(true)} className="underline hover:text-amber-200 ml-0.5">add your key</button></>
            )}
          </div>
        )}
      </div>

      {/* No profile warning */}
      {!profile && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/30 border border-amber-700 text-amber-300 text-sm">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>You haven't saved a CV profile yet. <Link to="/profile" className="underline font-medium hover:text-amber-200">Complete your profile</Link> first.</span>
        </div>
      )}

      {/* ── INPUT STEP ── */}
      {step === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
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
                <p className="text-xs text-slate-500 mb-1">Profile loaded</p>
                <p className="text-sm font-medium text-white">{profile.fullName}</p>
                <p className="text-xs text-slate-400">{profile.experience?.length ?? 0} roles · {profile.education?.length ?? 0} education entries</p>
              </div>
            )}

            {/* API key shortcut */}
            {!hasOwnKey && (
              <div className="pt-3 border-t border-slate-700">
                <button
                  onClick={() => setShowApiModal(true)}
                  className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Add your own API key for unlimited use
                </button>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
            <div>
              <p className="text-white font-semibold text-sm">CV ready for download</p>
              <p className="text-slate-400 text-xs mt-0.5">Review the preview below, then download in your preferred format.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition">
                ← New Job
              </button>
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
                    <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition">
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                      Download PDF
                    </button>
                    <button onClick={() => handleExport('docx')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition border-t border-slate-600">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                      Download Word
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {exportError && <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{exportError}</div>}

          {/* Template picker */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 space-y-2">
            <p className="text-xs font-medium text-slate-400">Choose a template</p>
            <TemplatePicker selected={template} onChange={setTemplate} />
          </div>

          <div className="bg-slate-700 rounded-xl p-4 overflow-auto">
            <div className="max-w-[794px] mx-auto shadow-2xl rounded-lg overflow-hidden">
              <CVTemplate cv={tailored} template={template} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
