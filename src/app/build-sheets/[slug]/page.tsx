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
  triggers: Array<{ type: string; device?: string; at?: string; value?: string | number; operator?: string }>;
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
            const hasLight = tags.has('light') || tags.has('led_strip');
            const hasButton = tags.has('button');
            const hasSmoke = tags.has('smoke_detector');

            // Derive the primary trigger and action descriptions for this build
            const triggerDesc = (() => {
              const t = parsedSpec.triggers[0];
              if (!t) return 'activate the trigger';
              if (t.type === 'state' && t.device) return `trigger the ${t.device}`;
              if (t.type === 'numeric_state' && t.device) return `wait for the ${t.device} to reach ${t.operator || ''}${t.value ?? ''}`;
              if (t.type === 'time') return `wait for the scheduled time (${t.at || 'as configured'})`;
              if (t.type === 'input' && t.device) return `press the ${t.device}`;
              return 'activate the trigger';
            })();
            const actionDesc = parsedSpec.actions.map((a) => {
              const verb = a.type?.replace(/_/g, ' ') || 'activate';
              return a.target ? `${verb} the ${a.target}` : verb;
            }).join(', then ') || 'the action fires';

            // Category icons for the header
            const categoryIcons: Record<string, string> = {
              Lighting: '💡', Security: '🔒', Climate: '🌡️', Energy: '⚡',
              Water: '💧', Garden: '🌱', Convenience: '🏠',
            };

            const steps: Array<{ title: string; desc: string; color: string }> = [];

            // ── Step 1: Safety / Preparation ──────────────────────────
            if (hasMains) {
              steps.push({
                title: `Safety First — ${page.title}`,
                desc: `This build involves mains voltage wiring. Switch off the circuit breaker for the target circuit. Use a non-contact voltage tester to confirm the wires are dead before touching anything. Gather all parts from the "${page.title}" bill of materials below.`,
                color: 'text-red-400',
              });
            } else {
              steps.push({
                title: `Gather Parts — ${page.title}`,
                desc: `Collect all hardware listed in the bill of materials below. Ensure your Wi-Fi network is stable and any home automation hub (Home Assistant, Shelly Cloud) is online. For "${page.title}", you'll need: ${partNames.slice(0, 4).join(', ')}${partNames.length > 4 ? `, +${partNames.length - 4} more` : ''}.`,
                color: 'text-blue-400',
              });
            }

            // ── Hardware-Specific Steps (order: mains → plug → sensors → lights → buttons) ──

            if (hasMains && tags.has('dimmer')) {
              steps.push({
                title: 'Wire the Dimmer Module',
                desc: `Connect L (live), N (neutral), and the dimmed output terminals on your ${partNames.find((n) => /dimmer|shelly dimmer/i.test(n)) || 'Shelly Dimmer 2'} per the vendor wiring diagram. The dimmer goes in-line between the switch and the light fitting. Keep mains and low-voltage wiring separated. Restore power briefly to test dimming range before proceeding.`,
                color: 'text-amber-400',
              });
            } else if (hasMains) {
              const relayName = partNames.find((n) => /relay|switch|shelly 1/i.test(n)) || 'Shelly 1 relay';
              const intentLower = parsedSpec.intent.toLowerCase();

              // Build-specific relay wiring context
              const relayContext = intentLower.includes('pet') || intentLower.includes('feeder')
                ? `Wire your ${relayName} to the pet feeder's power supply. Connect the feeder's DC adapter through the relay's output terminals so the relay can switch the feeder on/off. If your feeder uses a low-voltage motor (5V/12V), wire the relay on the adapter's AC input side — never cut into the DC side.`
                : intentLower.includes('valve') || intentLower.includes('shutoff') || (intentLower.includes('water') && intentLower.includes('leak'))
                ? `Wire your ${relayName} to the motorized ball valve on your main water line. The relay's output (O) controls the valve's actuator — when triggered by the leak sensor, it closes the valve to stop water flow. Test the valve manually first to confirm open/close direction.`
                : intentLower.includes('irrigation') || intentLower.includes('garden') || (intentLower.includes('water') && intentLower.includes('garden'))
                ? `Wire your ${relayName} to the irrigation solenoid valve. Connect L (live) to the relay input and the solenoid's live wire to the switched output (O). The relay will open/close the valve on schedule. Use weatherproof enclosures for any outdoor wiring.`
                : intentLower.includes('pool') || intentLower.includes('pump')
                ? `Wire your ${relayName} inline with the pool pump's power circuit. Connect L (live in), N (neutral), and O (switched output to pump). The relay will control the pump's run schedule. Ensure the relay is rated for the pump's amperage — check the pump label.`
                : intentLower.includes('solar') || intentLower.includes('water heater') || intentLower.includes('heater')
                ? `Wire your ${relayName} to the water heater's power circuit. Connect L (live in), N (neutral), and O (switched output). The relay diverts excess solar energy to heating water. Verify the relay's amp rating matches the heater's draw.`
                : intentLower.includes('ev') || intentLower.includes('charger')
                ? `Wire your ${relayName} inline with the EV charger's power circuit. The relay will control when the charger receives power (off-peak hours only). Ensure the relay's amp rating matches the charger — most Level 2 chargers draw 30–40A, so you may need a contactor controlled by the Shelly.`
                : intentLower.includes('fan') || intentLower.includes('ceiling')
                ? `Wire your ${relayName} to the ceiling fan's power circuit. The relay goes in-line at the fan's junction box — L (live in) and O (output to fan). Keep the existing pull-chain as a backup. After wiring, restore power and confirm the fan responds to relay on/off.`
                : intentLower.includes('hvac') || (intentLower.includes('window') && intentLower.includes('hvac'))
                ? `Wire your ${relayName} to the HVAC system's control circuit — typically the 24V thermostat wire, not the high-voltage supply. The relay will interrupt the HVAC call-for-heat/cool signal. Consult your HVAC wiring diagram before cutting any wires.`
                : intentLower.includes('smoke') || intentLower.includes('fire')
                ? `Wire your ${relayName} to receive the smoke detector's dry-contact output on its SW (switch) input. When smoke is detected, the contact closes and the relay switches to trigger lights/alarms. The relay's output (O) connects to the light circuit.`
                : intentLower.includes('garage') || intentLower.includes('gate')
                ? `Wire your ${relayName} in parallel with the garage door opener's wall button. The relay's O (output) connects across the opener's push-button terminals — a brief pulse triggers open/close. Do not wire to mains directly.`
                : intentLower.includes('lock') || intentLower.includes('security') || intentLower.includes('leaving')
                ? `Wire your ${relayName} to the controlled device's power circuit. Connect L (live in), N (neutral), SW (switch input), and O (switched output) per the vendor wiring diagram. Keep mains and low-voltage wiring physically separated.`
                : `Connect L (live in), N (neutral), SW (switch input), and O (switched output) terminals on your ${relayName} per the vendor wiring diagram. The relay replaces or supplements your existing wall switch. Keep mains and low-voltage wiring physically separated. After wiring, restore power and confirm the relay LED powers on.`;

              steps.push({
                title: 'Wire the Relay Module',
                desc: relayContext,
                color: 'text-amber-400',
              });
            }

            if (hasPlug) {
              const plugName = partNames.find((n) => /plug/i.test(n)) || 'smart plug';
              const intentLower = parsedSpec.intent.toLowerCase();
              const plugContext = intentLower.includes('washing') || intentLower.includes('appliance') || intentLower.includes('monitor')
                ? 'Plug the target appliance into the smart plug and verify it reports real-time wattage in the app.'
                : intentLower.includes('charger') || intentLower.includes('ev')
                ? 'Plug your charger into the smart plug. Verify it reports wattage — you\'ll need accurate power readings for the automation threshold.'
                : intentLower.includes('heater') || intentLower.includes('radiator')
                ? 'Plug your heater/radiator into the smart plug. Confirm the plug is rated for the appliance\'s wattage (check the label).'
                : intentLower.includes('christmas') || intentLower.includes('holiday')
                ? 'Plug your Christmas lights into the smart plug. Test that On/Off control works from the app before adding the schedule.'
                : intentLower.includes('standby') || intentLower.includes('entertainment')
                ? 'Plug your power strip / entertainment center into the smart plug. Verify standby power draw reads a few watts in the app.'
                : 'Plug in the target device and confirm the smart plug reports correct On/Off state and power readings in the manufacturer\'s app.';
              steps.push({
                title: `Set Up ${plugName}`,
                desc: `Connect your ${plugName} to Wi-Fi using the manufacturer's app (Shelly, Tasmota, etc.). Assign a clear device name — e.g., "${page.title.split(' ').slice(0, 2).join(' ')} Plug". ${plugContext}`,
                color: 'text-amber-400',
              });
            }

            if (hasSmoke) {
              steps.push({
                title: 'Wire Smoke Detector Interface',
                desc: `Connect your ${partNames.find((n) => /smoke/i.test(n)) || 'smoke detector'}'s dry-contact relay output to a Shelly input or ESP32 GPIO. When smoke is detected, the contact closes and triggers the automation. Test by pressing the smoke detector's test button — your dashboard should show a state change. Never disable your physical smoke alarms.`,
                color: 'text-red-400',
              });
            }

            if (hasMotion) {
              const motionName = partNames.find((n) => /motion|pir/i.test(n)) || 'motion sensor';
              const intentLower = parsedSpec.intent.toLowerCase();
              const mountLocation = intentLower.includes('staircase') || intentLower.includes('stair')
                ? 'at the top or bottom of the staircase, angled to cover the full stair area'
                : intentLower.includes('outdoor') || intentLower.includes('security') || intentLower.includes('camera')
                ? 'outdoors at 2–2.5m height, aimed at the approach path. Use a weatherproof enclosure if not IP65 rated'
                : intentLower.includes('living') || intentLower.includes('tv') || intentLower.includes('room')
                ? 'in the living room at 2–2.5m height, aimed at the seating area to detect presence'
                : 'at the target location (typically 2–2.5m high, aimed at the primary detection zone)';
              steps.push({
                title: `Mount ${motionName}`,
                desc: `Install your ${motionName} ${mountLocation}. Pair it with your Zigbee coordinator or Wi-Fi network, then verify state changes (detected → clear) appear in your dashboard. Walk through the detection zone a few times to confirm reliable triggering.`,
                color: 'text-cyan-400',
              });
            }

            if (hasTemp) {
              const tempName = partNames.find((n) => /temp|dht|ds18/i.test(n)) || 'temperature sensor';
              const intentLower = parsedSpec.intent.toLowerCase();
              const placement = intentLower.includes('radiator') || intentLower.includes('hvac')
                ? 'in the room you want to regulate, at desk height (1–1.5m), away from the radiator/vent itself'
                : intentLower.includes('fan') || intentLower.includes('ceiling')
                ? 'in the room with the fan, at a comfortable reading height — avoid placing it near windows or in direct sunlight'
                : 'away from direct sunlight, heating vents, and exterior walls for accurate ambient readings';
              steps.push({
                title: `Place ${tempName}`,
                desc: `Position your ${tempName} ${placement}. If using ESPHome, flash the ESP32 with the generated config (see Code section). Wait 2–3 minutes and confirm stable, realistic readings in your dashboard before relying on them for thresholds.`,
                color: 'text-cyan-400',
              });
            }

            if (hasDoor) {
              const doorName = partNames.find((n) => /door|window|contact/i.test(n)) || 'contact sensor';
              const intentLower = parsedSpec.intent.toLowerCase();
              const doorContext = intentLower.includes('garage')
                ? 'on the garage door frame, with the magnet on the moving door panel. The sensor should read "closed" when the door is fully down'
                : intentLower.includes('window')
                ? 'on the window frame, with the magnet on the opening sash. Ensure the gap is ≤15mm when closed'
                : 'on the door frame, with the magnet on the door itself. Ensure the gap is ≤15mm when closed';
              steps.push({
                title: `Install ${doorName}`,
                desc: `Mount your ${doorName} ${doorContext}. Pair it with your hub and open/close the door a few times — verify "open" and "closed" state changes appear reliably in your dashboard. Note the entity ID for the automation code.`,
                color: 'text-cyan-400',
              });
            }

            if (hasLeak) {
              const leakName = partNames.find((n) => /leak|water/i.test(n)) || 'leak sensor';
              const intentLower = parsedSpec.intent.toLowerCase();
              const leakPlacement = intentLower.includes('garden') || intentLower.includes('irrigation') || intentLower.includes('rain')
                ? 'outdoors in an exposed area where rain will reach the sensor probes. This acts as your rain detector to skip irrigation cycles'
                : intentLower.includes('pool')
                ? 'near the pool pump equipment area at the lowest accessible point, where a leak would first appear'
                : 'at the lowest point near the water source — under the washing machine, water heater, or sink. The probes must touch the floor';
              steps.push({
                title: `Position ${leakName}`,
                desc: `Place your ${leakName} ${leakPlacement}. Test with a few drops of water on the sensor probes to confirm it triggers an alert. If battery-powered, note the battery level — check it quarterly.`,
                color: 'text-cyan-400',
              });
            }

            if (hasLight && !hasMains) {
              // Light step only for builds where the light itself is a smart device (not wired via relay)
              const lightName = partNames.find((n) => /light|bulb|strip|led|wled/i.test(n)) || 'smart light';
              const intentLower = parsedSpec.intent.toLowerCase();
              const lightContext = intentLower.includes('ambient') || intentLower.includes('tv')
                ? `Install your ${lightName} behind or beside the TV. Connect it to Wi-Fi or Zigbee and test that on/off and brightness control work from your dashboard.`
                : intentLower.includes('flash') || intentLower.includes('doorbell')
                ? `Install your ${lightName} in the room where you want the flash notification. Connect to Wi-Fi/Zigbee. Test that you can toggle it rapidly from your dashboard — the automation will flash it when triggered.`
                : intentLower.includes('porch') || intentLower.includes('outdoor')
                ? `Install your ${lightName} at the outdoor location. Ensure it's rated for outdoor use (IP44+). Connect to Wi-Fi and verify on/off control from your dashboard.`
                : intentLower.includes('gradual') || intentLower.includes('dim') || intentLower.includes('morning')
                ? `Install your ${lightName} and connect to Wi-Fi or Zigbee. Verify that brightness control (0–100%) works from your dashboard — the automation will ramp brightness gradually.`
                : `Install your ${lightName} and connect it to your Wi-Fi or Zigbee network. Verify on/off and brightness control from your dashboard before adding it to the automation.`;
              steps.push({
                title: `Set Up ${lightName}`,
                desc: lightContext,
                color: 'text-yellow-400',
              });
            }

            if (hasButton) {
              const buttonName = partNames.find((n) => /button|push/i.test(n)) || 'wireless button';
              const intentLower = parsedSpec.intent.toLowerCase();
              const buttonContext = intentLower.includes('doorbell')
                ? `Mount your ${buttonName} at the front door as a smart doorbell. Pair it with your Zigbee coordinator or Wi-Fi network. Test that single-press events appear in your dashboard — the automation will flash lights and send a notification when pressed.`
                : intentLower.includes('pet') || intentLower.includes('feeder')
                ? `Mount your ${buttonName} near the pet feeding area for manual override. Pair it and verify button-press events appear in your dashboard. The scheduled automation will also trigger without pressing the button.`
                : `Pair your ${buttonName} with your hub (Zigbee or Wi-Fi). Test single-press, double-press, and long-press events in your dashboard. The automation uses the single-press event by default.`;
              steps.push({
                title: `Pair ${buttonName}`,
                desc: buttonContext,
                color: 'text-yellow-400',
              });
            }

            if (hasZigbee) {
              steps.push({
                title: 'Configure Zigbee Coordinator',
                desc: `Plug in your ${partNames.find((n) => /zigbee|dongle|coordinator/i.test(n)) || 'Zigbee coordinator'} and add it to Home Assistant via Settings → Integrations → Zigbee (ZHA or Zigbee2MQTT). Put each sensor into pairing mode and add them one at a time. Rename entities to match the names used in the generated code.`,
                color: 'text-purple-400',
              });
            }

            if (hasController) {
              steps.push({
                title: 'Flash ESP32 Controller',
                desc: `Connect your ${partNames.find((n) => /esp32|rpi|raspberry/i.test(n)) || 'ESP32'} via USB. Flash it with the ESPHome config from the Code section above. After flashing, the device will connect to your Wi-Fi and appear in Home Assistant under Integrations → ESPHome. Verify all sensor entities are reporting data.`,
                color: 'text-purple-400',
              });
            }

            // ── Connect to Network step (for non-mains wireless builds) ──
            if (!hasMains && !hasController && !hasZigbee) {
              steps.push({
                title: 'Connect Devices to Network',
                desc: `Ensure all devices for "${page.title}" are on the same Wi-Fi network as your automation hub. Open each device's app and verify they appear as online. Note down the device IP addresses or entity IDs — you'll need them for the automation code.`,
                color: 'text-indigo-400',
              });
            }

            // ── Configure Automation step ──
            steps.push({
              title: 'Load the Automation Code',
              desc: `Choose your platform from the Code section above (Shelly, Home Assistant, Node-RED, or ESPHome). Copy the generated code and follow the platform-specific Deployment steps. Update any placeholder entity IDs or IP addresses with your actual device values.`,
              color: 'text-teal-400',
            });

            // ── Final step: build-specific test ──
            steps.push({
              title: `Test Your ${page.title}`,
              desc: `Trigger a manual test: ${triggerDesc}. Verify the complete cycle: ${actionDesc}. If using time-based triggers, temporarily change the schedule to 1 minute from now to test without waiting. Check your dashboard and notifications to confirm everything works end-to-end.`,
              color: 'text-emerald-400',
            });

            return (
              <section className="mb-12">
                <h2 className="font-semibold text-xl mb-5">Assembly Guide</h2>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                  {/* Dynamic header with category context */}
                  <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <span className="text-2xl">{categoryIcons[page.category] || '🔧'}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {page.title} — Step-by-Step
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {steps.length} steps · {parsedSpec.partsList.length} components · {page.category}
                      </p>
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 ${steps.length > 3 ? 'sm:grid-cols-2' : ''} gap-3 p-4`}>
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
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pick one product per component — we show options for each part in your bill of materials.</p>
              </div>
            </div>

            {/* Affiliate disclosure — light, FTC-compliant */}
            <p className="text-xs mb-5" style={{ color: 'var(--text-faint)' }}>
              As an Amazon Associate, AutomationForge earns from qualifying purchases. Product links are affiliate links — they cost you nothing extra.
            </p>

            {/* Product cards grouped by BOM item */}
            {products.length > 0 && parsedSpec && (() => {
              // Group products by their matching BOM capability tag
              const bomGroups = parsedSpec.partsList.map((part) => {
                const matching = products.filter((p) => {
                  const caps: string[] = JSON.parse(p.capabilityTags || '[]');
                  return caps.includes(part.capabilityTag);
                });
                return { part, products: matching };
              }).filter((g) => g.products.length > 0);

              // For BuyAll, pick one product per BOM group (cheapest)
              const buyAllProducts = bomGroups.map((g) => {
                const sorted = [...g.products].sort((a, b) => {
                  const priceA = parseFloat((a.priceHint || '$999').replace(/[^0-9.]/g, ''));
                  const priceB = parseFloat((b.priceHint || '$999').replace(/[^0-9.]/g, ''));
                  return priceA - priceB;
                });
                return sorted[0];
              });

              return (
                <>
                  {bomGroups.map((group, gi) => (
                    <div key={gi} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {group.part.name}
                        </span>
                        {group.products.length > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            choose one
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {group.part.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.products.slice(0, 4).map((product) => {
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
                    </div>
                  ))}

                  <div className="mb-8">
                    <BuyAllButton
                      products={buyAllProducts.map((p) => ({
                        name: p.name,
                        asin: p.asin || '',
                        priceHint: p.priceHint || undefined,
                      }))}
                    />
                  </div>
                </>
              );
            })()}

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
