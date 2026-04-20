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
}

export default function FixPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live platform detection (debounced in a simple way)
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

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">
            Fix your automation code
          </h1>
          <p className="text-zinc-500 text-base">
            Paste any Shelly JS, HA YAML, Node-RED JSON, or ESPHome YAML. We&apos;ll detect the platform and fix common errors.
          </p>
        </div>

        <div className={`grid gap-6 ${result ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold">Paste Your Code</label>
              {detectedPlatform && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium animate-fade-in">
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

          {/* Results Panel */}
          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold">Fixed Code</h2>
                <span className={`text-xs px-3 py-1 rounded-full border ${result.valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  {result.valid ? 'Valid' : 'Errors found'}
                </span>
              </div>

              <CodeBlock code={result.fixed} platform={result.platform as 'shelly' | 'ha' | 'nodered' | 'esphome'} />

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
    </div>
  );
}
