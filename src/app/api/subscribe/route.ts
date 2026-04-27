import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, trackEvent } from '@/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const { email, source } = (await req.json()) as { email?: string; source?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const cleanSource = ['homepage', 'footer', 'blog'].includes(source || '')
      ? source!
      : 'homepage';

    const subscriber = await addSubscriber(email.toLowerCase().trim(), cleanSource);

    // Track the signup event
    await trackEvent('newsletter_signup', '', { source: cleanSource }).catch(() => {});

    if (!subscriber) {
      return NextResponse.json({ ok: true, message: "You're already subscribed!" });
    }

    return NextResponse.json({ ok: true, message: 'Welcome aboard! 🎉' });
  } catch (err: unknown) {
    console.error('[/api/subscribe]', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
