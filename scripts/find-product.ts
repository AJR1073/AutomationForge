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
  });

  const match = products.filter(
    (x) => x.asin === 'B09FX3876P' || x.name.toLowerCase().includes('zigbee') || x.name.toLowerCase().includes('tradfri') || x.name.toLowerCase().includes('ikea')
  );

  console.log('Found products:');
  for (const p of match) {
    console.log(`  ID: ${p.id} | Name: ${p.name} | ASIN: ${p.asin} | Price: ${p.priceHint}`);
    for (const link of p.affiliateLinks) {
      console.log(`    Link ID: ${link.id} | URL: ${link.url}`);
    }
  }

  await db.$disconnect();
  await pool.end();
}

main();
