import { notFound } from 'next/navigation';
import { getBuildSheetBySlug, getAllBuildSheetSlugs, getProductsByTags, getHelpersByCapabilityTags } from '@/lib/queries';
import PlatformTabs from '@/components/PlatformTabs';
import ProductCard from '@/components/ProductCard';
import BuyAllButton from '@/components/BuyAllButton';
import AdSlot from '@/components/AdSlot';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateStaticParams() {
  const slugs = await getAllBuildSheetSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getBuildSheetBySlug(slug);
  if (!page) return { title: 'Not Found' };
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      type: 'article',
    },
  };
}

interface AutomationSpec {
  intent: string;
  assumptions: string[];
  devices: Array<{ name: string; type: string }>;
  triggers: Array<{ type: string; device?: string; at?: string }>;
  conditions: Array<{ type: string }>;
  actions: Array<{ type: string; target?: string }>;
  safetyNotes: string[];
  partsList: Array<{ name: string; capabilityTag: string; quantity: number; required: boolean; notes?: string }>;
}

export default async function BuildSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getBuildSheetBySlug(slug);
  if (!page) notFound();

  const spec = page.specs[0];
  const outputs = spec?.outputs || [];
  const parsedSpec: AutomationSpec | null = spec ? JSON.parse(spec.specJson) : null;

  const capabilityTags = parsedSpec?.partsList.map((p) => p.capabilityTag) || [];
  const [products, relatedHelpers] = await Promise.all([
    getProductsByTags(capabilityTags),
    getHelpersByCapabilityTags(capabilityTags, 4),
  ]);

  // JSON-LD structured data
  const howToSteps = parsedSpec?.actions.map((a, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: `${a.type.replace(/_/g, ' ')}${a.target ? ` ${a.target}` : ''}`,
    text: `Configure your automation to ${a.type.replace(/_/g, ' ')} for ${a.target || 'the device'}.`,
  })) || [];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Build Sheets', item: `${baseUrl}/build-sheets` },
          { '@type': 'ListItem', position: 3, name: page.title },
        ],
      },
      {
        '@type': 'HowTo',
        name: page.title,
        description: page.seoDescription,
        step: howToSteps,
        tool: parsedSpec?.partsList.map((p) => ({ '@type': 'HowToTool', name: p.name })) || [],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What platforms does the ${page.title} automation support?`, acceptedAnswer: { '@type': 'Answer', text: 'Shelly (Gen2 JavaScript), Home Assistant (YAML), Node-RED (importable JSON), and ESPHome (YAML).' } },
          { '@type': 'Question', name: `Do I need an account to use ${page.title}?`, acceptedAnswer: { '@type': 'Answer', text: 'No. AutomationForge is completely free and requires no account or login.' } },
          { '@type': 'Question', name: 'Is the code ready to deploy?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each code output is copy-paste ready. Follow the platform-specific deployment steps shown below.' } },
        ],
      },
    ],
  };

  // Platform tab content
  const tabs = [
    { id: 'shelly', label: 'Shelly', platform: 'shelly' as const, content: outputs.find((o) => o.platform === 'shelly')?.codeText || '// Not generated' },
    { id: 'ha', label: 'Home Assistant', platform: 'ha' as const, content: outputs.find((o) => o.platform === 'ha')?.codeText || '# Not generated' },
    { id: 'nodered', label: 'Node-RED', platform: 'nodered' as const, content: outputs.find((o) => o.platform === 'nodered')?.codeText || '[]' },
    { id: 'esphome', label: 'ESPHome', platform: 'esphome' as const, content: outputs.find((o) => o.platform === 'esphome')?.codeText || '# Not generated' },
  ];

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:opacity-70 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/build-sheets" className="hover:opacity-70 transition-colors">Build Sheets</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{page.title}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--active-bg)', color: 'var(--text-secondary)' }}>{page.category}</span>
              <div className="flex gap-1">
                {['Shelly', 'HA', 'NR', 'ESP'].map((p) => (
                  <span key={p} className="w-1.5 h-1.5 rounded-full" title={p} />
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{page.title}</h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>{page.summary}</p>
          </div>

          {/* Ad slot — top */}
          <AdSlot slot="build-sheet-top" format="horizontal" className="mb-8" />

          {/* Safety notes */}
          {parsedSpec?.safetyNotes && parsedSpec.safetyNotes.length > 0 && (
            <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <p className="text-amber-300 font-semibold text-sm mb-2">Safety notes</p>
              <ul className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {parsedSpec.safetyNotes.map((n, i) => <li key={i}>• {n}</li>)}
              </ul>
            </div>
          )}

          {/* Code tabs */}
          <section className="mb-12">
            <h2 className=" font-semibold text-xl mb-5">Code</h2>
            <PlatformTabs tabs={tabs} />
          </section>

          {/* Deployment Steps */}
          {parsedSpec && (
            <section className="mb-12">
              <h2 className=" font-semibold text-xl mb-5">Deployment</h2>
              <div className="space-y-4">
                {[
                  { icon: '1', title: 'Shelly', steps: ['Open Shelly Web UI → Scripts → New Script', 'Paste the Shelly tab code → Save', 'Enable the script and test with your device'] },
                  { icon: '2', title: 'Home Assistant', steps: ['Copy the HA YAML', 'Add to configuration.yaml or automations.yaml', 'Developer Tools → Check Config → Restart HA'] },
                  { icon: '3', title: 'Node-RED', steps: ['Open Node-RED dashboard → Menu → Import', 'Paste the Node-RED JSON → Import', 'Update your device/broker settings → Deploy'] },
                  { icon: '4', title: 'ESPHome', steps: ['Create new ESPHome device (YAML mode)', 'Paste the ESPHome config → update WiFi secrets', 'esphome run your-device.yaml'] },
                ].map((platform) => (
                  <details key={platform.title} className="rounded-lg overflow-hidden group" style={{ border: '1px solid var(--border-default)' }}>
                    <summary className="px-4 py-3 cursor-pointer flex items-center gap-3 select-none">
                      <span className="text-teal-500 text-xs font-mono font-semibold flex-shrink-0">{platform.icon}</span>
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{platform.title}</span>
                      <svg className="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <ol className="px-4 pb-4 pt-1 space-y-1.5">
                      {platform.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{i + 1}.</span> {step}
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Assembly Guide — dynamic per build sheet */}
          {parsedSpec && (() => {
            const tags = new Set(parsedSpec.partsList.map((p) => p.capabilityTag));
            const partNames = parsedSpec.partsList.map((p) => p.name);
            const hasMains = tags.has('relay') || tags.has('switch') || tags.has('dimmer');
            const hasPlug = tags.has('smart_plug');
            const hasMotion = tags.has('motion_sensor');
            const hasTemp = tags.has('temperature_sensor');
            const hasDoor = tags.has('door_sensor');
            const hasLeak = tags.has('leak_sensor');
            const hasZigbee = tags.has('zigbee_coordinator');
            const hasController = tags.has('controller');

            const steps: Array<{ title: string; desc: string; color: string }> = [];

            // Step 1 is always safety
            if (hasMains) {
              steps.push({ title: 'Disconnect Power', desc: 'Switch off the circuit breaker for the circuit you\'re working on. Use a non-contact voltage tester to verify it\'s dead before touching any wires.', color: 'text-red-400' });
            } else {
              steps.push({ title: 'Prepare Your Workspace', desc: 'Gather all hardware from the parts list below. Ensure your Wi-Fi network is stable and your home automation hub (if used) is online and reachable.', color: 'text-red-400' });
            }

            // Hardware-specific steps
            if (hasMains) {
              steps.push({ title: `Wire the ${tags.has('dimmer') ? 'Dimmer' : 'Relay'}`, desc: `Connect L (live), N (neutral),${tags.has('dimmer') ? ' and the dimmed output' : ' SW (switch input), and O (output)'} terminals on your ${partNames.find(n => /relay|switch|dimmer|shelly/i.test(n)) || 'smart switch'} per the vendor wiring diagram. Keep mains and low-voltage wiring separated.`, color: 'text-amber-400' });
            }
            if (hasPlug) {
              steps.push({ title: 'Set Up Smart Plug', desc: `Plug in your ${partNames.find(n => /plug/i.test(n)) || 'smart plug'} and connect it to your Wi-Fi network using the manufacturer\'s app. Assign it a clear name (e.g., "Office Monitor Plug"). Verify it reports power readings in watts.`, color: 'text-amber-400' });
            }
            if (hasMotion) {
              steps.push({ title: 'Mount Motion Sensor', desc: `Install your ${partNames.find(n => /motion|pir/i.test(n)) || 'motion sensor'} at the target location (typically 2–2.5m high, aimed at the detection zone). Pair it with your Zigbee coordinator or Wi-Fi network, then verify state changes (detected/clear) in your dashboard.`, color: 'text-cyan-400' });
            }
            if (hasTemp) {
              steps.push({ title: 'Place Temperature Sensor', desc: `Position your ${partNames.find(n => /temp|dht|ds18/i.test(n)) || 'temperature sensor'} away from direct sunlight, heating vents, and exterior walls. If using ESPHome, flash the ESP32 with the generated config. Wait 2–3 minutes and confirm stable readings in your dashboard.`, color: 'text-cyan-400' });
            }
            if (hasDoor) {
              steps.push({ title: 'Install Door/Window Sensor', desc: `Mount the ${partNames.find(n => /door|window|contact/i.test(n)) || 'contact sensor'} on the door frame with the magnet on the moving part. Ensure the gap is ≤15mm when closed. Pair it and verify it shows "open" and "closed" state changes correctly.`, color: 'text-cyan-400' });
            }
            if (hasLeak) {
              steps.push({ title: 'Position Leak Sensor', desc: `Place your ${partNames.find(n => /leak|water/i.test(n)) || 'leak sensor'} at the lowest point near the appliance (under the washing machine, water heater, or sink). Test with a single drop of water to confirm it triggers an alert.`, color: 'text-cyan-400' });
            }
            if (hasZigbee) {
              steps.push({ title: 'Configure Zigbee Coordinator', desc: `Plug in your ${partNames.find(n => /zigbee|dongle|coordinator/i.test(n)) || 'Zigbee coordinator'} and add it to Home Assistant via Settings → Integrations → Zigbee (ZHA or Zigbee2MQTT). Put each sensor into pairing mode and add them one at a time. Rename entities clearly.`, color: 'text-purple-400' });
            }
            if (hasController) {
              steps.push({ title: 'Set Up Controller', desc: `Flash your ${partNames.find(n => /esp32|rpi|raspberry/i.test(n)) || 'controller'} with the generated firmware/config. Connect it to your network and verify it appears in your dashboard with correct entity names.`, color: 'text-purple-400' });
            }

            // Final step is always test & deploy
            steps.push({ title: 'Test & Deploy', desc: `Paste the generated code into your platform (see Deployment section above), reload automations, and trigger one manual test. Verify the full cycle works: ${parsedSpec.triggers[0]?.type === 'state' ? 'trigger the sensor' : parsedSpec.triggers[0]?.type === 'time' ? 'wait for the scheduled time' : 'activate the trigger'} → confirm the ${parsedSpec.actions[0]?.type?.replace(/_/g, ' ') || 'action'} fires correctly.`, color: 'text-emerald-400' });

            return (
              <section className="mb-12">
                <h2 className="font-semibold text-xl mb-5">Assembly Guide</h2>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                  <div className="rounded-xl overflow-hidden m-4" style={{ border: '1px solid var(--border-default)' }}>
                    <img
                      src="/assembly-guide.png"
                      alt={`Assembly guide for ${page.title}`}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className={`grid grid-cols-1 ${steps.length > 2 ? 'sm:grid-cols-2' : ''} gap-3 px-4 pb-4`}>
                    {steps.map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-xs font-bold ${item.color}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMains && (
                    <div className="mx-4 mb-4 p-2.5 rounded-lg text-xs text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--text-secondary)' }}>
                      ⚠️ This project involves mains voltage wiring. Always disconnect power before working. If unsure, consult a licensed electrician.
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* Parts List & Recommended Products */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className=" font-semibold text-xl mb-1">Parts & products</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Everything you need — click any product to buy on Amazon.</p>
              </div>
            </div>

            {/* Affiliate disclosure — light, FTC-compliant */}
            <p className="text-xs mb-5" style={{ color: 'var(--text-faint)' }}>
              As an Amazon Associate, AutomationForge earns from qualifying purchases. Product links are affiliate links — they cost you nothing extra.
            </p>

            {/* Product cards with images */}
            {products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {products.slice(0, 8).map((product) => {
                    const link = product.affiliateLinks[0];
                    return (
                      <ProductCard
                        key={product.id}
                        name={product.name}
                        brand={product.brand}
                        capabilityTags={JSON.parse(product.capabilityTags || '[]')}
                        priceHint={product.priceHint || undefined}
                        imageUrl={product.imageUrl || undefined}
                        affiliateUrl={link?.url}
                        network={link?.network}
                      />
                    );
                  })}
                </div>

                <div className="mb-8">
                  <BuyAllButton
                    products={products.slice(0, 8).map((p) => ({
                      name: p.name,
                      asin: p.asin || '',
                      priceHint: p.priceHint || undefined,
                    }))}
                  />
                </div>
              </>
            )}

            {/* Parts checklist (from spec) */}
            {parsedSpec && parsedSpec.partsList.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Bill of Materials
                </h3>
                <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                  {parsedSpec.partsList.map((part, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${part.required ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{part.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>×{part.quantity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${part.required ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 border border-white/10'}`}>
                        {part.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Ad slot — mid */}
          <AdSlot slot="build-sheet-mid" format="rectangle" className="mb-12" />

          {/* Troubleshooting FAQ */}
          <section className="mb-12">
            <h2 className=" font-semibold text-xl mb-5">Troubleshooting</h2>
            <div className="space-y-2">
              {[
                { q: 'The Shelly script is not triggering', a: 'Check the Script component is enabled in the Shelly Web UI. Make sure the input/button is wired correctly and the script is saved.' },
                { q: 'Home Assistant automation is not running', a: 'Go to Developer Tools → Template to test your entity states. Check the automation is enabled and the trigger entity ID matches exactly.' },
                { q: 'Node-RED flow import fails', a: 'Make sure you are importing a valid JSON array. Try "Import → Clipboard" and paste the full content including the outer brackets.' },
                { q: 'ESPHome fails to compile', a: 'Check your encryption key and OTA password are valid strings. Update the WiFi credentials in secrets.yaml. Validate YAML indentation (use 2 spaces, no tabs).' },
              ].map((faq, i) => (
                <details key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium select-none" style={{ color: 'var(--text-primary)' }}>{faq.q}</summary>
                  <p className="px-4 pb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Helpful device guides */}
          {relatedHelpers.length > 0 && (
            <section className="mb-12" id="helpful-device-guides">
              <h2 className=" font-semibold text-xl mb-4">Helpful device guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedHelpers.map((helper) => (
                  <Link
                    key={helper.slug}
                    href={`/helpers/${helper.slug}`}
                    className="glass-card group p-4"
                  >
                    <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-medium ${
                      helper.category === 'esphome'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {helper.category.toUpperCase()}
                    </span>
                    <p className="text-sm font-medium mt-2 group-hover:text-teal-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{helper.title}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{helper.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Internal links */}
          <section>
            <h2 className=" font-semibold text-lg mb-3">Related</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/build" className="btn-secondary text-xs">Build a custom automation</Link>
              <Link href="/fix" className="btn-ghost text-xs">Fix my code</Link>
              <Link href="/scripts" className="btn-ghost text-xs">Script library</Link>
              {capabilityTags.slice(0, 2).map((tag) => (
                <Link key={tag} href={`/products/${tag}`} className="btn-ghost text-xs">
                  {tag.replace(/_/g, ' ')} products
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
