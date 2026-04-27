import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const TAG = 'automforge20-20';

const fixes = [
  {
    id: 79,
    linkId: 79,
    name: 'Shelly Dimmer 0/1-10V Gen3',
    brand: 'Shelly',
    asin: 'B0D9JQTP8B',
    price: '$28',
  },
  {
    id: 86,
    linkId: 86,
    name: 'GoveeLife Smart Water Leak Detector',
    brand: 'GoveeLife',
    asin: 'B0DQLDBXWF',
    price: '$44',
  },
  {
    id: 88,
    linkId: 88,
    name: 'BTF-LIGHTING ESP32 WLED Controller',
    brand: 'BTF-LIGHTING',
    asin: 'B0FB38FDCS',
    price: '$30',
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  for (const fix of fixes) {
    const newUrl = `https://www.amazon.com/dp/${fix.asin}?tag=${TAG}`;

    await db.product.update({
      where: { id: fix.id },
      data: {
        name: fix.name,
        brand: fix.brand,
        asin: fix.asin,
        priceHint: fix.price,
      },
    });

    await db.affiliateLink.update({
      where: { id: fix.linkId },
      data: { url: newUrl },
    });

    console.log(`✅ Fixed ID ${fix.id}: ${fix.name} → ASIN ${fix.asin}`);
  }

  await db.$disconnect();
  await pool.end();
}

main();
