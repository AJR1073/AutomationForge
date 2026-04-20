import { getScripts } from '@/lib/queries';
import ScriptsClient from './ScriptsClient';
import AdSlot from '@/components/AdSlot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Script Library — Shelly, HA, Node-RED, ESPHome Snippets',
  description: 'Browse ready-to-use home automation scripts for Shelly, Home Assistant, Node-RED, and ESPHome. Filter by platform and copy to deploy.',
};

export default async function ScriptsPage() {
  const scripts = await getScripts();

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Script <span className="gradient-text">Library</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Ready-to-use snippets for all platforms. Copy, paste, deploy.
          </p>
        </div>

        <AdSlot slot="scripts-top" format="horizontal" className="mb-8" />

        <ScriptsClient scripts={scripts} />
      </div>
    </div>
  );
}
