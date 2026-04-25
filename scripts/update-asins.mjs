#!/usr/bin/env node
// Update product ASINs and affiliate URLs to verified current Amazon listings
// Run: node scripts/update-asins.mjs

import pg from 'pg';

const AFFILIATE_TAG = 'automforge20-20';

// Verified ASINs for each product (cross-checked against Amazon US listings)
const PRODUCT_UPDATES = [
  { name: 'Shelly 1 Gen3',                         asin: 'B0CY7SWKC2', price: '$14' },
  { name: 'Shelly Plug S Gen3',                     asin: 'B0DK3GK96Y', price: '$20' },
  { name: 'Shelly 1PM Plus',                        asin: 'B0BKR3M5MB', price: '$18' },
  { name: 'Shelly Dimmer 2',                        asin: 'B09QKCRV13', price: '$25' },
  { name: 'Aqara Motion Sensor P1',                 asin: 'B09QKVMMTB', price: '$20' },
  { name: 'Sonoff ZBDONGLE-P Zigbee Coordinator',   asin: 'B09KXTCMSC', price: '$22' },
  { name: 'ESP32 Development Board',                asin: 'B0B19KRJN6', price: '$10' },
  { name: 'DHT22 Temperature Sensor',               asin: 'B0795F19W6', price: '$7'  },
  { name: 'DS18B20 Waterproof Temp Sensor',          asin: 'B012C597T0', price: '$8'  },
  { name: 'Magnetic Door Window Sensor',             asin: 'B07D37VDM3', price: '$17' },
  { name: 'GOVEE Water Leak Sensor',                 asin: 'B07PLLSJPG', price: '$22' },
  { name: 'Raspberry Pi 4 Kit',                     asin: 'B07TD42S27', price: '$55' },
  { name: 'WLED LED Strip Controller',               asin: 'B0B6GP2G8C', price: '$16' },
  { name: 'PIR Motion Sensor HC-SR501',              asin: 'B07KBWVJMP', price: '$5'  },
  { name: 'Zigbee Smart Plug Ikea Tradfri',          asin: 'B09FX3876P', price: '$14' },
];

const connStr = process.argv[2] || process.env.DATABASE_URL;
if (!connStr) {
  console.error('Usage: node scripts/update-asins.mjs <DATABASE_URL>');
  process.exit(1);
}

const client = new pg.Client(connStr);
await client.connect();

console.log('Updating product ASINs and affiliate URLs...\n');

for (const p of PRODUCT_UPDATES) {
  const affiliateUrl = `https://www.amazon.com/dp/${p.asin}?tag=${AFFILIATE_TAG}`;

  // Update the product's ASIN and price hint
  const updateProduct = await client.query(
    `UPDATE "Product" SET asin = $1, "priceHint" = $2 WHERE name = $3 RETURNING id, name`,
    [p.asin, p.price, p.name]
  );

  if (updateProduct.rowCount > 0) {
    const productId = updateProduct.rows[0].id;

    // Update the affiliate link URL
    await client.query(
      `UPDATE "AffiliateLink" SET url = $1, "updatedAt" = NOW() WHERE "productId" = $2 AND network = 'amazon'`,
      [affiliateUrl, productId]
    );

    console.log(`  ✅ ${p.name} → ${p.asin} (${p.price})`);
  } else {
    console.log(`  ⚠️  ${p.name} — not found in DB, skipping`);
  }
}

// Also check for products missing affiliate links and fix them
const orphans = await client.query(`
  SELECT p.id, p.name, p.asin 
  FROM "Product" p 
  LEFT JOIN "AffiliateLink" a ON a."productId" = p.id 
  WHERE a.id IS NULL AND p.asin != ''
`);

if (orphans.rows.length > 0) {
  console.log('\nFixing orphaned products (missing affiliate links):');
  for (const row of orphans.rows) {
    const url = `https://www.amazon.com/dp/${row.asin}?tag=${AFFILIATE_TAG}`;
    await client.query(
      `INSERT INTO "AffiliateLink" ("productId", network, url, country, "updatedAt") VALUES ($1, 'amazon', $2, 'US', NOW())`,
      [row.id, url]
    );
    console.log(`  🔗 Created link for ${row.name}`);
  }
}

// Verify final state
const final = await client.query(`
  SELECT p.name, p.asin, p."priceHint", a.url 
  FROM "Product" p 
  LEFT JOIN "AffiliateLink" a ON a."productId" = p.id 
  ORDER BY p.id
`);
console.log('\nFinal state:');
for (const r of final.rows) {
  console.log(`  ${r.name} | ${r.asin} | ${r.priceHint} | ${r.url ? '✅ link' : '❌ no link'}`);
}

await client.end();
console.log('\nDone!');
