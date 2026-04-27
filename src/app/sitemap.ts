import { getAllBuildSheetSlugs, getAllCapabilityTags, getAllHelperSlugs, getAllBlogSlugs } from '@/lib/queries';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://automationforge.vercel.app';
  const [slugs, tags, helperSlugs, blogSlugs] = await Promise.all([
    getAllBuildSheetSlugs(),
    getAllCapabilityTags(),
    getAllHelperSlugs(),
    getAllBlogSlugs(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/build`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/fix`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/scripts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/build-sheets`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/starter-kit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const buildSheetPages: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${baseUrl}/build-sheets/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${baseUrl}/products/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const helperPages: MetadataRoute.Sitemap = helperSlugs.map((h) => ({
    url: `${baseUrl}/helpers/${h.slug}`,
    lastModified: h.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((b) => ({
    url: `${baseUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...buildSheetPages, ...productPages, ...helperPages, ...blogPages];
}
