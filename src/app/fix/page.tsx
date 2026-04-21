'use client';

import { useState, useRef } from 'react';
import CodeBlock from '@/components/CodeBlock';

const PLATFORM_LABELS: Record<string, string> = {
  shelly: 'Shelly JS',
  ha: 'Home Assistant YAML',
  nodered: 'Node-RED JSON',
  esphome: 'ESPHome YAML',
  unknown: 'Unknown',
};

const PLATFORM_COLORS: Record<string, string> = {
  shelly: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  ha: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  nodered: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  esphome: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  unknown: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400',
};

const EXAMPLE_CODE: Record<string, string> = {
  shelly: `Shelly.addEventHandler(function(event {
  if (event.component === "input:0") {
    Shelly.call("Switch.Set", { id: 0, on: true }, null, null)
  }
})`,
  ha: `automation:
\talias: "Motion Light"
\ttrigger:
\t  platform: state
\t  entity_id: binary_sensor.motion
  to: "on"
\taction:
\t  service: light.turn_on
\t  entity_id: light.hallway`,
  nodered: `[{"id":"abc123","type":"inject","name":"Timer","wires":[["def456"]]},{"id":"def456","type":"debug","name":"Output"}]`,
};

interface FixResult {
  platform: string;
  original: string;
  fixed: string;
  changes: string[];
  errors: string[];
  valid: boolean;
  placeholders?: string[];
}

export default function FixPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live platform detection
  const detectedPlatform = (() => {
    const trimmed = code.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'nodered';
    if (trimmed.includes('Shelly.') || trimmed.includes('Timer.set(')) return 'shelly';
    if (trimmed.includes('esphome:') || trimmed.includes('esp32:') || trimmed.includes('esp8266:')) return 'esphome';
    if (trimmed.includes('automation:') || trimmed.includes('trigger:') || trimmed.includes('entity_id:')) return 'ha';
    return null;
  })();

  const handleFix = async () => {
    if (!code.trim()) { setError('Paste your code first.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fix failed');
      setResult(data);
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'fix_success', metadata: { platform: data.platform } }) }).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const codeChanged = result && result.original !== result.fixed;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">
            Fix your automation code
          </h1>
          <p className="text-zinc-500 text-base">
            Paste any Shelly JS, HA YAML, Node-RED JSON, or ESPHome YAML. We&apos;ll detect the platform and fix common errors.
          </p>
        </div>

        {/* Input section — always full width */}
        {!result && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold">Paste Your Code</label>
              {detectedPlatform && (
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${PLATFORM_COLORS[detectedPlatform]}`}>
                  Detected: {PLATFORM_LABELS[detectedPlatform]}
                </span>
              )}
            </div>

            <textarea
              ref={textareaRef}
              id="fix-input"
              className="forge-input min-h-[320px] resize-none font-mono text-sm"
              placeholder="Paste your Shelly script, HA automation YAML, Node-RED flow JSON, or ESPHome config here..."
              value={code}
              onChange={(e) => { setCode(e.target.value); setResult(null); }}
            />

            {/* Example loads */}
            <div className="flex flex-wrap gap-2">
              <span className="text-slate-600 text-xs self-center">Load example:</span>
              {Object.keys(EXAMPLE_CODE).map((p) => (
                <button
                  key={p}
                  onClick={() => { setCode(EXAMPLE_CODE[p]); setResult(null); }}
                  className="btn-ghost text-xs"
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              className="btn-primary w-full justify-center py-4"
              onClick={handleFix}
              disabled={loading || !code.trim()}
              id="fix-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                  Analyzing & Fixing...
                </span>
              ) : 'Fix my code'}
            </button>
          </div>
        )}

        {/* Results — side-by-side Before / After */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with platform chip + status */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${PLATFORM_COLORS[result.platform]}`}>
                  {PLATFORM_LABELS[result.platform]}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full border ${result.valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  {result.valid ? '✓ Valid' : '⚠ Issues found'}
                </span>
                {codeChanged && (
                  <span className="text-xs px-3 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400">
                    {result.changes.length} fix{result.changes.length !== 1 ? 'es' : ''} applied
                  </span>
                )}
              </div>
              <button
                onClick={() => { setResult(null); }}
                className="btn-ghost text-xs"
              >
                ← Fix another
              </button>
            </div>

            {/* Side-by-side diff */}
            <div className={`grid gap-4 ${codeChanged ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Before (only show if code changed) */}
              {codeChanged && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-400/80 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Before
                  </h3>
                  <div className="rounded-lg border border-red-500/10 bg-red-500/5 overflow-hidden">
                    <CodeBlock code={result.original} platform={result.platform as 'shelly' | 'ha' | 'nodered' | 'esphome'} />
                  </div>
                </div>
              )}

              {/* After */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-emerald-400/80 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {codeChanged ? 'After' : 'Your Code (no changes needed)'}
                </h3>
                <div className={`rounded-lg border overflow-hidden ${codeChanged ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-zinc-800'}`}>
                  <CodeBlock code={result.fixed} platform={result.platform as 'shelly' | 'ha' | 'nodered' | 'esphome'} />
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-zinc-800/80 bg-forge-900 p-4">
                <p className="text-red-400 font-semibold text-sm mb-2">Issues found</p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-red-300/80 text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Placeholders detected */}
            {result.placeholders && result.placeholders.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-amber-400 font-semibold text-sm mb-2">⚙️ Required Inputs</p>
                <p className="text-zinc-500 text-xs mb-2">These placeholders need to be replaced with your actual values:</p>
                <ul className="space-y-1">
                  {result.placeholders.map((p, i) => (
                    <li key={i} className="text-amber-300/80 text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✏️</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Changes made */}
            {result.changes.length > 0 ? (
              <div className="rounded-lg border border-zinc-800/80 bg-forge-900 p-4">
                <p className="text-emerald-400 font-semibold text-sm mb-2">Changes made</p>
                <ul className="space-y-1">
                  {result.changes.map((c, i) => (
                    <li key={i} className="text-emerald-300/80 text-sm flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            ) : result.valid ? (
              <div className="rounded-lg border border-zinc-800/80 bg-forge-900 p-4">
                <p className="text-zinc-500 text-sm">No changes needed — your code looks valid.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
