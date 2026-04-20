import Link from 'next/link';

const footerLinks = {
  Tools: [
    { href: '/build', label: 'Build Automation' },
    { href: '/fix', label: 'Fix My Code' },
    { href: '/scripts', label: 'Script Library' },
  ],
  'Build Sheets': [
    { href: '/build-sheets', label: 'All Build Sheets' },
    { href: '/build-sheets/motion-activated-lights', label: 'Motion Lights' },
    { href: '/build-sheets/door-open-alert', label: 'Door Alert' },
    { href: '/build-sheets/water-leak-shutoff', label: 'Leak Shutoff' },
  ],
  Platforms: [
    { href: '/products/relay', label: 'Relays' },
    { href: '/products/motion_sensor', label: 'Motion Sensors' },
    { href: '/products/smart_plug', label: 'Smart Plugs' },
    { href: '/products/temperature_sensor', label: 'Temp Sensors' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(139,92,246,0.1)] mt-20 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                AF
              </div>
              <span className="font-bold text-white">AutomationForge</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Generate and fix home automation code for Shelly, Home Assistant, Node-RED, and ESPHome. Free forever.
            </p>
            <p className="text-slate-600 text-xs mt-4">
              * Affiliate links help keep this site free. Prices and availability may vary.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-slate-300 font-semibold text-sm mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.05)] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} AutomationForge. Open to use, never requires an account.
          </p>
          <p className="text-slate-700 text-xs">
            Safety disclaimers apply for mains wiring. We do not store your pasted code unless you save it.
          </p>
        </div>
      </div>
    </footer>
  );
}
