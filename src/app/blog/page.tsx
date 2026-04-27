import { getAllBlogPosts, getAllBlogCategories, getBlogPostsByCategory } from '@/lib/queries';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Smart Home Automation Guides & Tutorials',
  description: 'Tutorials, comparisons, and guides for Shelly, Home Assistant, Node-RED, and ESPHome. Learn to automate your home like a pro.',
};

const CATEGORY_ICONS: Record<string, string> = {
  tutorial: '📖',
  comparison: '⚖️',
  guide: '🧭',
  news: '📰',
};

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params.category;

  const [categories, posts] = await Promise.all([
    getAllBlogCategories(),
    category ? getBlogPostsByCategory(category) : getAllBlogPosts(),
  ]);

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:opacity-70">Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)' }}>Blog</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Blog
          </h1>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Tutorials, comparisons, and guides for building smart home automations.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="tab-bar mb-8">
          <Link href="/blog" className={`tab-item ${!category ? 'active' : ''}`}>All</Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${cat}`}
              className={`tab-item ${category === cat ? 'active' : ''}`}
            >
              {CATEGORY_ICONS[cat] || '📄'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="glass-card group block overflow-hidden"
                id={`blog-card-${post.slug}`}
              >
                {/* Cover gradient */}
                <div
                  className="h-32 flex items-end p-5"
                  style={{
                    background: `linear-gradient(135deg, var(--accent-muted) 0%, var(--bg-surface) 100%)`,
                  }}
                >
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    {CATEGORY_ICONS[post.category] || '📄'} {post.category}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="font-semibold text-sm mb-2 group-hover:text-teal-400 transition-colors leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                  </h2>
                  <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2">
                    <time className="text-[0.65rem] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No posts found in this category yet.</p>
            <Link href="/blog" className="btn-ghost mt-4 inline-flex">View all posts</Link>
          </div>
        )}
      </div>
    </div>
  );
}
