import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'AutomationForge disclaimer — no warranties, use at your own risk. We provide home automation code and guides as-is.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto prose-legal">
        <h1 className="text-3xl font-bold mb-2">Disclaimer</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>Last updated: April 27, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">No Warranties</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            AutomationForge provides home automation code, build sheets, guides, and tools <strong>&quot;as-is&quot;</strong> and
            <strong> &quot;as available&quot;</strong> without any warranties of any kind, either express or implied. We make no
            guarantees that the code, configurations, or instructions provided will work correctly with your specific
            hardware, software, or network setup.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Use at Your Own Risk</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Home automation involves working with electrical devices, relays, sensors, and in some cases mains voltage wiring.
            <strong> You are solely responsible for the safe installation, configuration, and use of any hardware or software
            referenced on this site.</strong> If you are not comfortable working with electrical systems, please consult a
            licensed electrician.
          </p>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
            AutomationForge, its authors, and contributors are not liable for any damage, injury, data loss, or other harm
            resulting from the use of code, instructions, or product recommendations found on this site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We built AutomationForge to help simplify the complexity of home automation. Setting up smart home devices across
            platforms like Shelly, Home Assistant, Node-RED, and ESPHome can be overwhelming — our goal is to provide
            working starting points and clear guides so you can spend less time debugging and more time automating.
          </p>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
            That said, every home setup is different. The code we generate is meant as a <strong>starting point</strong> that
            you should review, test, and adapt to your specific environment before relying on it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Electrical Safety</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Some automations on this site involve mains voltage (110V/220V) wiring. <strong>Always switch off the breaker
            before working with mains voltage.</strong> If you are unsure about any wiring, hire a licensed electrician.
            AutomationForge is not responsible for any electrical damage or personal injury.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Affiliate Links</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            AutomationForge participates in the Amazon Services LLC Associates Program, an affiliate advertising program.
            Product links on this site are affiliate links — when you purchase through them, we may earn a small commission
            at no additional cost to you. This helps support the site and keep it free.
          </p>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
            We only recommend products we believe are useful for home automation projects. Product prices and availability
            are subject to change and are determined by the retailer, not by AutomationForge.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Third-Party Content</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            This site may link to third-party websites, products, or services. We do not control and are not responsible for
            the content, accuracy, or practices of any third-party sites. Links do not imply endorsement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Code Accuracy</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            While we strive to provide accurate, tested code for all supported platforms, firmware updates, API changes, and
            hardware revisions may cause code to stop working. We recommend always testing automations in a safe environment
            before deploying them to production.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            If you have questions about this disclaimer or find an issue with any code on the site, please reach out
            via our <Link href="https://github.com/AJR1073/AutomationForge/issues" className="text-teal-400 hover:underline">GitHub repository</Link>.
          </p>
        </section>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
          <Link href="/" className="text-sm text-teal-400 hover:underline">← Back to AutomationForge</Link>
        </div>
      </div>
    </div>
  );
}
