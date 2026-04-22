'use client';

import { useState } from 'react';
import CodeBlock from '@/components/CodeBlock';

interface Script {
  id: number;
  platform: string;
  title: string;
  description: string;
  codeText: string;
  tags: string;
}

const PLATFORM_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shelly', label: 'Shelly' },
  { id: 'ha', label: 'Home Assistant' },
  { id: 'nodered', label: 'Node-RED' },
  { id: 'esphome', label: 'ESPHome' },
];

export default function ScriptsClient({ scripts }: { scripts: Script[] }) {
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = scripts.filter((s) => {
    const matchPlatform = platform === 'all' || s.platform === platform;
    const q = search.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.toLowerCase().includes(q);
    return matchPlatform && matchSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="tab-bar flex-shrink-0">
          {PLATFORM_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setPlatform(f.id)} className={`tab-item ${platform === f.id ? 'active' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="forge-input max-w-xs"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">No scripts found for your filter.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((script) => {
            const tags: string[] = JSON.parse(script.tags || '[]');
            const isOpen = expanded === script.id;
            return (
              <div key={script.id} className="rounded-xl border  overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full p-5 flex items-start gap-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : script.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge-${script.platform}`}>{script.platform.toUpperCase()}</span>
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-base">{script.title}</h3>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{script.description}</p>
                  </div>
                  <svg className={`w-5 h-5 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Expanded code */}
                {isOpen && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <CodeBlock code={script.codeText} platform={script.platform as 'shelly' | 'ha' | 'nodered' | 'esphome'} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
