import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AutomationForge privacy policy — how we handle your data, cookies, analytics, and third-party services.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto prose-legal">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>Last updated: April 27, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            AutomationForge (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Information You Provide</h3>
          <ul className="space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
            <li>• <strong>Email address</strong> — if you subscribe to our newsletter. We use this solely to send you updates about home automation content.</li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Information Collected Automatically</h3>
          <ul className="space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
            <li>• <strong>Page views</strong> — which pages you visit, to help us improve our content.</li>
            <li>• <strong>Events</strong> — actions like copying code or clicking affiliate links (anonymized, no personal data).</li>
            <li>• <strong>Basic device info</strong> — browser type and referrer URL, collected via standard web server logs.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
          <ul className="space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
            <li>• To deliver and improve our home automation tools, build sheets, and content.</li>
            <li>• To send newsletter updates if you&apos;ve opted in (you can unsubscribe at any time).</li>
            <li>• To understand which content is most useful so we can create better resources.</li>
          </ul>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
            We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Cookies &amp; Third-Party Services</h2>
          <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Google AdSense</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            We use Google AdSense to display advertisements. Google may use cookies and web beacons to serve ads based on
            your prior visits to this and other websites. You can opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" className="text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
            For more information, see{' '}
            <a href="https://policies.google.com/technologies/ads" className="text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">how Google uses data when you visit partner sites</a>.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Amazon Associates</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            AutomationForge is a participant in the Amazon Services LLC Associates Program. When you click an affiliate link
            and make a purchase, Amazon may set cookies on your device. Amazon&apos;s use of cookies is governed by their own{' '}
            <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" className="text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Vercel Analytics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Our site is hosted on Vercel, which may collect anonymous performance and usage data. See{' '}
            <a href="https://vercel.com/legal/privacy-policy" className="text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a> for details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Newsletter subscriber emails are retained until you unsubscribe. Anonymous analytics data (page views, events)
            is retained for up to 12 months. We do not store any payment information — all purchases happen directly on
            Amazon.com or other third-party retailers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            You have the right to:
          </p>
          <ul className="space-y-2 ml-4 mt-2" style={{ color: 'var(--text-secondary)' }}>
            <li>• <strong>Access</strong> — request a copy of any personal data we hold about you.</li>
            <li>• <strong>Deletion</strong> — request that we delete your personal data (e.g., newsletter subscription).</li>
            <li>• <strong>Opt-out</strong> — unsubscribe from the newsletter at any time.</li>
            <li>• <strong>Cookies</strong> — manage or disable cookies through your browser settings.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Children&apos;s Privacy</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            AutomationForge is not directed at children under the age of 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data, please contact us
            so we can remove it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We may update this privacy policy from time to time. Any changes will be posted on this page with an
            updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            For privacy-related questions or data requests, contact us via our{' '}
            <Link href="https://github.com/AJR1073/AutomationForge/issues" className="text-teal-400 hover:underline">GitHub repository</Link>.
          </p>
        </section>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
          <Link href="/" className="text-sm text-teal-400 hover:underline">← Back to AutomationForge</Link>
        </div>
      </div>
    </div>
  );
}
