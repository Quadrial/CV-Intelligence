import { useState } from 'react';

interface Props {
  text: string;
  fullName: string;
}

export default function CoverLetterPanel({ text, fullName }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const date = new Date().toISOString().split('T')[0];
    const name = fullName.trim().replace(/\s+/g, '_');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_Cover_Letter_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const date = new Date().toISOString().split('T')[0];
    const name = fullName.trim().replace(/\s+/g, '_');

    const paragraphs = text.split('\n').filter(l => l.trim()).map(line =>
      new Paragraph({ children: [new TextRun({ text: line, size: 22 })], spacing: { after: 160 } })
    );

    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_Cover_Letter_${date}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold text-white">Cover Letter</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-xs transition"
          >
            {copied ? (
              <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
            )}
          </button>
          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-xs transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            .txt
          </button>
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Word
          </button>
        </div>
      </div>

      {/* Letter body */}
      <div className="p-5 bg-white rounded-b-xl">
        <div className="max-w-2xl mx-auto">
          {text.split('\n').filter(l => l.trim()).map((para, i) => (
            <p key={i} className="text-[12px] text-gray-700 leading-relaxed mb-3">{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
