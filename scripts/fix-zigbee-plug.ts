import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const newAsin = 'B0BPY2KRHH';
  const newName = 'ThirdReality Zigbee Smart Plug Gen2';
  const newUrl = `https://www.amazon.com/dp/${newAsin}?tag=automforge20-20`;

  await db.product.update({
    where: { id: 90 },
    data: {
      name: newName,
      brand: 'ThirdReality',
      asin: newAsin,
      priceHint: '$13',
    },
  });

  await db.affiliateLink.update({
    where: { id: 90 },
    data: { url: newUrl },
  });

  console.log(`✅ Updated product ID 90:`);
  console.log(`   Name: ${newName}`);
  console.log(`   ASIN: ${newAsin}`);
  console.log(`   URL:  ${newUrl}`);

  await db.$disconnect();
  await pool.end();
}

main();
