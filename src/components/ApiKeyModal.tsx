import { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
  onClose: () => void;
  saving: boolean;
}

export default function ApiKeyModal({ onSave, onClose, saving }: Props) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">You've used your 2 free generations</h2>
            <p className="text-slate-400 text-sm mt-1">Add your own free Gemini API key to keep generating unlimited CVs.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition ml-4 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-300">How to get your free Gemini API key:</p>
          <ol className="space-y-3">
            {[
              <>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300 font-medium">aistudio.google.com/app/apikey</a></>,
              <>Sign in with your Google account (it's free — no credit card needed)</>,
              <>Click <span className="text-white font-medium">"Create API key"</span> and copy it</>,
              <>Paste it below and click Save</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-400">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {/* Key input */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showKey ? (
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
            <p className="text-xs text-slate-500 mt-1.5">Your key is stored securely in your account and never shared.</p>
          </div>

          <button
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim() || saving}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition"
          >
            {saving ? 'Saving...' : 'Save API Key & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
