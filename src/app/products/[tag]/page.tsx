import { getAllCapabilityTags, getProductsByCapabilityTag } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import BuyAllButton from '@/components/BuyAllButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const tags = await getAllCapabilityTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const label = tag.replace(/_/g, ' ');
  return {
    title: `Best ${label} for Home Automation`,
    description: `Browse recommended ${label} products for Shelly, Home Assistant, Node-RED, and ESPHome. Includes affiliate links and compatibility notes.`,
  };
}

export default async function ProductTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const products = await getProductsByCapabilityTag(tag);
  if (products.length === 0) notFound();

  const label = tag.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <nav className="flex items-center gap-2 text-xs mb-8">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <span className="" style={{ color: "var(--text-primary)" }}>Products</span>
          <span>/</span>
          <span className="" style={{ color: "var(--text-primary)" }}>{label}</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Best <span className="text-teal-400">{label}</span> for home automation
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            Compatible with Shelly, Home Assistant, Node-RED, and ESPHome.
          </p>
        </div>

        <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>
          As an Amazon Associate, AutomationForge earns from qualifying purchases. Links are affiliate links — they cost you nothing extra.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {products.map((product) => {
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

        <div className="mb-12">
          <BuyAllButton
            products={products.map((p) => ({
              name: p.name,
              asin: p.asin || '',
              priceHint: p.priceHint || undefined,
            }))}
          />
        </div>

        <div className="rounded-xl border  p-6 text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Need a complete automation using {label}?</p>
          <Link href="/build" className="btn-primary">Build automation with {label}<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></Link>
        </div>
      </div>
    </div>
  );
}
