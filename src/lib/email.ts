import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_TOKEN);

// Resend free tier uses onboarding@resend.dev as sender until you verify a domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AutomationForge <onboarding@resend.dev>';

interface SendNewsletterOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendNewsletterOptions) {
  const recipients = Array.isArray(to) ? to : [to];

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  return data;
}

// ── Newsletter HTML Template ──────────────────────────────────────────────────

export function buildNewsletterHtml({
  title,
  preheader,
  bodyHtml,
  ctaUrl,
  ctaLabel,
}: {
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { display: inline-block; background: rgba(45,212,191,0.15); border: 1px solid rgba(45,212,191,0.3); border-radius: 8px; padding: 8px 14px; font-weight: 700; font-size: 14px; color: #2dd4bf; text-decoration: none; }
    h1 { color: #f1f5f9; font-size: 24px; margin: 0 0 16px; }
    .preheader { display: none !important; max-height: 0; overflow: hidden; }
    .body-content { color: #94a3b8; font-size: 16px; line-height: 1.7; }
    .body-content a { color: #2dd4bf; }
    .body-content h2 { color: #f1f5f9; font-size: 20px; margin: 24px 0 12px; }
    .body-content ul { padding-left: 20px; }
    .body-content li { margin-bottom: 8px; }
    .cta-btn { display: inline-block; background: #2dd4bf; color: #0f1117 !important; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 24px 0; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 32px 0; }
    .footer { text-align: center; color: #475569; font-size: 12px; line-height: 1.6; }
    .footer a { color: #64748b; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="header">
      <a href="${siteUrl}" class="logo">AF</a>
    </div>
    <h1>${title}</h1>
    <div class="body-content">
      ${bodyHtml}
      ${ctaUrl ? `<p style="text-align:center"><a href="${ctaUrl}" class="cta-btn">${ctaLabel || 'Read More'}</a></p>` : ''}
    </div>
    <hr class="divider" />
    <div class="footer">
      <p>You're receiving this because you subscribed at <a href="${siteUrl}">AutomationForge</a>.</p>
      <p><a href="${siteUrl}/privacy">Privacy Policy</a> · <a href="${siteUrl}/disclaimer">Disclaimer</a></p>
      <p style="margin-top:12px">© ${new Date().getFullYear()} AutomationForge</p>
    </div>
  </div>
</body>
</html>`;
}
