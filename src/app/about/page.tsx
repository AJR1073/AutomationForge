import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'AutomationForge simplifies home automation — free code generators, build sheets, and guides for Shelly, Home Assistant, Node-RED, and ESPHome.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">About AutomationForge</h1>
        <p className="text-lg mb-10" style={{ color: 'var(--text-muted)' }}>
          Making home automation accessible to everyone.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Home automation shouldn&apos;t require a computer science degree. Between Shelly scripts, Home Assistant YAML,
            Node-RED flows, and ESPHome configs — the learning curve is steep and the documentation is scattered.
          </p>
          <p className="leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>AutomationForge</strong> was built to solve this. We provide free,
            copy-paste-ready automation code with complete build sheets, parts lists, and step-by-step deployment guides.
            Whether you want motion-activated lights, a temperature-controlled fan, or a vampire power shutoff —
            we give you working code for all four major platforms in seconds.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Build Sheets', desc: '30+ tested automation blueprints with code for Shelly, HA, Node-RED, and ESPHome.', href: '/build-sheets' },
              { icon: '🛠️', title: 'Code Generator', desc: 'Describe what you want to automate and get working code instantly.', href: '/build' },
              { icon: '🔧', title: 'Fix My Code', desc: 'Paste broken automation code and get a fixed, working version back.', href: '/fix' },
              { icon: '📦', title: 'Parts Lists', desc: 'Every build sheet includes recommended hardware with direct Amazon links.', href: '/starter-kit' },
              { icon: '📝', title: 'Blog & Guides', desc: 'Tutorials, comparisons, and best practices for smart home setups.', href: '/blog' },
              { icon: '🎓', title: 'Starter Kits', desc: 'Curated hardware bundles for beginners, intermediate, and advanced users.', href: '/starter-kit' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="glass-card p-4 block transition-transform hover:scale-[1.02] hover:shadow-lg">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-semibold mt-2 mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Supported Platforms</h2>
          <div className="flex flex-wrap gap-3">
            {['Shelly Gen2+', 'Home Assistant', 'Node-RED', 'ESPHome'].map((platform) => (
              <span
                key={platform}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--active-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              >
                {platform}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">How We&apos;re Funded</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            AutomationForge is <strong>free to use</strong> and always will be. We keep the lights on through:
          </p>
          <ul className="mt-3 space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
            <li>• <strong>Affiliate links</strong> — when you buy recommended hardware through our Amazon links, we earn a small commission at no extra cost to you.</li>
            <li>• <strong>Display ads</strong> — non-intrusive ads served through Google AdSense.</li>
          </ul>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            We never paywall content, require accounts, or sell your data.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Found a bug? Have a feature request? Want to suggest a new build sheet?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://github.com/AJR1073/AutomationForge/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Open a GitHub Issue
            </a>
            <a
              href="https://github.com/AJR1073/AutomationForge"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm"
            >
              View Source on GitHub
            </a>
          </div>
        </section>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="text-sm text-teal-400 hover:underline">← Home</Link>
            <Link href="/disclaimer" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>Disclaimer</Link>
            <Link href="/privacy" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
