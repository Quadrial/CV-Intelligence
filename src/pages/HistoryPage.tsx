import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getHistory } from '../services/historyService';
import { exportPDF, exportDocx, generateFileName } from '../services/exportService';
import type { HistoryEntry, TailoredCV } from '../types/cv';
import CVTemplate from '../components/CVTemplate';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<TailoredCV | null>(null);
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
      const fileName = generateFileName(selected.fullName, format);
      if (format === 'pdf') await exportPDF(selected, fileName);
      else await exportDocx(selected, fileName);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed.');
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
          <div className="space-y-2">
            {entries.map(entry => (
              <button
                key={entry.id}
                onClick={() => { setSelected(entry.tailoredCV); setExportError(''); }}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  selected === entry.tailoredCV
                    ? 'bg-indigo-900/40 border-indigo-600'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                <p className="text-white text-sm font-medium line-clamp-2">{entry.jobDescriptionSnippet}</p>
                <p className="text-slate-500 text-xs mt-1.5">
                  {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-3">
                {/* Action bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  <p className="text-white text-sm font-medium">{selected.fullName}</p>
                  <div className="flex items-center gap-3">
                    {exportError && <p className="text-red-400 text-xs">{exportError}</p>}
                    <div className="relative">
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

                {/* CV preview */}
                <div className="bg-slate-700 rounded-xl p-3 overflow-auto">
                  <div className="max-w-[794px] mx-auto shadow-2xl rounded-lg overflow-hidden">
                    <CVTemplate cv={selected} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">Select an entry on the left to preview it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
