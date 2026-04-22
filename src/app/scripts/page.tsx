import { getScripts, getFeaturedHelpers } from '@/lib/queries';
import ScriptsClient from './ScriptsClient';
import AdSlot from '@/components/AdSlot';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Script Library — Shelly, HA, Node-RED, ESPHome Snippets',
  description: 'Browse ready-to-use home automation scripts for Shelly, Home Assistant, Node-RED, and ESPHome. Filter by platform and copy to deploy.',
};

export default async function ScriptsPage() {
  const [scripts, helpers] = await Promise.all([
    getScripts(),
    getFeaturedHelpers(4),
  ]);

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Script <span className="gradient-text">Library</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            Ready-to-use snippets for all platforms. Copy, paste, deploy.
          </p>
        </div>

        <AdSlot slot="scripts-top" format="horizontal" className="mb-8" />

        {/* Popular device guides */}
        {helpers.length > 0 && (
          <div className="mb-10 p-5 rounded-xl border " id="popular-device-guides">
            <h2 className="font-semibold text-sm mb-3">Popular device guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {helpers.map((h) => (
                <Link
                  key={h.slug}
                  href={`/helpers/${h.slug}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                >
                  <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                    h.category === 'esphome'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {h.category.toUpperCase()}
                  </span>
                  <span className="text-sm group-hover:text-teal-400 transition-colors truncate" style={{ color: "var(--text-primary)" }}>{h.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <ScriptsClient scripts={scripts} />
      </div>
    </div>
  );
}

