import Link from 'next/link';
import NewsletterCapture from '@/components/NewsletterCapture';

const footerLinks = {
  Tools: [
    { href: '/build', label: 'Build Automation' },
    { href: '/fix', label: 'Fix My Code' },
    { href: '/scripts', label: 'Script Library' },
  ],
  Content: [
    { href: '/build-sheets', label: 'All Build Sheets' },
    { href: '/blog', label: 'Blog' },
    { href: '/starter-kit', label: 'Starter Kit' },
    { href: '/build-sheets/motion-activated-lights', label: 'Motion Lights' },
  ],
  Products: [
    { href: '/products/relay', label: 'Relays' },
    { href: '/products/motion_sensor', label: 'Motion Sensors' },
    { href: '/products/smart_plug', label: 'Smart Plugs' },
    { href: '/products/temperature_sensor', label: 'Temp Sensors' },
  ],
};

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-default)' }} className="mt-20 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand + Newsletter */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                style={{
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                AF
              </div>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AutomationForge</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Generate and fix home automation code for Shelly, Home Assistant, Node-RED, and ESPHome. Free forever.
            </p>
            <NewsletterCapture source="footer" compact />
            <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
              * Affiliate links help keep this site free. Prices and availability may vary.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--divider)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} AutomationForge. Open to use, never requires an account.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-xs hover:underline" style={{ color: 'var(--text-faint)' }}>About</Link>
            <Link href="/disclaimer" className="text-xs hover:underline" style={{ color: 'var(--text-faint)' }}>Disclaimer</Link>
            <Link href="/privacy" className="text-xs hover:underline" style={{ color: 'var(--text-faint)' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
