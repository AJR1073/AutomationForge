import { db } from './db';

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
  const products = await db.product.findMany({
    where: { active: true },
    include: { affiliateLinks: true },
  });
  const result: Record<string, { name: string; brand: string; asin: string; priceHint: string; affiliateUrl: string }> = {};
  for (const tag of tags) {
    const match = products.find((p) => {
      const caps: string[] = JSON.parse(p.capabilityTags || '[]');
      return caps.includes(tag);
    });
    if (match) {
      result[tag] = {
        name: match.name,
        brand: match.brand,
        asin: match.asin || '',
        priceHint: match.priceHint || '',
        affiliateUrl: match.affiliateLinks[0]?.url || '',
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

