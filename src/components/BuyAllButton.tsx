'use client';

interface BuyAllButtonProps {
  products: Array<{
    name: string;
    asin: string;
    priceHint?: string;
  }>;
  affiliateTag?: string;
}

export default function BuyAllButton({ products, affiliateTag = 'automforge20-20' }: BuyAllButtonProps) {
  const productsWithAsin = products.filter((p) => p.asin);

  if (productsWithAsin.length === 0) return null;

  // Build Amazon search URL with key product terms + affiliate tag
  // This always works — no ASIN validation issues, no empty carts
  const searchTerms = productsWithAsin
    .map((p) => p.name.split(/\s+/).slice(0, 3).join(' ')) // first 3 words of each name
    .slice(0, 5) // top 5 products to keep query reasonable
    .join(' ');
  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerms)}&tag=${affiliateTag}`;

  // Also build individual product links for the dropdown
  const productLinks = productsWithAsin.map((p) => ({
    name: p.name,
    url: `https://www.amazon.com/dp/${p.asin}?tag=${affiliateTag}`,
    searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(p.name)}&tag=${affiliateTag}`,
  }));

  // Estimate total from price hints
  const totalEstimate = productsWithAsin.reduce((sum, p) => {
    const match = p.priceHint?.match(/\$(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
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
        },
      }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-2">
      {/* Main Buy All button — opens Amazon search */}
      <a
        href={searchUrl}
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
          <p className="text-zinc-600 text-xs">
            Find every component for this build
            {totalEstimate > 0 && <span className="text-zinc-500"> · ~${totalEstimate} est.</span>}
          </p>
        </div>
        {/* Arrow */}
        <svg className="w-4 h-4 text-zinc-600 group-hover:text-teal-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Individual product quick-links */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {productLinks.map((p) => (
          <a
            key={p.name}
            href={p.searchUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-[11px] text-zinc-600 hover:text-teal-400 transition-colors px-2 py-0.5 rounded border border-zinc-800/50 hover:border-teal-500/30"
            title={`Find ${p.name} on Amazon`}
          >
            {p.name.split(/\s+/).slice(0, 3).join(' ')}
          </a>
        ))}
      </div>
    </div>
  );
}
