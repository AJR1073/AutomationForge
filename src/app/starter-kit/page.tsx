import { getProductsByTags } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import BuyAllButton from '@/components/BuyAllButton';
import Link from 'next/link';
import type { Metadata } from 'next';
import NewsletterCapture from '@/components/NewsletterCapture';

export const metadata: Metadata = {
  title: 'Smart Home Starter Kit — Best Hardware for Home Automation',
  description: 'Curated starter kits for home automation. Essential, Standard, and Advanced bundles with Shelly, ESP32, and smart sensors — compatible with all platforms.',
};

interface Tier {
  name: string;
  tagline: string;
  estimate: string;
  tags: string[];
  color: string;
  icon: string;
}

const TIERS: Tier[] = [
  {
    name: 'Essential',
    tagline: 'Start automating with the basics',
    estimate: '~$50',
    tags: ['relay', 'smart_plug', 'motion_sensor'],
    color: '#059669',
    icon: '🌱',
  },
  {
    name: 'Standard',
    tagline: 'The most popular home automation setup',
    estimate: '~$120',
    tags: ['relay', 'smart_plug', 'motion_sensor', 'temperature_sensor', 'door_sensor', 'smart_bulb'],
    color: '#0284c7',
    icon: '⚡',
  },
  {
    name: 'Advanced',
    tagline: 'Full-house automation coverage',
    estimate: '~$250',
    tags: ['relay', 'smart_plug', 'motion_sensor', 'temperature_sensor', 'door_sensor', 'smart_bulb', 'water_leak_sensor', 'power_monitor', 'dimmer', 'rgbw_controller'],
    color: '#7c3aed',
    icon: '🚀',
  },
];

export default async function StarterKitPage() {
  // Fetch products for all tiers
  const allTags = [...new Set(TIERS.flatMap((t) => t.tags))];
  const products = await getProductsByTags(allTags);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Smart Home Starter Kits',
    description: 'Curated hardware bundles for home automation',
    itemListElement: TIERS.map((tier, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${tier.name} Starter Kit`,
      description: tier.tagline,
    })),
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Starter Kit</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Smart Home <span style={{ color: 'var(--accent)' }}>Starter Kits</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Curated hardware bundles that work with Shelly, Home Assistant, Node-RED, and ESPHome.
            Pick your level and start automating today.
          </p>
        </div>

        {/* Affiliate Disclosure */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-8" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            As an Amazon Associate, AutomationForge earns from qualifying purchases. Product links are affiliate links — they cost you nothing extra and help keep this tool free.
          </p>
        </div>

        {/* Tiers */}
        <div className="space-y-12">
          {TIERS.map((tier) => {
            const tierProducts = products.filter((p) => {
              const caps: string[] = JSON.parse(p.capabilityTags || '[]');
              return tier.tags.some((tag) => caps.includes(tag));
            });

            return (
              <section key={tier.name} className="glass-card overflow-hidden" id={`tier-${tier.name.toLowerCase()}`}>
                {/* Tier header */}
                <div className="p-6 md:p-8" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{tier.icon}</span>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {tier.name}
                    </h2>
                    <span
                      className="text-sm font-semibold px-3 py-0.5 rounded-full ml-auto"
                      style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}30` }}
                    >
                      {tier.estimate}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {tier.tagline}
                  </p>

                  {/* Tag pills */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {tier.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/products/${tag}`}
                        className="text-[0.65rem] px-2 py-0.5 rounded-md transition-colors hover:opacity-80"
                        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
                      >
                        {tag.replace(/_/g, ' ')}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Products grid */}
                {tierProducts.length > 0 ? (
                  <div className="p-6 md:p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {tierProducts.map((product) => {
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

                    <BuyAllButton
                      products={tierProducts.map((p) => ({
                        name: p.name,
                        asin: p.asin || '',
                        priceHint: p.priceHint || undefined,
                      }))}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Products coming soon for this tier.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Comparison Table */}
        <section className="mt-16 mb-12">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Compare kits
          </h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-muted)' }}>Feature</th>
                    {TIERS.map((t) => (
                      <th key={t.name} className="text-center p-4 font-semibold" style={{ color: t.color }}>
                        {t.icon} {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Smart switches & relays', values: ['✓', '✓', '✓'] },
                    { label: 'Motion sensors', values: ['✓', '✓', '✓'] },
                    { label: 'Smart plugs', values: ['✓', '✓', '✓'] },
                    { label: 'Temperature sensors', values: ['—', '✓', '✓'] },
                    { label: 'Door/window sensors', values: ['—', '✓', '✓'] },
                    { label: 'Smart bulbs', values: ['—', '✓', '✓'] },
                    { label: 'Water leak detection', values: ['—', '—', '✓'] },
                    { label: 'Power monitoring', values: ['—', '—', '✓'] },
                    { label: 'Dimmers', values: ['—', '—', '✓'] },
                    { label: 'RGB/RGBW control', values: ['—', '—', '✓'] },
                    { label: 'Est. price', values: TIERS.map((t) => t.estimate) },
                  ].map((row) => (
                    <tr key={row.label} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                      {row.values.map((val, i) => (
                        <td
                          key={i}
                          className="p-4 text-center font-medium"
                          style={{ color: val === '—' ? 'var(--text-faint)' : val.startsWith('~') ? TIERS[i].color : 'var(--accent)' }}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="glass-card p-10 text-center mb-12">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Already have your hardware?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Use our code generator to build automations for any of these devices.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/build" className="btn-primary">
              Build an automation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/build-sheets" className="btn-secondary">
              Browse build sheets
            </Link>
          </div>
        </div>

        <NewsletterCapture source="starter-kit" />
      </div>
    </div>
  );
}
