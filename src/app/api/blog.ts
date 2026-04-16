import type { BlogPost } from "../lib/blog";
import { getBlogFallbackImage } from "../lib/blog";

const API_BASE = "http://localhost:8000/api";

interface BlogPostResponse {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category: string;
  tags?: string[] | null;
  author: string;
  status: BlogPost["status"];
  image?: string | null;
  views?: number | null;
  comments?: number | null;
  readTime?: number | null;
  featured?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

export interface CatalogBlogPostsQuery {
  limit?: number;
  category?: string;
  q?: string;
  featured?: boolean;
}

async function fetchBlog<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Impossible de charger les articles.");
  }

  return payload?.data as T;
}

function mapBlogPost(post: BlogPostResponse): BlogPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content || undefined,
    category: post.category,
    tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
    author: post.author,
    status: post.status,
    image: post.image || getBlogFallbackImage(post.category),
    views: Number(post.views ?? 0),
    comments: Number(post.comments ?? 0),
    readTime: Math.max(1, Number(post.readTime ?? 1)),
    featured: Boolean(post.featured),
    createdAt: post.createdAt || undefined,
    updatedAt: post.updatedAt || undefined,
    publishedAt: post.publishedAt || undefined,
  };
}

export async function getCatalogBlogPosts(options: CatalogBlogPostsQuery = {}): Promise<BlogPost[]> {
  const searchParams = new URLSearchParams();

  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }

  if (options.category?.trim()) {
    searchParams.set("category", options.category.trim());
  }

  if (options.q?.trim()) {
    searchParams.set("q", options.q.trim());
  }

  if (options.featured) {
    searchParams.set("featured", "1");
  }

  const query = searchParams.toString();
  const endpoint = query ? `/blog/posts?${query}` : "/blog/posts";
  const posts = await fetchBlog<BlogPostResponse[]>(endpoint);
  return posts.map(mapBlogPost);
}

export async function getCatalogBlogPost(slugOrId: string): Promise<BlogPost> {
  const post = await fetchBlog<BlogPostResponse>(`/blog/posts/${slugOrId}`);
  return mapBlogPost(post);
}
