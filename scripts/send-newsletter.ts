#!/usr/bin/env npx tsx
/**
 * Send a newsletter to all AutomationForge subscribers
 * 
 * Usage:
 *   npx tsx scripts/send-newsletter.ts
 * 
 * Edit the NEWSLETTER content below before running.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
const SECRET = process.env.NEWSLETTER_SECRET || 'af-newsletter-2026';

// ═══════════════════════════════════════════════════════════════════
//  EDIT YOUR NEWSLETTER CONTENT HERE
// ═══════════════════════════════════════════════════════════════════

const newsletter = {
  subject: '🏠 New Build Sheet: Vampire Power Shutoff — Save $100/year',
  title: 'Stop Wasting Money on Standby Power',
  bodyHtml: `
    <p>Hey there! 👋</p>
    <p>We just published a new build sheet that can <strong>save you $50–100/year</strong> per device.</p>
    
    <h2>🧛 Vampire Power Shutoff</h2>
    <p>Many devices draw 5–15W even when "off." Our new automation detects when your device enters standby and automatically cuts the power.</p>
    
    <ul>
      <li>✅ Works with Shelly, Home Assistant, Node-RED, and ESPHome</li>
      <li>✅ Full parts list with Amazon links</li>
      <li>✅ Copy-paste ready code</li>
      <li>✅ Safety notes included</li>
    </ul>
    
    <p>Perfect for home offices, entertainment centers, and gaming setups.</p>
  `,
  ctaUrl: `${SITE_URL}/build-sheets/vampire-power-shutoff`,
  ctaLabel: 'View the Build Sheet →',
};

// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('📧 Sending newsletter...');
  console.log(`   Subject: ${newsletter.subject}`);
  console.log(`   API: ${SITE_URL}/api/newsletter/send`);

  const res = await fetch(`${SITE_URL}/api/newsletter/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...newsletter, secret: SECRET }),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`\n✅ ${data.message}`);
    console.log(`   Sent: ${data.sent}/${data.total} subscribers`);
  } else {
    console.error(`\n❌ Failed: ${data.error}`);
  }
}

main();
