import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Calendar, Clock, Search, User } from "lucide-react";
import { toast } from "sonner";
import { getCatalogBlogPost, getCatalogBlogPosts } from "../api/blog";
import type { BlogPost } from "../lib/blog";
import { formatBlogDate, formatBlogReadTime } from "../lib/blog";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function categoryColor(category: string): string {
  const normalized = category.toLowerCase();

  if (normalized.includes("entretien")) {
    return "text-[#22C55E]";
  }

  if (normalized.includes("tendance") || normalized.includes("actualite")) {
    return "text-[#E8400C]";
  }

  if (normalized.includes("comparatif")) {
    return "text-[#FFD60A]";
  }

  return "text-[#0A84FF]";
}

function BlogLoadingState() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8 space-y-6">
      <div className="h-20 rounded-2xl bg-[#F3F4F6] dark:bg-white/5 animate-pulse" />
      <div className="h-80 rounded-2xl bg-[#F3F4F6] dark:bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 rounded-xl bg-[#F3F4F6] dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function BlogPage() {
  const { slug } = useParams();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const isDetailView = Boolean(slug);

  useEffect(() => {
    let isMounted = true;

    const loadBlogData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (slug) {
          const [post, relatedPosts] = await Promise.all([
            getCatalogBlogPost(slug),
            getCatalogBlogPosts({ limit: 12 }),
          ]);

          if (!isMounted) {
            return;
          }

          setCurrentPost(post);
          setPosts(relatedPosts.filter((item) => item.id !== post.id));
        } else {
          const allPosts = await getCatalogBlogPosts();

          if (!isMounted) {
            return;
          }

          setCurrentPost(null);
          setPosts(allPosts);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = getErrorMessage(
          error,
          slug ? "Impossible de charger cet article." : "Impossible de charger les articles.",
        );

        setErrorMessage(message);
        setCurrentPost(null);
        setPosts([]);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBlogData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();

    posts.forEach((post) => {
      if (post.category.trim()) {
        categorySet.add(post.category.trim());
      }
    });

    return Array.from(categorySet);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        post.title,
        post.slug,
        post.excerpt,
        post.author,
        post.category,
        post.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [categoryFilter, posts, search]);

  const featuredPost = useMemo(() => {
    if (filteredPosts.length === 0) {
      return null;
    }

    return filteredPosts.find((post) => post.featured) || filteredPosts[0];
  }, [filteredPosts]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) {
      return filteredPosts;
    }

    return filteredPosts.filter((post) => post.id !== featuredPost.id);
  }, [featuredPost, filteredPosts]);

  const relatedPosts = useMemo(() => {
    if (!currentPost) {
      return [];
    }

    const sameCategory = posts.filter((post) => post.category === currentPost.category);

    if (sameCategory.length >= 3) {
      return sameCategory.slice(0, 3);
    }

    return posts.slice(0, 3);
  }, [currentPost, posts]);

  if (isLoading) {
    return <BlogLoadingState />;
  }

  if (isDetailView) {
    if (!currentPost) {
      return (
        <div className="max-w-[940px] mx-auto px-4 md:px-8 py-10">
          <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-8 text-center bg-white dark:bg-[#1E1E24]">
            <h1 className="text-2xl text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              Article introuvable
            </h1>
            <p className="text-[14px] text-[#6B7280] dark:text-white/60 mt-2">
              {errorMessage || "Cet article n'existe pas ou n'est pas encore publie."}
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-[#E8400C] text-white text-sm hover:bg-[#cf3a0a]"
              style={{ fontWeight: 600 }}
            >
              <ArrowLeft className="w-4 h-4" /> Retour au blog
            </Link>
          </div>
        </div>
      );
    }

    const contentParagraphs = (currentPost.content || "")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return (
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 space-y-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#E8400C] text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux articles
        </Link>

        <article className="space-y-6">
          <div>
            <span className={`text-xs ${categoryColor(currentPost.category)}`} style={{ fontWeight: 600 }}>
              {currentPost.category}
            </span>
            <h1 className="text-3xl md:text-4xl mt-2 text-[#1A2332] dark:text-white" style={{ fontWeight: 800 }}>
              {currentPost.title}
            </h1>
            <p className="text-[15px] text-[#6B7280] dark:text-white/60 mt-3">
              {currentPost.excerpt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] dark:text-white/60">
            <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{currentPost.author}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatBlogDate(currentPost.publishedAt || currentPost.createdAt)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatBlogReadTime(currentPost.readTime)} de lecture</span>
          </div>

          <div className="aspect-[16/8] rounded-2xl overflow-hidden bg-card border border-border">
            <img src={currentPost.image} alt={currentPost.title} className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {contentParagraphs.length > 0 ? (
              contentParagraphs.map((paragraph, index) => (
                <p key={index} className="text-[15px] leading-7 text-[#1F2937] dark:text-white/85 mb-4">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-[15px] leading-7 text-[#1F2937] dark:text-white/85">
                {currentPost.excerpt}
              </p>
            )}
          </div>
        </article>

        {relatedPosts.length > 0 ? (
          <section>
            <h2 className="text-2xl text-[#1A2332] dark:text-white mb-4" style={{ fontWeight: 700 }}>
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug || post.id}`}
                  className="group rounded-xl overflow-hidden bg-card border border-border"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className={`text-xs ${categoryColor(post.category)}`} style={{ fontWeight: 600 }}>
                      {post.category}
                    </span>
                    <h3 className="text-sm mt-1 text-[#1A2332] dark:text-white group-hover:text-[#E8400C] transition-colors" style={{ fontWeight: 600 }}>
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 py-8 space-y-8">
      <div className="text-center mb-3">
        <h1 className="text-3xl mb-2" style={{ fontWeight: 700 }}>Nos conseils d'experts</h1>
        <p className="text-muted-foreground">Guides d'achat, astuces entretien et tendances du monde de l'electromenager.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#E8400C]"
            placeholder="Rechercher un article"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#E8400C]"
        >
          <option value="all">Toutes les categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEE2E2] text-[#991B1B] px-4 py-3 text-sm">
          {errorMessage}
        </div>
      ) : null}

      {featuredPost ? (
        <Link to={`/blog/${featuredPost.slug || featuredPost.id}`} className="group flex flex-col md:flex-row gap-6 p-4 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="md:w-1/2 aspect-[16/10] rounded-xl overflow-hidden">
            <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div className="md:w-1/2 flex flex-col justify-center py-2">
            <span className={`text-xs mb-2 ${categoryColor(featuredPost.category)}`} style={{ fontWeight: 600 }}>{featuredPost.category}</span>
            <h2 className="text-xl md:text-2xl mb-3 group-hover:text-[#E8400C] transition-colors text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              {featuredPost.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{featuredPost.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{featuredPost.author}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatBlogReadTime(featuredPost.readTime)} de lecture</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatBlogDate(featuredPost.publishedAt || featuredPost.createdAt)}</span>
            </div>
          </div>
        </Link>
      ) : null}

      {regularPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group rounded-xl overflow-hidden bg-card border border-border">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className={`text-xs ${categoryColor(post.category)}`} style={{ fontWeight: 600 }}>{post.category}</span>
                <h3 className="text-sm mt-1 mb-2 group-hover:text-[#E8400C] transition-colors text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.author}</span>
                  <span>{formatBlogReadTime(post.readTime)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="text-lg text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
            Aucun article trouve
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Essayez de modifier vos filtres de recherche.
          </p>
        </div>
      )}
    </div>
  );
}
