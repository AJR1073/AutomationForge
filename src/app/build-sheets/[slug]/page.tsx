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
          <nav className="flex items-center gap-2 text-xs text-zinc-600 mb-8">
            <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/build-sheets" className="hover:text-zinc-400 transition-colors">Build Sheets</Link>
            <span>/</span>
            <span className="text-zinc-400">{page.title}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">{page.category}</span>
              <div className="flex gap-1">
                {['Shelly', 'HA', 'NR', 'ESP'].map((p) => (
                  <span key={p} className="w-1.5 h-1.5 rounded-full bg-zinc-700" title={p} />
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">{page.title}</h1>
            <p className="text-zinc-500 text-lg leading-relaxed">{page.summary}</p>
          </div>

          {/* Ad slot — top */}
          <AdSlot slot="build-sheet-top" format="horizontal" className="mb-8" />

          {/* Safety notes */}
          {parsedSpec?.safetyNotes && parsedSpec.safetyNotes.length > 0 && (
            <div className="mb-8 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-amber-400 font-semibold text-sm mb-2">Safety notes</p>
              <ul className="space-y-1">
                {parsedSpec.safetyNotes.map((n, i) => <li key={i} className="text-amber-300/60 text-sm">· {n}</li>)}
              </ul>
            </div>
          )}

          {/* Code tabs */}
          <section className="mb-12">
            <h2 className="text-zinc-200 font-semibold text-xl mb-5">Code</h2>
            <PlatformTabs tabs={tabs} />
          </section>

          {/* Deployment Steps */}
          {parsedSpec && (
            <section className="mb-12">
              <h2 className="text-zinc-200 font-semibold text-xl mb-5">Deployment</h2>
              <div className="space-y-4">
                {[
                  { icon: '1', title: 'Shelly', steps: ['Open Shelly Web UI → Scripts → New Script', 'Paste the Shelly tab code → Save', 'Enable the script and test with your device'] },
                  { icon: '2', title: 'Home Assistant', steps: ['Copy the HA YAML', 'Add to configuration.yaml or automations.yaml', 'Developer Tools → Check Config → Restart HA'] },
                  { icon: '3', title: 'Node-RED', steps: ['Open Node-RED dashboard → Menu → Import', 'Paste the Node-RED JSON → Import', 'Update your device/broker settings → Deploy'] },
                  { icon: '4', title: 'ESPHome', steps: ['Create new ESPHome device (YAML mode)', 'Paste the ESPHome config → update WiFi secrets', 'esphome run your-device.yaml'] },
                ].map((platform) => (
                  <details key={platform.title} className="rounded-lg border border-zinc-800/80 bg-forge-900 overflow-hidden group">
                    <summary className="px-4 py-3 cursor-pointer flex items-center gap-3 select-none">
                      <span className="text-teal-500 text-xs font-mono font-semibold flex-shrink-0">{platform.icon}</span>
                      <span className="text-zinc-300 font-medium text-sm">{platform.title}</span>
                      <svg className="w-3.5 h-3.5 text-zinc-600 ml-auto group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <ol className="px-4 pb-4 pt-1 space-y-1.5">
                      {platform.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-zinc-500 text-sm">
                          <span className="text-zinc-600 font-mono text-xs mt-0.5">{i + 1}.</span> {step}
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Parts List & Recommended Products */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-zinc-200 font-semibold text-xl mb-1">Parts & products</h2>
                <p className="text-zinc-600 text-sm">Everything you need — click any product to buy on Amazon.</p>
              </div>
            </div>

            {/* Affiliate disclosure — light, FTC-compliant */}
            <p className="text-zinc-700 text-xs mb-5">
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
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Bill of Materials
                </h3>
                <div className="divide-y divide-white/5">
                  {parsedSpec.partsList.map((part, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${part.required ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-slate-200 text-sm flex-1">{part.name}</span>
                      <span className="text-slate-500 text-xs">×{part.quantity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${part.required ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
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
            <h2 className="text-zinc-200 font-semibold text-xl mb-5">Troubleshooting</h2>
            <div className="space-y-2">
              {[
                { q: 'The Shelly script is not triggering', a: 'Check the Script component is enabled in the Shelly Web UI. Make sure the input/button is wired correctly and the script is saved.' },
                { q: 'Home Assistant automation is not running', a: 'Go to Developer Tools → Template to test your entity states. Check the automation is enabled and the trigger entity ID matches exactly.' },
                { q: 'Node-RED flow import fails', a: 'Make sure you are importing a valid JSON array. Try "Import → Clipboard" and paste the full content including the outer brackets.' },
                { q: 'ESPHome fails to compile', a: 'Check your encryption key and OTA password are valid strings. Update the WiFi credentials in secrets.yaml. Validate YAML indentation (use 2 spaces, no tabs).' },
              ].map((faq, i) => (
                <details key={i} className="rounded-lg border border-zinc-800/80 bg-forge-900 overflow-hidden">
                  <summary className="px-4 py-3 cursor-pointer text-zinc-300 text-sm font-medium select-none">{faq.q}</summary>
                  <p className="px-4 pb-3 text-zinc-500 text-sm">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Helpful device guides */}
          {relatedHelpers.length > 0 && (
            <section className="mb-12" id="helpful-device-guides">
              <h2 className="text-zinc-200 font-semibold text-xl mb-4">Helpful device guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedHelpers.map((helper) => (
                  <Link
                    key={helper.slug}
                    href={`/helpers/${helper.slug}`}
                    className="group p-4 rounded-lg border border-zinc-800/80 bg-forge-900 hover:border-zinc-700 transition-colors"
                  >
                    <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-medium ${
                      helper.category === 'esphome'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {helper.category.toUpperCase()}
                    </span>
                    <p className="text-zinc-300 text-sm font-medium mt-2 group-hover:text-teal-400 transition-colors">{helper.title}</p>
                    <p className="text-zinc-600 text-xs mt-1 line-clamp-2">{helper.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Internal links */}
          <section>
            <h2 className="text-zinc-200 font-semibold text-lg mb-3">Related</h2>
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
