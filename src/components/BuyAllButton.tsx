'use client';

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

  // Build a prefilled Amazon cart URL so users land on the exact selected parts.
  const cartParams = new URLSearchParams();
  productsWithAsin.forEach((product, index) => {
    const slot = index + 1;
    cartParams.set(`ASIN.${slot}`, product.asin);
    cartParams.set(`Quantity.${slot}`, String(product.quantity));
  });
  cartParams.set('tag', affiliateTag);
  const cartUrl = `https://www.amazon.com/gp/aws/cart/add.html?${cartParams.toString()}`;

  // Also build individual product links for the dropdown
  const productLinks = productsWithAsin.map((p) => ({
    name: p.name,
    asin: p.asin,
    url: `https://www.amazon.com/dp/${p.asin}?tag=${affiliateTag}`,
    quantity: p.quantity,
  }));

  // Estimate total from price hints
  const totalEstimate = productsWithAsin.reduce((sum, p) => {
    const match = p.priceHint?.match(/(\d+(?:\.\d+)?)/);
    const unitPrice = match ? Number(match[1]) : 0;
    return sum + (unitPrice * p.quantity);
  }, 0);

  const handleClick = () => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'buy_all_click',
        metadata: {
          count: productsWithAsin.length,
          asins: productsWithAsin.map((p) => p.asin),
          quantities: productsWithAsin.map((p) => p.quantity),
        },
      }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-2">
      {/* Main Buy All button — opens prefilled Amazon cart */}
      <a
        href={cartUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className="flex items-center gap-3 px-5 py-3 rounded-lg bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/15 hover:border-teal-500/40 transition-colors group"
        id="buy-all-amazon"
      >
        {/* Cart icon */}
        <svg className="w-5 h-5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-teal-400 font-semibold text-sm group-hover:text-teal-300 transition-colors">
            Shop all {productsWithAsin.length} parts on Amazon
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Open a prefilled cart with these exact components
            {totalEstimate > 0 && <span className="" style={{ color: "var(--text-muted)" }}> · ~${Math.round(totalEstimate)} est.</span>}
          </p>
        </div>
        {/* Arrow */}
        <svg className="w-4 h-4 group-hover:text-teal-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Individual product quick-links */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {productLinks.map((p) => (
          <a
            key={`${p.asin}-${p.name}`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-[11px] hover:text-teal-400 transition-colors px-2 py-0.5 rounded border/50 hover:border-teal-500/30"
            title={`Open ${p.name} on Amazon`}
          >
            {p.name.split(/\s+/).slice(0, 3).join(' ')}{p.quantity > 1 ? ` x${p.quantity}` : ''}
          </a>
        ))}
      </div>
    </div>
  );
}
