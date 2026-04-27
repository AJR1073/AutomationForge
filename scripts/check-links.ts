import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const products = await db.product.findMany({
    where: { active: true },
    include: { affiliateLinks: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Checking ${products.length} active products...\n`);

  const broken: string[] = [];

  for (const p of products) {
    const link = p.affiliateLinks[0];
    if (!link) {
      console.log(`  ⚠ ID ${p.id} ${p.name} — NO AFFILIATE LINK`);
      broken.push(`${p.id}: ${p.name} (no link)`);
      continue;
    }

    try {
      const res = await fetch(link.url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });

      // Amazon returns 200 for valid, 404 for dead, 503 for bot detection
      if (res.status === 404) {
        console.log(`  ✗ ID ${p.id} ${p.name} — 404 (ASIN: ${p.asin})`);
        broken.push(`${p.id}: ${p.name} (ASIN: ${p.asin})`);
      } else if (res.status === 503) {
        console.log(`  ? ID ${p.id} ${p.name} — 503 bot-blocked (ASIN: ${p.asin})`);
      } else {
        console.log(`  ✓ ID ${p.id} ${p.name} — ${res.status}`);
      }
    } catch (err: any) {
      console.log(`  ? ID ${p.id} ${p.name} — ${err.message}`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  if (broken.length === 0) {
    console.log('✅ All product links appear valid (no 404s)');
  } else {
    console.log(`❌ ${broken.length} broken links found:`);
    broken.forEach((b) => console.log(`   - ${b}`));
  }

  await db.$disconnect();
  await pool.end();
}

main();
