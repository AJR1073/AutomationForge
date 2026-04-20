import { NextRequest, NextResponse } from 'next/server';
import { detectAndFix } from '@/lib/engine/fixer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code: string };

    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const code = body.code.slice(0, 50000); // safety limit
    const result = detectAndFix(code);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[/api/fix]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
