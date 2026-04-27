'use client';

import { useEffect, useRef } from 'react';

interface AdSlotProps {
  slot?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  horizontal: 'h-24 w-full',
  rectangle: 'h-64 w-full',
  vertical: 'h-80 w-48',
};

const AD_FORMAT_MAP: Record<string, string> = {
  horizontal: 'auto',
  rectangle: 'auto',
  vertical: 'auto',
};

export default function AdSlot({ slot = 'default', format = 'horizontal', className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  useEffect(() => {
    if (!pubId || pushed.current) return;

    try {
      // Push the ad unit once the component mounts
      const adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded yet or ad blocked
    }
  }, [pubId]);

  if (pubId) {
    return (
      <div className={`ad-slot ${SIZE_CLASSES[format]} ${className}`} data-slot={slot}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={pubId}
          data-ad-slot={slot}
          data-ad-format={AD_FORMAT_MAP[format]}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Placeholder shown during development / before AdSense approval
  return (
    <div
      className={`ad-slot ${SIZE_CLASSES[format]} ${className}`}
      title="Advertisement placeholder"
    >
      <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Advertisement
      </span>
    </div>
  );
}
