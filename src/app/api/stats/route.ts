import { NextResponse } from 'next/server';
import { getEventCounts } from '@/lib/queries';

export async function GET() {
  try {
    const counts = await getEventCounts();

    return NextResponse.json(counts, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: unknown) {
    console.error('[/api/stats]', err);
    // Return fallback minimums so the counter always renders
    return NextResponse.json(
      { buildsGenerated: 150, codesCopied: 420, fixesApplied: 85 },
      { status: 200 }
    );
  }
}
