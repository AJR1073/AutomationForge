import { getBlogPostBySlug, getAllBlogSlugs, getFeaturedBuildSheets } from '@/lib/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import NewsletterCapture from '@/components/NewsletterCapture';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    openGraph: {
      type: 'article',
      title: post.seoTitle,
      description: post.seoDescription,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedSheets = await getFeaturedBuildSheets(3);
  const tags: string[] = JSON.parse(post.tags || '[]');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: 'AutomationForge' },
    publisher: { '@type': 'Organization', name: 'AutomationForge' },
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:opacity-70">Blog</Link>
          <span>/</span>
          <span className="truncate" style={{ color: 'var(--text-primary)' }}>{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs px-2.5 py-1 rounded-md font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              {post.category}
            </span>
            <time className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </time>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            {post.title}
          </h1>

          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {post.excerpt}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[0.65rem] px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <hr className="section-divider mb-10" />

        {/* Content */}
        <article
          className="blog-prose mb-16"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <hr className="section-divider mb-10" />

        {/* Related Build Sheets */}
        {relatedSheets.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Related build sheets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedSheets.map((sheet) => (
                <Link key={sheet.id} href={`/build-sheets/${sheet.slug}`} className="glass-card group p-4">
                  <span className="text-xs mb-1 block" style={{ color: 'var(--text-faint)' }}>{sheet.category}</span>
                  <h3 className="text-sm font-medium group-hover:text-teal-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {sheet.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <NewsletterCapture source="blog" />
      </div>
    </div>
  );
}
