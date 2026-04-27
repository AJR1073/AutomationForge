import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, buildNewsletterHtml } from '@/lib/email';

// POST /api/newsletter/send — send a newsletter to all subscribers
// Body: { subject, title, bodyHtml, ctaUrl?, ctaLabel?, secret }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, title, bodyHtml, ctaUrl, ctaLabel, secret } = body;

    // Simple secret key auth — prevents anyone from triggering a send
    const expectedSecret = process.env.NEWSLETTER_SECRET || 'af-newsletter-2026';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!subject || !title || !bodyHtml) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, title, bodyHtml' },
        { status: 400 }
      );
    }

    // Get all subscribers
    const subscribers = await db.subscriber.findMany({
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers found', sent: 0 });
    }

    const html = buildNewsletterHtml({
      title,
      preheader: subject,
      bodyHtml,
      ctaUrl,
      ctaLabel,
    });

    // Resend supports batch sending up to 100 per call
    // For larger lists, chunk them
    const emails = subscribers.map((s) => s.email);
    const BATCH_SIZE = 50;
    let totalSent = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);

      // Send individually to each subscriber (Resend free tier)
      for (const email of batch) {
        try {
          await sendEmail({ to: email, subject, html });
          totalSent++;
        } catch (err) {
          console.error(`Failed to send to ${email}:`, err);
        }
      }
    }

    return NextResponse.json({
      message: `Newsletter sent successfully`,
      sent: totalSent,
      total: emails.length,
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
