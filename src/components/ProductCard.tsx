'use client';

import Image from 'next/image';

interface ProductCardProps {
  name: string;
  brand: string;
  capabilityTags: string[];
  priceHint?: string;
  imageUrl?: string;
  affiliateUrl?: string;
  network?: string;
  compact?: boolean;
}

export default function ProductCard({
  name,
  brand,
  capabilityTags,
  priceHint,
  imageUrl,
  affiliateUrl,
  network = 'amazon',
  compact = false,
}: ProductCardProps) {
  const handleClick = () => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'outbound_click',
        metadata: { name, network, url: affiliateUrl },
      }),
    }).catch(() => {});
  };

  if (compact) {
    return (
      <a
        href={affiliateUrl || '#'}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={affiliateUrl ? handleClick : undefined}
        className="glass-card p-3 flex items-center gap-3 group"
        id={`product-inline-${name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} width={48} height={48} className="object-contain p-0.5" />
          ) : (
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>—</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-teal-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{brand}</p>
        </div>
        {priceHint && (
          <span className="font-semibold text-sm flex-shrink-0" style={{ color: 'var(--accent)' }}>{priceHint}</span>
        )}
        {affiliateUrl && (
          <svg className="w-3.5 h-3.5 group-hover:text-teal-400 flex-shrink-0 transition-colors" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    );
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden group">
      {/* Product image */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden p-4" style={{ background: 'var(--bg-surface)' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={200}
            height={200}
            className="object-contain w-full h-full group-hover:scale-[1.03] transition-transform duration-200"
          />
        ) : (
          <div className="text-3xl font-light" style={{ color: 'var(--text-faint)' }}>—</div>
        )}
        {priceHint && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            {priceHint}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{brand}</p>
        <h3 className="font-medium text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{name}</h3>

        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {capabilityTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[0.6rem] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {affiliateUrl && (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={handleClick}
            className="mt-2.5 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
            id={`product-link-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            View on {network === 'amazon' ? 'Amazon' : network}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
