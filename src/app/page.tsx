import Link from 'next/link';
import { getFeaturedBuildSheets, getAllCategories } from '@/lib/queries';

const CATEGORY_META: Record<string, { label: string; desc: string }> = {
  Lighting:    { label: 'Lighting',     desc: 'Motion lights, schedules, dimmers' },
  Security:    { label: 'Security',     desc: 'Door alerts, cameras, alarms' },
  Climate:     { label: 'Climate',      desc: 'Thermostats, fans, HVAC' },
  Energy:      { label: 'Energy',       desc: 'Solar, EV charging, monitoring' },
  Water:       { label: 'Water',        desc: 'Leak detection, shutoff valves' },
  Garden:      { label: 'Garden',       desc: 'Irrigation, pool pumps, rain skip' },
  Convenience: { label: 'Convenience',  desc: 'Routines, doorbells, presence' },
};

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedBuildSheets(6),
    getAllCategories(),
  ]);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="pt-20 pb-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-4">
            Open-source automation code generator
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-[1.15] mb-6 tracking-tight">
            Generate working automation code for your smart home
          </h1>

          <p className="text-zinc-500 text-lg leading-relaxed mb-10 max-w-xl">
            Describe what you want to automate. Get copy-paste code for
            Shelly, Home Assistant, Node-RED, and ESPHome — plus a parts list.
            No account needed.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link href="/build" className="btn-primary" id="hero-build-btn">
              Build an automation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/fix" className="btn-secondary" id="hero-fix-btn">
              Fix broken code
            </Link>
          </div>

          {/* Platform strip — plain text, no emoji badges */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600">
            <span>Supports:</span>
            <span className="text-amber-500 font-medium">Shelly</span>
            <span className="text-sky-400 font-medium">Home Assistant</span>
            <span className="text-orange-400 font-medium">Node-RED</span>
            <span className="text-emerald-400 font-medium">ESPHome</span>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── How It Works ── */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="section-header">
            <h2>How it works</h2>
            <p>Three steps. No sign-up.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800/80">
            {[
              { num: '1', title: 'Describe your goal', desc: 'Tell us what you want to automate in plain English. Pick your devices and constraints.' },
              { num: '2', title: 'Get code for all platforms', desc: 'We generate working code for Shelly, HA, Node-RED, and ESPHome — switch between tabs.' },
              { num: '3', title: 'Copy and deploy', desc: 'Paste the code into your platform. Follow the deployment steps. Done.' },
            ].map((item) => (
              <div key={item.num} className="bg-forge-900 p-8">
                <div className="text-teal-500 text-xs font-mono font-semibold mb-4 tracking-wider">
                  STEP {item.num}
                </div>
                <h3 className="text-zinc-200 font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="section-header">
              <h2>Browse by category</h2>
              <p>Find automations for every part of your smart home.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat] || { label: cat, desc: '' };
                return (
                  <Link
                    key={cat}
                    href={`/build-sheets?category=${cat}`}
                    className="group p-5 rounded-xl border border-zinc-800/80 bg-forge-900 hover:border-zinc-700 transition-colors"
                  >
                    <span className="text-zinc-200 font-semibold text-sm group-hover:text-teal-400 transition-colors">{meta.label}</span>
                    {meta.desc && <p className="text-zinc-600 text-xs mt-1">{meta.desc}</p>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <hr className="section-divider" />

      {/* ── Featured Build Sheets ── */}
      {featured.length > 0 && (
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <h2>Popular build sheets</h2>
                <p>Step-by-step guides with full code and parts lists.</p>
              </div>
              <Link href="/build-sheets" className="btn-ghost hidden sm:inline-flex">
                View all
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((page) => (
                <Link key={page.id} href={`/build-sheets/${page.slug}`} className="group block p-5 rounded-xl border border-zinc-800/80 bg-forge-900 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                      {page.category}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      {['Shelly', 'HA', 'NR', 'ESP'].map((p) => (
                        <span key={p} className="w-1.5 h-1.5 rounded-full bg-zinc-700" title={p} />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-zinc-200 font-semibold text-sm mb-1.5 group-hover:text-teal-400 transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-zinc-600 text-xs line-clamp-2 leading-relaxed">{page.summary}</p>
                </Link>
              ))}
            </div>
            <div className="mt-8 sm:hidden">
              <Link href="/build-sheets" className="btn-secondary w-full justify-center">
                View all build sheets
              </Link>
            </div>
          </div>
        </section>
      )}

      <hr className="section-divider" />

      {/* ── CTA ── */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="p-10 rounded-xl border border-zinc-800/80 bg-forge-800">
            <h2 className="text-xl font-bold text-zinc-200 mb-3">
              Got broken automation code?
            </h2>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Paste it into our fixer. We&apos;ll detect the platform, find the errors, and return working code.
            </p>
            <Link href="/fix" className="btn-primary" id="cta-fix-btn">
              Fix my code
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
