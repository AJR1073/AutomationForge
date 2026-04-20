'use client';

import { useState } from 'react';
import PlatformTabs from '@/components/PlatformTabs';
import BuyAllButton from '@/components/BuyAllButton';

const DEVICE_OPTIONS = [
  { id: 'motion_sensor', label: 'Motion Sensor' },
  { id: 'relay', label: 'Relay / Switch' },
  { id: 'light', label: 'Smart Light' },
  { id: 'temperature_sensor', label: 'Temp Sensor' },
  { id: 'door_sensor', label: 'Door Sensor' },
  { id: 'smart_plug', label: 'Smart Plug' },
  { id: 'dimmer', label: 'Dimmer' },
  { id: 'button', label: 'Push Button' },
  { id: 'smoke_detector', label: 'Smoke Detector' },
  { id: 'leak_sensor', label: 'Leak Sensor' },
  { id: 'zigbee_coordinator', label: 'Zigbee Hub' },
];

const CONSTRAINT_OPTIONS = [
  'Only at night',
  'Only during day',
  'Weekdays only',
  'Delay 5 minutes before off',
  'Only when someone home',
  'Send notification',
  'Off-peak hours only',
  'Skip if already active',
];

const PLATFORM_OPTIONS = [
  { id: 'shelly', label: 'Shelly', color: 'text-amber-400' },
  { id: 'ha', label: 'Home Assistant', color: 'text-cyan-400' },
  { id: 'nodered', label: 'Node-RED', color: 'text-orange-400' },
  { id: 'esphome', label: 'ESPHome', color: 'text-emerald-400' },
];

interface BuildResult {
  spec: {
    partsList: Array<{ name: string; capabilityTag: string; quantity: number; required: boolean }>;
    safetyNotes: string[];
    actions: Array<{ type: string; target?: string }>;
    triggers: Array<{ type: string; device?: string; at?: string }>;
    assumptions: string[];
  };
  outputs: { shelly: string; ha: string; nodered: string; esphome: string };
  explanation: string;
}

export default function BuildPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['shelly', 'ha', 'nodered', 'esphome']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState('');
  const [productMap, setProductMap] = useState<Record<string, { name: string; brand: string; asin: string; priceHint: string; affiliateUrl: string }>>({});

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleBuild = async () => {
    if (!goal.trim()) { setError('Please describe your automation goal.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          deviceTypes: selectedDevices,
          constraints: selectedConstraints,
          platforms: selectedPlatforms.length ? selectedPlatforms : ['shelly', 'ha', 'nodered', 'esphome'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
      // Fetch matching products for parts list
      const tags = (data.spec?.partsList || []).map((p: { capabilityTag: string }) => p.capabilityTag).filter(Boolean);
      if (tags.length > 0) {
        fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags }) })
          .then((r) => r.json())
          .then((products) => setProductMap(products))
          .catch(() => {});
      }
      // Track success
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'generate_success' }) }).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const tabs = result
    ? [
        { id: 'shelly', label: 'Shelly', platform: 'shelly' as const, content: result.outputs.shelly },
        { id: 'ha', label: 'Home Assistant', platform: 'ha' as const, content: result.outputs.ha },
        { id: 'nodered', label: 'Node-RED', platform: 'nodered' as const, content: result.outputs.nodered },
        { id: 'esphome', label: 'ESPHome', platform: 'esphome' as const, content: result.outputs.esphome },
        { id: 'explanation', label: 'Explanation', content: result.explanation, isMarkdown: true },
        { id: 'buildsheet', label: 'Build Sheet', content: '', isMarkdown: true },
      ]
    : [];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">
            Build your automation
          </h1>
          <p className="text-zinc-500 text-base">
            Describe what you want — get working code for all 4 platforms.
          </p>
        </div>

        {!result ? (
          <div className="rounded-xl border border-zinc-800/80 bg-forge-900 p-8">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-teal-500 text-zinc-900' : 'bg-zinc-800 text-zinc-500'}`}>{s}</div>
                  {s < 3 && <div className={`h-px w-16 transition-all ${step > s ? 'bg-teal-500' : 'bg-zinc-800'}`} />}
                </div>
              ))}
              <span className="ml-2 text-slate-500 text-sm">
                {step === 1 ? 'Describe your goal' : step === 2 ? 'Select devices & constraints' : 'Choose platforms'}
              </span>
            </div>

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className="animate-fade-in space-y-4">
                <label className="block text-slate-200 font-semibold mb-2">What do you want to automate?</label>
                <textarea
                  id="automation-goal"
                  className="forge-input min-h-[120px] resize-none"
                  placeholder="e.g. Turn on the hallway light when motion is detected at night, then turn it off after 5 minutes..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  maxLength={300}
                />
                <p className="text-slate-600 text-xs text-right">{goal.length}/300</p>
                {/* Suggestions */}
                <div>
                  <p className="text-slate-500 text-xs mb-2">Quick starts:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Motion-activated hallway light',
                      'Send alert when door left open',
                      'Turn on fan when temp exceeds 26°C',
                      'Good morning routine at 7am',
                    ].map((s) => (
                      <button key={s} onClick={() => setGoal(s)} className="btn-ghost text-xs">{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button className="btn-primary" onClick={() => { if (goal.trim()) { setError(''); setStep(2); } else setError('Please describe your goal first.'); }}>
                    Next: Select Devices →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Devices & Constraints */}
            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-slate-200 font-semibold mb-3">Which devices are involved?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEVICE_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleItem(selectedDevices, setSelectedDevices, d.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${selectedDevices.includes(d.id) ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-200 font-semibold mb-3">Any constraints? (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {CONSTRAINT_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleItem(selectedConstraints, setSelectedConstraints, c)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selectedConstraints.includes(c) ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(3)}>Next: Platforms →</button>
                </div>
              </div>
            )}

            {/* Step 3: Platforms + Generate */}
            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-slate-200 font-semibold mb-3">Generate code for which platforms?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => toggleItem(selectedPlatforms, setSelectedPlatforms, p.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectedPlatforms.includes(p.id) ? 'bg-teal-500/10 border-teal-500/30 text-zinc-100' : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <span className={`w-3 h-3 rounded border ${selectedPlatforms.includes(p.id) ? 'bg-teal-500 border-teal-500' : 'border-zinc-600'}`} />
                        <span className={selectedPlatforms.includes(p.id) ? p.color : ''}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white/3 rounded-xl p-4 border border-white/5 text-sm space-y-1">
                  <p className="text-slate-400"><span className="text-slate-300 font-medium">Goal:</span> {goal}</p>
                  <p className="text-slate-400"><span className="text-slate-300 font-medium">Devices:</span> {selectedDevices.length ? selectedDevices.join(', ') : 'Auto-detect'}</p>
                  {selectedConstraints.length > 0 && <p className="text-slate-400"><span className="text-slate-300 font-medium">Constraints:</span> {selectedConstraints.join(', ')}</p>}
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="flex justify-between">
                  <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn-primary px-8"
                    onClick={handleBuild}
                    disabled={loading}
                    id="generate-btn"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                        Generating...
                      </span>
                    ) : 'Generate code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Results Panel */
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-xl">Your Automation Code</h2>
                <p className="text-slate-500 text-sm mt-1">&ldquo;{goal}&rdquo;</p>
              </div>
              <button className="btn-ghost" onClick={() => { setResult(null); setStep(1); }}>
                ← Start Over
              </button>
            </div>

            {/* Code tabs */}
            <PlatformTabs tabs={tabs.filter((t) => t.id !== 'buildsheet')} />

            {/* Build Sheet */}
            <div className="rounded-xl border border-zinc-800/80 bg-forge-900 p-6">
              <h3 className="text-zinc-200 font-semibold text-base mb-4">Parts list</h3>
              {result.spec.safetyNotes.length > 0 && (
                <div className="mb-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-amber-400 font-semibold text-sm mb-2">Safety notes</p>
                  <ul className="text-amber-300/60 text-sm space-y-1">
                    {result.spec.safetyNotes.map((n, i) => <li key={i}>· {n}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {result.spec.partsList.map((part, i) => {
                  const product = productMap[part.capabilityTag];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${part.required ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-medium">{part.name}</p>
                        <p className="text-zinc-500 text-xs">
                          Qty: {part.quantity} · {part.required ? 'Required' : 'Optional'}
                          {product && <span className="text-zinc-600"> · {product.priceHint}</span>}
                        </p>
                      </div>
                      {product?.affiliateUrl && (
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-700/60 hover:bg-zinc-700 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors flex-shrink-0"
                          onClick={() => {
                            fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'affiliate_click', metadata: { product: product.name } }) }).catch(() => {});
                          }}
                        >
                          Buy
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Buy All on Amazon */}
              <BuyAllButton
                products={result.spec.partsList
                  .map((part) => {
                    const product = productMap[part.capabilityTag];
                    return product ? { name: product.name, asin: product.asin, priceHint: product.priceHint } : null;
                  })
                  .filter((p): p is { name: string; asin: string; priceHint: string } => p !== null)}
              />

              <p className="text-zinc-700 text-xs mt-4">
                As an Amazon Associate, AutomationForge earns from qualifying purchases. Links are affiliate links — they cost you nothing extra.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
