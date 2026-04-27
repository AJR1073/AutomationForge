import { db } from './db';

function parseCapabilityTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

// ── Build Sheet Queries ───────────────────────────────────────────────────────

export async function getBuildSheetBySlug(slug: string) {
  const page = await db.automationPage.findUnique({
    where: { slug },
    include: {
      specs: {
        orderBy: { version: 'desc' },
        take: 1,
        include: { outputs: true },
      },
    },
  });
  return page;
}

export async function getAllBuildSheetSlugs() {
  const pages = await db.automationPage.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return pages;
}

export async function getBuildSheetsByCategory(category: string) {
  return db.automationPage.findMany({
    where: { status: 'published', category },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAllCategories() {
  const pages = await db.automationPage.findMany({
    where: { status: 'published' },
    select: { category: true },
    distinct: ['category'],
  });
  return [...new Set(pages.map((p) => p.category))];
}

export async function getFeaturedBuildSheets(limit = 6) {
  return db.automationPage.findMany({
    where: { status: 'published' },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

// ── Scripts Queries ───────────────────────────────────────────────────────────

export async function getScripts(filters?: { platform?: string; search?: string }) {
  const where: Record<string, unknown> = { active: true };

  if (filters?.platform && filters.platform !== 'all') {
    where.platform = filters.platform;
  }

  const scripts = await db.script.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    return scripts.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.toLowerCase().includes(q)
    );
  }

  return scripts;
}

// ── Products Queries ──────────────────────────────────────────────────────────

export async function getProductsByTags(tags: string[]) {
  const products = await db.product.findMany({
    where: { active: true },
    include: { affiliateLinks: true },
  });

  if (tags.length === 0) return products;

  return products.filter((p) => {
    const caps: string[] = JSON.parse(p.capabilityTags || '[]');
    return tags.some((tag) => caps.includes(tag));
  });
}

export async function getProductsByCapabilityTag(tag: string) {
  const products = await db.product.findMany({
    where: { active: true },
    include: { affiliateLinks: true },
  });
  return products.filter((p) => {
    const caps: string[] = JSON.parse(p.capabilityTags || '[]');
    return caps.includes(tag);
  });
}

export async function getAllCapabilityTags() {
  const products = await db.product.findMany({ where: { active: true } });
  const tags = new Set<string>();
  products.forEach((p) => {
    const caps: string[] = JSON.parse(p.capabilityTags || '[]');
    caps.forEach((c) => tags.add(c));
  });
  return [...tags];
}

// Return one product per capability tag (best match for parts list enrichment)
export async function getProductsForTags(tags: string[]) {
  const cleanTags = [...new Set(
    tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean),
  )].slice(0, 20);

  if (cleanTags.length === 0) return {};

  const products = await db.product.findMany({
    where: { active: true },
    include: { affiliateLinks: true },
    orderBy: { createdAt: 'asc' },
  });

  const scored = products.map((product) => ({
    product,
    caps: parseCapabilityTags(product.capabilityTags),
  }));

  const result: Record<string, { name: string; brand: string; asin: string; priceHint: string; affiliateUrl: string }> = {};
  const usedProductIds = new Set<string | number>();

  // Match the scarcest tags first so unique items are less likely to collide.
  const tagOrder = cleanTags
    .map((tag, originalIndex) => ({
      tag,
      originalIndex,
      candidates: scored
        .filter((entry) => entry.caps.includes(tag))
        .sort((a, b) => {
          if (a.caps.length !== b.caps.length) return a.caps.length - b.caps.length;
          return Number(Boolean(b.product.asin)) - Number(Boolean(a.product.asin));
        }),
    }))
    .sort((a, b) => {
      if (a.candidates.length !== b.candidates.length) return a.candidates.length - b.candidates.length;
      return a.originalIndex - b.originalIndex;
    });

  for (const { tag, candidates } of tagOrder) {
    const match = candidates.find((entry) => !usedProductIds.has(entry.product.id)) || candidates[0];
    if (match) {
      usedProductIds.add(match.product.id);
      result[tag] = {
        name: match.product.name,
        brand: match.product.brand,
        asin: match.product.asin || '',
        priceHint: match.product.priceHint || '',
        affiliateUrl: match.product.affiliateLinks[0]?.url || '',
      };
    }
  }

  return result;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function trackPageView(slug: string, referrer: string, userAgent: string) {
  return db.pageView.create({ data: { slug, referrer, userAgent } });
}

export async function trackEvent(
  eventType: string,
  slug: string,
  metadata: Record<string, unknown> = {}
) {
  return db.event.create({
    data: { eventType, slug, metadataJson: JSON.stringify(metadata) },
  });
}

// ── Helper Page Queries ───────────────────────────────────────────────────────

export async function getHelperBySlug(slug: string) {
  return db.helperPage.findUnique({ where: { slug } });
}

export async function getAllHelperSlugs() {
  return db.helperPage.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getHelpersByCategory(category: string, limit?: number) {
  return db.helperPage.findMany({
    where: { status: 'published', category },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getHelpersByCapabilityTags(tags: string[], limit = 6) {
  const helpers = await db.helperPage.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'asc' },
  });

  const matched = helpers.filter((h) => {
    const caps: string[] = JSON.parse(h.capabilityTags || '[]');
    return tags.some((tag) => caps.includes(tag));
  });

  return matched.slice(0, limit);
}

export async function getFeaturedHelpers(limit = 6) {
  return db.helperPage.findMany({
    where: { status: 'published' },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

// ── Blog Queries ──────────────────────────────────────────────────────────────

export async function getAllBlogPosts(limit = 50) {
  return db.blogPost.findMany({
    where: { status: 'published' },
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });
}

export async function getBlogPostBySlug(slug: string) {
  return db.blogPost.findUnique({ where: { slug } });
}

export async function getBlogPostsByCategory(category: string, limit = 50) {
  return db.blogPost.findMany({
    where: { status: 'published', category },
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });
}

export async function getAllBlogSlugs() {
  return db.blogPost.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
}

export async function getAllBlogCategories() {
  const posts = await db.blogPost.findMany({
    where: { status: 'published' },
    select: { category: true },
    distinct: ['category'],
  });
  return [...new Set(posts.map((p) => p.category))];
}

// ── Stats / Analytics Queries ─────────────────────────────────────────────────

export async function getEventCounts() {
  const [generated, copied, fixed] = await Promise.all([
    db.event.count({ where: { eventType: 'generate_success' } }),
    db.event.count({ where: { eventType: 'copy_code' } }),
    db.event.count({ where: { eventType: 'fix_success' } }),
  ]);
  return { buildsGenerated: generated, codesCopied: copied, fixesApplied: fixed };
}

export async function getAffiliateStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await db.event.findMany({
    where: {
      eventType: { in: ['outbound_click', 'affiliate_click', 'buy_all_click'] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

  const byProduct: Record<string, { clicks: number; lastClicked: Date }> = {};
  let buyAllClicks = 0;

  for (const event of events) {
    if (event.eventType === 'buy_all_click') {
      buyAllClicks++;
      continue;
    }
    const meta = JSON.parse(event.metadataJson || '{}');
    const name = (meta.name as string) || 'Unknown';
    if (!byProduct[name]) {
      byProduct[name] = { clicks: 0, lastClicked: event.createdAt };
    }
    byProduct[name].clicks++;
  }

  const topProducts = Object.entries(byProduct)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  return { topProducts, buyAllClicks, totalClicks: events.length, period: `${days}d` };
}

// ── Subscriber Queries ────────────────────────────────────────────────────────

export async function addSubscriber(email: string, source = 'homepage') {
  try {
    return await db.subscriber.create({ data: { email, source } });
  } catch {
    // unique constraint — already subscribed
    return null;
  }
}

