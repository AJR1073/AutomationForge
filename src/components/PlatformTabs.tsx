'use client';

import { useState } from 'react';
import CodeBlock from './CodeBlock';

interface Tab {
  id: string;
  label: string;
  platform?: string;
  content: string;
  isMarkdown?: boolean;
}

interface PlatformTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

const TAB_COLORS: Record<string, string> = {
  shelly: 'text-amber-400',
  ha: 'text-cyan-400',
  nodered: 'text-orange-400',
  esphome: 'text-emerald-400',
};

export default function PlatformTabs({ tabs, defaultTab }: PlatformTabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const current = tabs.find((t) => t.id === active);

  return (
    <div>
      {/* Tab Bar */}
      <div className="tab-bar mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`tab-item ${active === tab.id ? 'active' : ''} ${tab.platform ? TAB_COLORS[tab.platform] || '' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in" key={active}>
        {current?.isMarkdown ? (
          <div className="glass-card p-6 prose prose-invert prose-sm max-w-none
            prose-headings:text-violet-300 prose-strong:text-white
            prose-a:text-violet-400 prose-code:text-emerald-300
            prose-li:text-slate-100 prose-p:text-slate-100">
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(current.content) }} />
          </div>
        ) : (
          <CodeBlock
            code={current?.content || ''}
            platform={current?.platform}
          />
        )}
      </div>
    </div>
  );
}

// Minimal markdown-to-HTML for explanation tab
function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escaped
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m + '</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .trim();
}
