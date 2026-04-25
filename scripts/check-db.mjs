import pg from 'pg';
const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();
const products = await client.query('SELECT COUNT(*) FROM "Product"');
const links = await client.query('SELECT COUNT(*) FROM "AffiliateLink"');
const pages = await client.query('SELECT COUNT(*) FROM "AutomationPage"');
const specs = await client.query('SELECT COUNT(*) FROM "AutomationSpec"');
console.log('Products:', products.rows[0].count);
console.log('AffiliateLinks:', links.rows[0].count);
console.log('Pages:', pages.rows[0].count);
console.log('Specs:', specs.rows[0].count);
// Sample product
const sample = await client.query('SELECT p.name, p.asin, p."imageUrl", a.url FROM "Product" p LEFT JOIN "AffiliateLink" a ON a."productId" = p.id LIMIT 3');
console.log('Sample products:', JSON.stringify(sample.rows, null, 2));
// Check partsList in specs
const specSample = await client.query('SELECT "specJson" FROM "AutomationSpec" LIMIT 1');
if (specSample.rows[0]) {
  const d = JSON.parse(specSample.rows[0].specJson);
  console.log('First spec partsList length:', d.partsList?.length || 0);
  console.log('partsList sample:', JSON.stringify(d.partsList?.slice(0,2)));
}
await client.end();
