'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface StatItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: number;
}

function AnimatedNumber({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return <span ref={ref}>{current.toLocaleString()}</span>;
}

export default function StatsCounter() {
  const [stats, setStats] = useState<{ buildsGenerated: number; codesCopied: number; fixesApplied: number } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // fallback handled by API
      setStats({ buildsGenerated: 150, codesCopied: 420, fixesApplied: 85 });
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!stats) return null;

  const items: StatItem[] = [
    {
      key: 'builds',
      label: 'Automations Generated',
      value: stats.buildsGenerated,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.71-3.29A2 2 0 014 10.1V6.82a2 2 0 011.05-1.76l5.71-3.29a2.996 2.996 0 012.96 0l5.71 3.29A2 2 0 0120.48 6.82v3.28a2 2 0 01-1.05 1.78l-5.71 3.29a2.996 2.996 0 01-2.96 0z" />
        </svg>
      ),
    },
    {
      key: 'copies',
      label: 'Code Snippets Copied',
      value: stats.codesCopied,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      ),
    },
    {
      key: 'fixes',
      label: 'Scripts Fixed',
      value: stats.fixesApplied,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.71-3.29A2 2 0 014 10.1V6.82M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
          {items.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-3 p-8" style={{ background: 'var(--bg-surface)' }}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                {item.icon}
              </div>
              <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                <AnimatedNumber target={item.value} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
