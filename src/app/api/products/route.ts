import { NextRequest, NextResponse } from 'next/server';
import { getProductsForTags } from '@/lib/queries';

// POST /api/products — lookup products by capability tags
export async function POST(req: NextRequest) {
  try {
    const { tags } = await req.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'tags array required' }, { status: 400 });
    }
    const cleanTags = tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 20);

    if (cleanTags.length === 0) {
      return NextResponse.json({ error: 'tags must contain strings' }, { status: 400 });
    }

    const products = await getProductsForTags(cleanTags);
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
