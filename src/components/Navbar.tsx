'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/build', label: 'Build' },
  { href: '/fix', label: 'Fix' },
  { href: '/scripts', label: 'Scripts' },
  { href: '/build-sheets', label: 'Build Sheets' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--bg-base) 90%, transparent)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="container mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center font-bold text-[0.6rem] tracking-tight"
            style={{
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
          >
            AF
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AutomationForge
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
                style={{
                  background: isActive ? 'var(--active-bg)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--hover-bg)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: toggle + CTA */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/build" className="btn-primary text-xs px-3 py-1.5">
            Generate
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
