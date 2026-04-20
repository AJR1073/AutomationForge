import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { eventType: string; slug?: string; metadata?: Record<string, unknown> };

    const allowed = ['copy_code', 'outbound_click', 'generate_success', 'fix_success'];
    if (!allowed.includes(body.eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    await trackEvent(body.eventType, body.slug || '', body.metadata || {});
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[/api/events]', err);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
