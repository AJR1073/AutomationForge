'use client';

import { useState, useCallback } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  platform?: string;
  filename?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  shelly: 'text-amber-400',
  ha: 'text-cyan-400',
  nodered: 'text-orange-400',
  esphome: 'text-emerald-400',
  javascript: 'text-amber-400',
  yaml: 'text-cyan-400',
  json: 'text-orange-400',
};

export default function CodeBlock({ code, language = 'text', platform, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Track event
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'copy_code', metadata: { platform, language } }),
      }).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code, platform, language]);

  const colorClass = platform ? PLATFORM_COLORS[platform] : PLATFORM_COLORS[language] || 'text-slate-400';
  const langLabel = platform
    ? { shelly: 'JavaScript', ha: 'YAML', nodered: 'JSON', esphome: 'YAML' }[platform] || language
    : language;

  return (
    <div className="code-block animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.1)] bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          {filename && <span className=" text-xs">{filename}</span>}
          <span className={`text-xs font-mono font-medium ${colorClass}`}>{langLabel.toUpperCase()}</span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:text-slate-200'
          }`}
          id={`copy-${platform || language}`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="p-5 overflow-x-auto text-sm leading-relaxed font-mono whitespace-pre">
        {code || '// No code generated yet'}
      </pre>
    </div>
  );
}
