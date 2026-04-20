import { NextRequest, NextResponse } from 'next/server';
import { getProductsForTags } from '@/lib/queries';

// POST /api/products — lookup products by capability tags
export async function POST(req: NextRequest) {
  try {
    const { tags } = await req.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'tags array required' }, { status: 400 });
    }
    const products = await getProductsForTags(tags.slice(0, 20));
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
