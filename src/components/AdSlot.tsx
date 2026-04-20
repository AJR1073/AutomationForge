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

export default function AdSlot({ slot = 'default', format = 'horizontal', className = '' }: AdSlotProps) {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  if (pubId) {
    // TODO: replace with real AdSense ins tag when pub ID is set
    return (
      <div className={`ad-slot ${SIZE_CLASSES[format]} ${className}`} data-slot={slot}>
        <ins
          className="adsbygoogle"
          data-ad-client={pubId}
          data-ad-slot={slot}
          data-ad-format={format === 'horizontal' ? 'leaderboard' : 'rectangle'}
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
      Advertisement
    </div>
  );
}
