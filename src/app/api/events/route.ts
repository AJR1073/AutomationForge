import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { eventType: string; slug?: string; metadata?: Record<string, unknown> };

    const allowed = ['copy_code', 'outbound_click', 'affiliate_click', 'buy_all_click', 'generate_success', 'fix_success'];
    if (!allowed.includes(body.eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const slug = typeof body.slug === 'string' ? body.slug.slice(0, 120) : '';
    const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

    await trackEvent(body.eventType, slug, metadata);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[/api/events]', err);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
