'use client';

import { useState } from 'react';

interface NewsletterCaptureProps {
  source?: string;
  compact?: boolean;
}

export default function NewsletterCapture({ source = 'homepage', compact = false }: NewsletterCaptureProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === 'loading') return;

    setState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error || 'Something went wrong');
        return;
      }
      setState('success');
      setMessage(data.message || 'Subscribed!');
      setEmail('');
    } catch {
      setState('error');
      setMessage('Network error — try again');
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="mt-4">
        {state === 'success' ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{message}</span>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setState('idle'); }}
                placeholder="your@email.com"
                required
                className="forge-input text-xs py-2 px-3"
                style={{ flex: 1, minWidth: 0 }}
                id="newsletter-footer-email"
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  opacity: state === 'loading' ? 0.6 : 1,
                }}
                id="newsletter-footer-submit"
              >
                {state === 'loading' ? '...' : 'Subscribe'}
              </button>
            </div>
            {state === 'error' && (
              <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>{message}</p>
            )}
          </>
        )}
      </form>
    );
  }

  return (
    <div className="glass-card p-8 md:p-10" id="newsletter-section">
      <div className="max-w-lg mx-auto text-center">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
        >
          <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Get a new automation build every week
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Code included. No spam. Unsubscribe anytime.
        </p>

        {state === 'success' ? (
          <div
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl animate-fade-in"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-sm" style={{ color: 'var(--accent)' }}>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setState('idle'); }}
              placeholder="you@example.com"
              required
              className="forge-input text-sm"
              style={{ flex: 1 }}
              id="newsletter-email"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="btn-primary justify-center whitespace-nowrap"
              style={{ opacity: state === 'loading' ? 0.6 : 1 }}
              id="newsletter-submit"
            >
              {state === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subscribing…
                </span>
              ) : (
                <>
                  Subscribe
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {state === 'error' && (
          <p className="text-xs mt-3 animate-fade-in" style={{ color: '#ef4444' }}>{message}</p>
        )}

        <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
          Join 500+ smart home builders. We never share your email.
        </p>
      </div>
    </div>
  );
}
