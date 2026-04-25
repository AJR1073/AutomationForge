'use client';

import { useState } from 'react';
import PlatformTabs from '@/components/PlatformTabs';
import BuyAllButton from '@/components/BuyAllButton';

const DEVICE_OPTIONS = [
  { id: 'motion_sensor', label: 'Motion Sensor' },
  { id: 'presence_sensor', label: 'Presence / Geofence' },
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

const DEFAULT_DEVICE_IDS = ['relay'];

function uniqueDeviceIds(ids: string[]) {
  const validIds = new Set(DEVICE_OPTIONS.map((device) => device.id));
  return [...new Set(ids.filter((id) => validIds.has(id)))];
}

function inferDeviceIds(goal: string): string[] {
  const g = goal.toLowerCase();
  const devices: string[] = [];

  if (/\b(motion|movement|presence|occupancy|pir)\b/.test(g)) devices.push('motion_sensor');
  if (/\b(come home|arrive|arrival|near home|get home|return home|driveway|geofence|presence)\b/.test(g)) devices.push('presence_sensor');
  if (/\b(door|window|garage|open|left open|entry)\b/.test(g)) devices.push('door_sensor');
  if (/\b(leak|water|flood|pipe|washer|washing machine|sump)\b/.test(g)) devices.push('leak_sensor');
  if (/\b(smoke|fire|alarm|co detector|carbon monoxide)\b/.test(g)) devices.push('smoke_detector');
  if (/\b(button|press|push|scene controller)\b/.test(g)) devices.push('button');
  if (/\b(temp|temperature|hot|cold|heat|cool|fan|humidity|thermostat)\b/.test(g)) devices.push('temperature_sensor');
  if (/\b(dim|dimmer|brightness|fade)\b/.test(g)) devices.push('dimmer');

  if (/\b(light|lamp|porch|hallway|stair|led|bulb)\b/.test(g)) {
    devices.push(g.includes('dim') ? 'dimmer' : 'light');
  }

  if (/\b(relay|switch|valve|lock|garage|grauge|garag|gate|pump|motor|siren|fan)\b/.test(g)) devices.push('relay');
  if (/\b(plug|outlet|appliance|coffee|washer|washing machine|dryer|charger|ev|energy|power|watt)\b/.test(g)) devices.push('smart_plug');
  if (/\b(zigbee|aqara|sonoff|tradfri|hue sensor)\b/.test(g)) devices.push('zigbee_coordinator');

  if (devices.length === 0) devices.push(...DEFAULT_DEVICE_IDS);
  return uniqueDeviceIds(devices);
}

interface BuildResult {
  spec: {
    renderTargets: string[];
    partsList: Array<{ name: string; capabilityTag: string; quantity: number; required: boolean }>;
    safetyNotes: string[];
    actions: Array<{ type: string; target?: string }>;
    triggers: Array<{ type: string; device?: string; at?: string }>;
    assumptions: string[];
  };
  outputs: Partial<Record<'shelly' | 'ha' | 'nodered' | 'esphome', string>>;
  explanation: string;
  specSource?: 'llm' | 'fallback';
  modelUsed?: string | null;
  warning?: string;
}

function buildSetupChecklist(partsList: Array<{ name: string; capabilityTag: string }>) {
  const tags = new Set(partsList.map((part) => part.capabilityTag));
  const names = partsList.map((part) => part.name.toLowerCase()).join(' ');
  const hasMainsControl = tags.has('relay') || tags.has('switch') || tags.has('dimmer') || tags.has('smart_plug');
  const hasPresence = names.includes('presence') || names.includes('geofence');

  const steps: string[] = [
    'Install and power the controller (Home Assistant host, Shelly, or ESP device) on your local network.',
  ];

  if (hasMainsControl) {
    steps.push('Wire relay/switch components using the vendor wiring diagram. Turn off the breaker first and keep line-voltage and low-voltage wiring separated.');
  }
  if (tags.has('motion_sensor')) {
    steps.push('Mount the motion sensor facing the target area, then verify state changes in Home Assistant or your device UI.');
  }
  if (tags.has('door_sensor')) {
    steps.push('Mount the door contact and magnet with correct gap/alignment, then verify open/closed state updates.');
  }
  if (tags.has('temperature_sensor')) {
    steps.push('Place the temperature sensor away from direct heat or sunlight, then confirm stable readings.');
  }
  if (tags.has('leak_sensor')) {
    steps.push('Place leak sensors at the lowest risk points (under appliances or near shutoff valves) and test with a small water drop.');
  }
  if (tags.has('zigbee_coordinator')) {
    steps.push('Start Zigbee pairing mode on the coordinator, pair each Zigbee device, and rename entities clearly before using automation.');
  }
  if (hasPresence) {
    steps.push('Configure Home Assistant Companion App presence/geofence and verify the `person` state changes between `home` and `not_home`.');
  }

  steps.push('Paste the generated automation/config, reload automations, and run one manual test before enabling fully automatic control.');
  steps.push('Run a safety test with someone present: verify stop/obstruction behavior and confirm fail-safe behavior after power/network interruptions.');

  return steps;
}

export default function BuildPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [recommendedDevices, setRecommendedDevices] = useState<string[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['shelly', 'ha', 'nodered', 'esphome']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState('');
  const [productMap, setProductMap] = useState<Record<string, { name: string; brand: string; asin: string; priceHint: string; affiliateUrl: string }>>({});

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const advanceToDevices = () => {
    if (!goal.trim()) {
      setError('Please describe your goal first.');
      return;
    }

    const inferred = inferDeviceIds(goal);
    setRecommendedDevices(inferred);
    if (selectedDevices.length === 0) {
      setSelectedDevices(inferred);
    }
    setError('');
    setStep(2);
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
        ...(['shelly', 'ha', 'nodered', 'esphome'] as const).flatMap((platform) => {
          const content = result.outputs[platform];
          if (!content) return [];
          const label = PLATFORM_OPTIONS.find((option) => option.id === platform)?.label || platform;
          return [{ id: platform, label, platform, content }];
        }),
        { id: 'explanation', label: 'Explanation', content: result.explanation, isMarkdown: true },
        { id: 'buildsheet', label: 'Build Sheet', content: '', isMarkdown: true },
      ]
    : [];
  const setupChecklist = result ? buildSetupChecklist(result.spec.partsList) : [];
  const generationLabel = result
    ? result.specSource === 'llm'
      ? `Generated with LLM (${result.modelUsed || 'unknown model'})`
      : 'Generated with fallback rules (LLM unavailable)'
    : '';

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Build your automation
          </h1>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Describe what you want — get working code for all 4 platforms.
          </p>
        </div>

        {!result ? (
          <div className="rounded-xl p-8" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-teal-500' : ''}`} style={{ background: step >= s ? undefined : 'var(--bg-surface-2)', color: step >= s ? 'var(--bg-base)' : 'var(--text-muted)' }}>{s}</div>
                  {s < 3 && <div className={`h-px w-16 transition-all ${step > s ? 'bg-teal-500' : ''}`} style={{ background: step > s ? undefined : 'var(--border-default)' }} />}
                </div>
              ))}
              <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                {step === 1 ? 'Describe your goal' : step === 2 ? 'Select devices & constraints' : 'Choose platforms'}
              </span>
            </div>

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className="animate-fade-in space-y-4">
                <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>What do you want to automate?</label>
                <textarea
                  id="automation-goal"
                  className="forge-input min-h-[120px] resize-none"
                  placeholder="e.g. Turn on the hallway light when motion is detected at night, then turn it off after 5 minutes..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  maxLength={300}
                />
                <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{goal.length}/300</p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {/* Suggestions */}
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Quick starts:</p>
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
                  <button className="btn-primary" onClick={advanceToDevices}>
                    Next: Select Devices →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Devices & Constraints */}
            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <div className="mb-3">
                    <label className="block font-semibold" style={{ color: 'var(--text-primary)' }}>Which devices are involved?</label>
                    {recommendedDevices.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Suggested from your goal. Adjust anything that does not match your setup.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEVICE_OPTIONS.map((d) => {
                      const selected = selectedDevices.includes(d.id);
                      const recommended = recommendedDevices.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleItem(selectedDevices, setSelectedDevices, d.id)}
                          className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${selected ? 'bg-teal-500/10 border-teal-500/30 text-teal-600' : ''}`}
                          style={!selected ? { background: 'var(--bg-surface-2)', borderColor: recommended ? 'var(--accent-border)' : 'var(--border-default)', color: 'var(--text-secondary)' } : {}}
                        >
                          <span>{d.label}</span>
                          {recommended && (
                            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>
                              Suggested
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Any constraints? (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {CONSTRAINT_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleItem(selectedConstraints, setSelectedConstraints, c)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selectedConstraints.includes(c) ? 'bg-teal-500/10 border-teal-500/30 text-teal-600' : ''}`}
                        style={!selectedConstraints.includes(c) ? { background: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' } : {}}
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
                  <label className="block font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Generate code for which platforms?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => toggleItem(selectedPlatforms, setSelectedPlatforms, p.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectedPlatforms.includes(p.id) ? 'bg-teal-500/10 border-teal-500/30' : ''}`}
                        style={selectedPlatforms.includes(p.id) ? { color: 'var(--text-primary)' } : { background: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                      >
                        <span className={`w-3 h-3 rounded border ${selectedPlatforms.includes(p.id) ? 'bg-teal-500 border-teal-500' : ''}`} style={!selectedPlatforms.includes(p.id) ? { borderColor: 'var(--border-hover)' } : {}} />
                        <span className={selectedPlatforms.includes(p.id) ? p.color : ''}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Goal:</span> {goal}</p>
                  <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Devices:</span> {selectedDevices.length ? selectedDevices.join(', ') : 'Auto-detect'}</p>
                  {selectedConstraints.length > 0 && <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Constraints:</span> {selectedConstraints.join(', ')}</p>}
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
                <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Your Automation Code</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;{goal}&rdquo;</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{generationLabel}</p>
              </div>
              <button
                className="btn-ghost"
                onClick={() => {
                  setGoal('');
                  setSelectedDevices([]);
                  setRecommendedDevices([]);
                  setSelectedConstraints([]);
                  setSelectedPlatforms(['shelly', 'ha', 'nodered', 'esphome']);
                  setProductMap({});
                  setError('');
                  setResult(null);
                  setStep(1);
                }}
              >
                ← Start Over
              </button>
            </div>

            {result.warning && (
              <div className="rounded-lg p-3 text-sm" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-muted)', color: 'var(--text-primary)' }}>
                {result.warning}
              </div>
            )}

            {/* Code tabs */}
            <PlatformTabs tabs={tabs.filter((t) => t.id !== 'buildsheet')} />

            {/* Build Sheet */}
            <div className="rounded-xl p-6" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Parts list</h3>
              {result.spec.safetyNotes.length > 0 && (
                <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <p className="text-amber-300 font-semibold text-sm mb-2">Safety notes</p>
                  <ul className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {result.spec.safetyNotes.map((n, i) => <li key={i}>• {n}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {result.spec.partsList.map((part, i) => {
                  const product = productMap[part.capabilityTag];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${part.required ? 'bg-emerald-400' : ''}`} style={!part.required ? { background: 'var(--border-hover)' } : {}} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{part.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Qty: {part.quantity} · {part.required ? 'Required' : 'Optional'}
                          {product && <span style={{ color: 'var(--text-faint)' }}> · {product.priceHint}</span>}
                        </p>
                      </div>
                      {product?.affiliateUrl && (
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0"
                          style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
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

              {/* Setup checklist */}
              <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Setup checklist
                </h4>
                <ol className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {setupChecklist.map((stepText, index) => (
                    <li key={index}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{index + 1}.</span> {stepText}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Buy All on Amazon */}
              <BuyAllButton
                products={result.spec.partsList
                  .map((part) => {
                    const product = productMap[part.capabilityTag];
                    return product
                      ? {
                          name: product.name,
                          asin: product.asin,
                          priceHint: product.priceHint,
                          quantity: Math.max(1, Number(part.quantity) || 1),
                        }
                      : null;
                  })
                  .filter((p): p is { name: string; asin: string; priceHint: string; quantity: number } => p !== null)}
              />

              <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
                As an Amazon Associate, AutomationForge earns from qualifying purchases. Links are affiliate links — they cost you nothing extra.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
