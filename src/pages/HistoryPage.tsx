import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getHistory, deleteHistory } from '../services/historyService';
import { exportPDF, exportDocx, generateFileName } from '../services/exportService';
import type { HistoryEntry } from '../types/cv';
import CVTemplate from '../components/CVTemplate';
import TemplatePicker from '../components/TemplatePicker';
import type { TemplateId } from '../components/CVTemplate';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [template, setTemplate] = useState<TemplateId>('modern');
  const [activeTab, setActiveTab] = useState<'cv' | 'cover'>('cv');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportError, setExportError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const data = await getHistory(user.id);
        setEntries(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!selected) return;
    setExportError('');
    setShowExportMenu(false);
    try {
      const fileName = generateFileName(selected.tailoredCV.fullName, format);
      if (format === 'pdf') await exportPDF(selected.tailoredCV, fileName);
      else await exportDocx(selected.tailoredCV, fileName);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Delete this history entry? This cannot be undone.')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');
      await deleteHistory(user.id, entryId);
      const updated = entries.filter(entry => entry.id !== entryId);
      setEntries(updated);
      if (selected?.id === entryId) setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not delete history entry.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-xl font-bold text-white">CV History</h2>
        <p className="text-slate-400 text-sm mt-0.5">Previously generated tailored CVs — click any to preview and re-download.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => window.location.reload()} className="underline hover:text-red-200 ml-4">Retry</button>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">No CVs generated yet.</p>
          <button
            onClick={() => navigate('/generate')}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
          >
            Generate your first CV
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry list */}
          <div className="space-y-3">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`rounded-xl border p-4 transition ${
                  selected?.id === entry.id
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}
              >
                <button
                  type="button"
                  onClick={() => { setSelected(entry); setActiveTab('cv'); setExportError(''); }}
                  className="w-full text-left"
                >
                  <p className="text-white text-sm font-semibold line-clamp-2">{entry.jobDescriptionSnippet}</p>
                  <p className="text-slate-500 text-xs mt-2">
                    {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </button>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-xs">{entry.tailoredCV.fullName}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4">
                  <div>
                    <p className="text-white text-lg font-semibold">{selected.tailoredCV.fullName}</p>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{selected.jobDescriptionSnippet}</p>
                    {exportError && <p className="text-red-400 text-xs mt-2">{exportError}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="px-3 py-2 rounded-lg border border-red-600 text-red-300 text-xs font-semibold hover:bg-red-700/10 transition"
                    >
                      Delete Entry
                    </button>
                    <div className="relative" aria-live="polite">
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
                            Download PDF
                          </button>
                          <button onClick={() => handleExport('docx')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition border-t border-slate-600">
                            Download Word
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1">
                  {['cv', 'cover'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'cv' | 'cover')}
                      className={`flex-1 text-sm font-medium rounded-lg px-3 py-2 transition ${
                        activeTab === tab
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab === 'cv' ? 'CV Preview' : 'Cover Letter'}
                    </button>
                  ))}
                </div>

                {activeTab === 'cv' ? (
                  <>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 space-y-2">
                      <p className="text-xs font-medium text-slate-400">Choose a template</p>
                      <TemplatePicker selected={template} onChange={setTemplate} />
                    </div>
                    <div className="bg-slate-700 rounded-xl p-4 overflow-auto">
                      <div className="max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden">
                        <CVTemplate cv={selected.tailoredCV} template={template} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-700 rounded-xl p-6 space-y-4 text-sm text-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Cover Letter</p>
                        <p className="text-white text-lg font-semibold mt-1">Professional letter for this role</p>
                      </div>
                      <span className="inline-flex px-3 py-1 rounded-full border border-slate-600 text-xs text-slate-300 bg-slate-800/80">
                        {selected.coverLetter ? 'Saved' : 'Missing'}
                      </span>
                    </div>
                    {selected.coverLetter ? (
                      <div className="whitespace-pre-wrap text-slate-100 leading-7">{selected.coverLetter}</div>
                    ) : (
                      <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700 text-slate-400">
                        No cover letter was stored with this history entry.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">Select an entry on the left to preview its CV and cover letter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
