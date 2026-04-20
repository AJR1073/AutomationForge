import { getFeaturedBuildSheets, getBuildSheetsByCategory, getAllCategories } from '@/lib/queries';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home Automation Build Sheets — All Platforms',
  description: 'Browse 30+ step-by-step automation build sheets with working code for Shelly, Home Assistant, Node-RED, and ESPHome.',
};

export default async function BuildSheetsIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params.category;

  const [categories, pages] = await Promise.all([
    getAllCategories(),
    category ? getBuildSheetsByCategory(category) : getFeaturedBuildSheets(30),
  ]);

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">
            Build sheets
          </h1>
          <p className="text-zinc-500 text-base">
            Step-by-step guides with working code, parts lists, and troubleshooting.
          </p>
        </div>

        <AdSlot slot="build-sheets-top" format="horizontal" className="mb-8" />

        {/* Category filter */}
        <div className="tab-bar mb-8">
          <Link href="/build-sheets" className={`tab-item ${!category ? 'active' : ''}`}>All</Link>
          {categories.map((cat) => (
            <Link key={cat} href={`/build-sheets?category=${cat}`} className={`tab-item ${category === cat ? 'active' : ''}`}>
              {cat}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Link key={page.id} href={`/build-sheets/${page.slug}`} className="group block p-5 rounded-xl border border-zinc-800/80 bg-forge-900 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                  {page.category}
                </span>
              </div>
              <h2 className="text-zinc-200 font-semibold text-sm mb-1.5 group-hover:text-teal-400 transition-colors">
                {page.title}
              </h2>
              <p className="text-zinc-600 text-xs line-clamp-2 leading-relaxed">{page.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
