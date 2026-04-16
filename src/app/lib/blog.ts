import { IMAGES } from "../data/store";

export type BlogPostStatus = "published" | "draft" | "scheduled" | "archived";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  tags: string[];
  author: string;
  status: BlogPostStatus;
  image: string;
  views: number;
  comments: number;
  readTime: number;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export const BLOG_CATEGORIES = [
  "Guide d'achat",
  "Guides d'achat",
  "Entretien",
  "Conseils entretien",
  "Tendances",
  "Nouveautes",
  "Nouveautes & tests",
  "Comparatif",
  "Comparatifs",
  "Actualites",
  "Cuisine & Recettes",
] as const;

export const BLOG_STATUS_CONFIG: Record<BlogPostStatus, { label: string; color: string }> = {
  published: { label: "Publie", color: "#10B981" },
  draft: { label: "Brouillon", color: "#9CA3AF" },
  scheduled: { label: "Planifie", color: "#3B82F6" },
  archived: { label: "Archive", color: "#6B7280" },
};

function normalizeCategoryName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getBlogFallbackImage(category?: string | null): string {
  const normalizedCategory = normalizeCategoryName(category || "");

  if (normalizedCategory.includes("entretien")) {
    return IMAGES.blog2;
  }

  if (normalizedCategory.includes("tendance") || normalizedCategory.includes("actualite")) {
    return IMAGES.blog3;
  }

  if (normalizedCategory.includes("comparatif")) {
    return IMAGES.ac;
  }

  if (normalizedCategory.includes("cuisine")) {
    return IMAGES.kitchen;
  }

  return IMAGES.blog1;
}

export function formatBlogReadTime(readTime: number): string {
  return `${readTime} min`;
}

export function formatBlogDate(date?: string): string {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
