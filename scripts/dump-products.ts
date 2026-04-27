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

  for (const p of products) {
    const link = p.affiliateLinks[0];
    console.log(`ID ${p.id} | ${p.name} | ASIN: ${p.asin} | ${link?.url || 'NO LINK'}`);
  }

  await db.$disconnect();
  await pool.end();
}

main();
