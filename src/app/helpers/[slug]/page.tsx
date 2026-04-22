import { notFound } from 'next/navigation';
import { getHelperBySlug, getAllHelperSlugs, getProductsByTags } from '@/lib/queries';
import CodeBlock from '@/components/CodeBlock';
import ProductCard from '@/components/ProductCard';
import AdSlot from '@/components/AdSlot';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600; // ISR: revalidate every hour

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getAllHelperSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getHelperBySlug(slug);
  if (!page) return { title: 'Not Found' };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      type: 'article',
      url: `${baseUrl}/helpers/${page.slug}`,
    },
    alternates: { canonical: `${baseUrl}/helpers/${page.slug}` },
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CodeBlockEntry {
  language: string;
  filename?: string;
  code: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface HelperContent {
  whenToUse: string;
  codeBlocks: CodeBlockEntry[];
  troubleshooting: string[];
  faqs: FAQ[];
}

// ── Placeholder Detection ─────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /YOUR_\w+/g,
  /REPLACE_ME\w*/g,
  /entity_id/g,
  /!secret\s+\w+/g,
  /YOUR_SHELLY_IP/g,
  /YOUR_BROKER/g,
  /YOUR_WEBHOOK_URL/g,
  /your-device/g,
];

function detectPlaceholders(code: string): string[] {
  const found = new Set<string>();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = code.match(pattern);
    if (matches) matches.forEach((m) => found.add(m));
  }
  return [...found];
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function HelperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getHelperBySlug(slug);
  if (!page) notFound();

  const content: HelperContent = JSON.parse(page.contentJson);
  const capabilityTags: string[] = JSON.parse(page.capabilityTags || '[]');
  const relatedSlugs: string[] = JSON.parse(page.relatedBuildSheetSlugs || '[]');

  const products = await getProductsByTags(capabilityTags);

  // Collect all placeholders across code blocks
  const allPlaceholders = content.codeBlocks.flatMap((cb) => detectPlaceholders(cb.code));
  const uniquePlaceholders = [...new Set(allPlaceholders)];

  // ── JSON-LD ─────────────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';

  const howToSteps = content.codeBlocks.map((cb, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: cb.filename || `Step ${i + 1}: ${cb.language} configuration`,
    text: cb.code.split('\n').slice(0, 3).join(' ').trim(),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Helpers', item: `${baseUrl}/helpers` },
          { '@type': 'ListItem', position: 3, name: page.title },
        ],
      },
      {
        '@type': 'HowTo',
        name: page.title,
        description: page.seoDescription,
        step: howToSteps,
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    ],
  };

  // Platform for CodeBlock component
  const categoryPlatform = page.category === 'esphome' ? 'esphome' : undefined;

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-8" id="helper-breadcrumb" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:opacity-70 transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>Helpers</span>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>{page.title}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                page.category === 'esphome'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}>
                {page.category.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" id="helper-title">
              {page.title}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>{page.summary}</p>
          </div>

          {/* When to use this */}
          <section className="mb-10">
            <h2 className="font-semibold text-xl mb-4">When to use this</h2>
            <div className="p-5 rounded-lg" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{content.whenToUse}</p>
            </div>
          </section>

          {/* Ad slot — top */}
          <AdSlot slot="helper-top" format="horizontal" className="mb-8" />

          {/* Code blocks */}
          <section className="mb-10" id="helper-code-blocks">
            <h2 className="font-semibold text-xl mb-5">Working config / code</h2>
            <div className="space-y-5">
              {content.codeBlocks.map((cb, i) => (
                <CodeBlock
                  key={i}
                  code={cb.code}
                  language={cb.language}
                  platform={categoryPlatform}
                  filename={cb.filename}
                />
              ))}
            </div>
          </section>

          {/* Required inputs box */}
          {uniquePlaceholders.length > 0 && (
            <section className="mb-10" id="helper-required-inputs">
              <div className="p-5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <h3 className="text-amber-400 font-semibold text-sm mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Required inputs — replace before deploying
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniquePlaceholders.map((ph) => (
                    <code key={ph} className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      {ph}
                    </code>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Troubleshooting */}
          <section className="mb-10" id="helper-troubleshooting">
            <h2 className="font-semibold text-xl mb-4">Troubleshooting</h2>
            <ul className="space-y-2">
              {content.troubleshooting.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {/* Ad slot — mid */}
          <AdSlot slot="helper-mid" format="rectangle" className="mb-10" />

          {/* FAQ */}
          <section className="mb-10" id="helper-faqs">
            <h2 className="font-semibold text-xl mb-5">FAQ</h2>
            <div className="space-y-2">
              {content.faqs.map((faq, i) => (
                <details key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                  <summary className="px-4 py-3 cursor-pointer text-sm font-medium select-none" style={{ color: 'var(--text-primary)' }}>{faq.q}</summary>
                  <p className="px-4 pb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related build sheets */}
          {relatedSlugs.length > 0 && (
            <section className="mb-10" id="helper-related-build-sheets">
              <h2 className="font-semibold text-xl mb-4">Related build sheets</h2>
              <div className="flex flex-wrap gap-2">
                {relatedSlugs.map((rs) => (
                  <Link
                    key={rs}
                    href={`/build-sheets/${rs}`}
                    className="px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    {rs.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Parts list */}
          <section className="mb-10" id="helper-parts-list">
            <div className="mb-4">
              <h2 className="font-semibold text-xl mb-1">Parts &amp; products</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Recommended hardware for this guide.</p>
            </div>

            {/* Affiliate disclosure */}
            <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>
              As an Amazon Associate, AutomationForge earns from qualifying purchases. Product links are affiliate links — they cost you nothing extra.
            </p>

            {products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            )}
          </section>

          {/* Ad slot — bottom */}
          <AdSlot slot="helper-bottom" format="horizontal" className="mb-10" />

          {/* Back links */}
          <section>
            <div className="flex flex-wrap gap-2">
              <Link href="/build-sheets" className="btn-secondary text-xs">All build sheets</Link>
              <Link href="/scripts" className="btn-ghost text-xs">Script library</Link>
              <Link href="/build" className="btn-ghost text-xs">Build a custom automation</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
