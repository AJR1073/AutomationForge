import { NextResponse } from 'next/server';
import { getAffiliateStats } from '@/lib/queries';

export async function GET() {
  try {
    const stats = await getAffiliateStats(30);
    return NextResponse.json(stats);
  } catch (err: unknown) {
    console.error('[/api/stats/affiliates]', err);
    return NextResponse.json({ error: 'Failed to fetch affiliate stats' }, { status: 500 });
  }
}
