import { getToken } from "./auth";
import type { BlogPost, BlogPostStatus } from "../lib/blog";
import { getBlogFallbackImage } from "../lib/blog";

const API_URL = "http://localhost:8000/api/admin";

interface AdminBlogPostResponse {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category: string;
  tags?: string[] | null;
  author: string;
  status: BlogPostStatus;
  image?: string | null;
  views?: number | null;
  comments?: number | null;
  readTime?: number | null;
  featured?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

export interface AdminBlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: BlogPostStatus;
  image?: string;
  readTime?: number;
  featured?: boolean;
  publishedAt?: string;
  views?: number;
  comments?: number;
  imageFile?: File | null;
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error: Error & { data?: unknown } = new Error(payload?.message || "Une erreur est survenue");
    error.data = payload;
    throw error;
  }

  return payload?.data as T;
}

function buildBlogPostFormData(payload: AdminBlogPostInput): FormData {
  const formData = new FormData();

  formData.append("title", payload.title);

  if (payload.slug !== undefined) {
    formData.append("slug", payload.slug);
  }

  if (payload.excerpt !== undefined) {
    formData.append("excerpt", payload.excerpt);
  }

  formData.append("content", payload.content);
  formData.append("category", payload.category);

  payload.tags.forEach((tag) => {
    formData.append("tags[]", tag);
  });

  formData.append("author", payload.author);
  formData.append("status", payload.status);

  if (payload.image !== undefined) {
    formData.append("image", payload.image);
  }

  if (payload.readTime !== undefined) {
    formData.append("readTime", String(payload.readTime));
  }

  if (payload.featured !== undefined) {
    formData.append("featured", payload.featured ? "1" : "0");
  }

  if (payload.publishedAt !== undefined) {
    formData.append("publishedAt", payload.publishedAt);
  }

  if (payload.views !== undefined) {
    formData.append("views", String(payload.views));
  }

  if (payload.comments !== undefined) {
    formData.append("comments", String(payload.comments));
  }

  if (payload.imageFile) {
    formData.append("image_file", payload.imageFile);
  }

  return formData;
}

function mapAdminBlogPost(post: AdminBlogPostResponse): BlogPost {
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

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  const posts = await fetchWithAuth<AdminBlogPostResponse[]>("/blog/posts");
  return posts.map(mapAdminBlogPost);
}

export async function getAdminBlogPost(id: number): Promise<BlogPost> {
  const post = await fetchWithAuth<AdminBlogPostResponse>(`/blog/posts/${id}`);
  return mapAdminBlogPost(post);
}

export async function createAdminBlogPost(payload: AdminBlogPostInput): Promise<BlogPost> {
  const formData = buildBlogPostFormData(payload);

  const post = await fetchWithAuth<AdminBlogPostResponse>("/blog/posts", {
    method: "POST",
    body: formData,
  });

  return mapAdminBlogPost(post);
}

export async function updateAdminBlogPost(id: number, payload: AdminBlogPostInput): Promise<BlogPost> {
  const formData = buildBlogPostFormData(payload);
  formData.append("_method", "PUT");

  const post = await fetchWithAuth<AdminBlogPostResponse>(`/blog/posts/${id}`, {
    method: "POST",
    body: formData,
  });

  return mapAdminBlogPost(post);
}

export async function deleteAdminBlogPost(id: number): Promise<void> {
  await fetchWithAuth<void>(`/blog/posts/${id}`, {
    method: "DELETE",
  });
}
