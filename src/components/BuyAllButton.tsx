'use client';

import { useState } from 'react';

interface BuyAllButtonProps {
  products: Array<{
    name: string;
    asin: string;
    priceHint?: string;
    quantity?: number;
  }>;
  affiliateTag?: string;
}

export default function BuyAllButton({ products, affiliateTag = 'automforge20-20' }: BuyAllButtonProps) {
  const [expanded, setExpanded] = useState(false);

  const dedupedByAsin = new Map<string, { name: string; asin: string; priceHint?: string; quantity: number }>();
  for (const product of products) {
    const asin = (product.asin || '').trim();
    if (!asin) continue;

    const qty = typeof product.quantity === 'number' && Number.isFinite(product.quantity)
      ? Math.max(1, Math.floor(product.quantity))
      : 1;
    const existing = dedupedByAsin.get(asin);
    if (existing) {
      existing.quantity += qty;
    } else {
      dedupedByAsin.set(asin, {
        name: product.name,
        asin,
        priceHint: product.priceHint,
        quantity: qty,
      });
    }
  }

  const productsWithAsin = [...dedupedByAsin.values()].slice(0, 20);

  if (productsWithAsin.length === 0) return null;

  // Build individual product links
  const productLinks = productsWithAsin.map((p) => ({
    name: p.name,
    asin: p.asin,
    url: `https://www.amazon.com/dp/${p.asin}?tag=${affiliateTag}`,
    priceHint: p.priceHint,
    quantity: p.quantity,
  }));

  // Estimate total from price hints
  const totalEstimate = productsWithAsin.reduce((sum, p) => {
    const match = p.priceHint?.match(/(\d+(?:\.\d+)?)/);
    const unitPrice = match ? Number(match[1]) : 0;
    return sum + (unitPrice * p.quantity);
  }, 0);

  const handleItemClick = (name: string, asin: string) => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'affiliate_click',
        metadata: { name, asin, source: 'buy_all_list' },
      }),
    }).catch(() => {});
  };

  const handleOpenAll = () => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'buy_all_click',
        metadata: {
          count: productsWithAsin.length,
          asins: productsWithAsin.map((p) => p.asin),
        },
      }),
    }).catch(() => {});

    // Open each product in a new tab (browsers may block some after the first)
    for (const p of productLinks) {
      window.open(p.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-surface)' }}>
      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left group"
        id="buy-all-amazon"
        aria-expanded={expanded}
      >
        {/* Cart icon */}
        <svg className="w-5 h-5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-teal-400 font-semibold text-sm group-hover:text-teal-300 transition-colors">
            Shop all {productsWithAsin.length} parts on Amazon
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {expanded ? 'Click each part to open on Amazon' : 'Expand to see individual part links'}
            {totalEstimate > 0 && <span> · ~${Math.round(totalEstimate)} est.</span>}
          </p>
        </div>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded parts list */}
      {expanded && (
        <div className="px-5 pb-4 space-y-1.5" style={{ borderTop: '1px solid var(--divider)' }}>
          <div className="pt-3 space-y-1">
            {productLinks.map((p) => (
              <a
                key={`${p.asin}-${p.name}`}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => handleItemClick(p.name, p.asin)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group/item"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Amazon icon */}
                <span className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--accent-border)', color: 'var(--accent)' }}>
                  A
                </span>
                <span className="flex-1 text-sm truncate group-hover/item:text-teal-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {p.name}{p.quantity > 1 ? ` ×${p.quantity}` : ''}
                </span>
                {p.priceHint && (
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--accent)' }}>{p.priceHint}</span>
                )}
                <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover/item:opacity-100 group-hover/item:text-teal-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>

          {/* Open all tabs button */}
          <button
            onClick={handleOpenAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors mt-2"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open all {productsWithAsin.length} parts in new tabs
          </button>
        </div>
      )}
    </div>
  );
}
