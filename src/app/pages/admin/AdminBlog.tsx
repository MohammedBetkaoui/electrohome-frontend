import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAdminBlogPost,
  deleteAdminBlogPost,
  getAdminBlogPosts,
  updateAdminBlogPost,
  type AdminBlogPostInput,
} from "../../api/adminBlog";
import { useAuth } from "../../context/AuthContext";
import {
  BLOG_CATEGORIES,
  BLOG_STATUS_CONFIG,
  type BlogPost,
  type BlogPostStatus,
  formatBlogDate,
  formatBlogReadTime,
} from "../../lib/blog";

type ViewMode = "grid" | "list";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function estimateReadTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

function BlogLoadingState() {
  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
          />
        ))}
      </div>
      <div className="h-32 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1E1E24] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function PostFormModal({
  post,
  defaultAuthor,
  isSubmitting,
  categories,
  onClose,
  onSave,
}: {
  post?: BlogPost | null;
  defaultAuthor: string;
  isSubmitting: boolean;
  categories: string[];
  onClose: () => void;
  onSave: (payload: AdminBlogPostInput, id?: number) => Promise<void>;
}) {
  const isEdit = Boolean(post);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    category: post?.category || categories[0] || BLOG_CATEGORIES[0],
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    tags: post?.tags.join(", ") || "",
    author: post?.author || defaultAuthor,
    status: post?.status || ("published" as BlogPostStatus),
    image: post?.image || "",
    readTime: post?.readTime || 5,
    featured: post?.featured || false,
    publishedAt: post?.publishedAt ? post.publishedAt.slice(0, 16) : "",
    views: post?.views || 0,
    comments: post?.comments || 0,
  });

  const previewReadTime = estimateReadTime(form.content);
  const previewImage = selectedImagePreview || form.image.trim();

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "title" && !slugTouched) {
        next.slug = slugify(String(value));
      }

      if (field === "content" && (!post || !current.readTime)) {
        next.readTime = estimateReadTime(String(value));
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }

    if (!form.content.trim()) {
      toast.error("Le contenu est obligatoire.");
      return;
    }

    if (!form.category.trim()) {
      toast.error("La categorie est obligatoire.");
      return;
    }

    if (!form.author.trim()) {
      toast.error("L'auteur est obligatoire.");
      return;
    }

    await onSave(
      {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        category: form.category.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        author: form.author.trim(),
        status: form.status,
        image: form.image.trim(),
        imageFile: selectedImageFile,
        readTime: Math.max(1, Number(form.readTime) || previewReadTime),
        featured: form.featured,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
        views: Math.max(0, Number(form.views) || 0),
        comments: Math.max(0, Number(form.comments) || 0),
      },
      post?.id,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-[100] flex items-start justify-center pt-8 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E1E24] rounded-2xl w-full max-w-4xl shadow-2xl m-4"
        style={{ fontFamily: "'Sora', sans-serif" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-white/10">
          <div>
            <h2 className="text-[18px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
              {isEdit ? "Modifier l'article" : "Nouvel article"}
            </h2>
            <p className="text-[12px] text-[#6B7280] dark:text-white/55 mt-1">
              Les articles `published` sont visibles sur `/blog` et sur la home.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#111827] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_340px] gap-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Titre
                </label>
                <input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  placeholder="Ex: Comment choisir son refrigerateur en 2026"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setField("slug", slugify(event.target.value));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  placeholder="choisir-refrigerateur-2026"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Auteur
                </label>
                <input
                  value={form.author}
                  onChange={(event) => setField("author", event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  placeholder="Nom de l'auteur"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Categorie
                </label>
                <select
                  value={form.category}
                  onChange={(event) => setField("category", event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Statut
                </label>
                <select
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value as BlogPostStatus)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                >
                  {Object.entries(BLOG_STATUS_CONFIG).map(([status, config]) => (
                    <option key={status} value={status}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Image
                </label>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <input
                    value={form.image}
                    onChange={(event) => setField("image", event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                    placeholder="URL image (optionnel)"
                  />

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        if (selectedImagePreview) {
                          URL.revokeObjectURL(selectedImagePreview);
                        }

                        setSelectedImageFile(file);
                        setSelectedImagePreview(URL.createObjectURL(file));

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#D1D5DB] dark:border-white/25 text-[12px] text-[#6B7280] dark:text-white/65 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <Upload className="w-4 h-4" /> Upload image
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                  {selectedImageFile ? (
                    <>
                      <span className="text-[#0F766E] dark:text-[#2DD4BF]" style={{ fontWeight: 600 }}>
                        Fichier selectionne: {selectedImageFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedImagePreview) {
                            URL.revokeObjectURL(selectedImagePreview);
                          }

                          setSelectedImageFile(null);
                          setSelectedImagePreview(null);
                        }}
                        className="text-[#EF4444] hover:underline"
                        style={{ fontWeight: 600 }}
                      >
                        Retirer
                      </button>
                    </>
                  ) : (
                    <span className="text-[#9CA3AF]">
                      PNG, JPG, WEBP (max 2MB). Le fichier uploade est prioritaire sur l'URL.
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Extrait
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => setField("excerpt", event.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] resize-none"
                  placeholder="Resume court affiche sur la liste des articles"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Contenu
                </label>
                <textarea
                  value={form.content}
                  onChange={(event) => setField("content", event.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] resize-y"
                  placeholder="Redigez l'article. Les paragraphes seront conserves cote frontend."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Tags
                </label>
                <input
                  value={form.tags}
                  onChange={(event) => setField("tags", event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  placeholder="guide, refrigerateur, conseils"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-[#111827] text-white p-5 border border-white/10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Apercu rapide</p>
              <div className="h-36 rounded-xl overflow-hidden bg-white/10 mt-3 mb-4">
                {previewImage ? (
                  <img src={previewImage} alt="Apercu article" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[12px] text-white/55">
                    Aucune image selectionnee
                  </div>
                )}
              </div>
              <h3 className="text-[18px] mt-2" style={{ fontWeight: 700 }}>
                {form.title.trim() || "Titre de l'article"}
              </h3>
              <p className="text-[12px] text-white/70 mt-3">
                {form.excerpt.trim() || "L'extrait apparaitra ici une fois rempli."}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-white/70">
                <span>{form.author || defaultAuthor}</span>
                <span>•</span>
                <span>{formatBlogReadTime(Math.max(1, Number(form.readTime) || previewReadTime))}</span>
                <span>•</span>
                <span>{BLOG_STATUS_CONFIG[form.status].label}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-4 bg-white dark:bg-[#1E1E24] space-y-3">
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Temps de lecture
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.readTime}
                  onChange={(event) => setField("readTime", Math.max(1, Number(event.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">Suggestion automatique: {previewReadTime} min</p>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                  Date de publication
                </label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => setField("publishedAt", event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                    Vues
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.views}
                    onChange={(event) => setField("views", Math.max(0, Number(event.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6B7280] dark:text-white/55 mb-1.5" style={{ fontWeight: 600 }}>
                    Commentaires
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.comments}
                    onChange={(event) => setField("comments", Math.max(0, Number(event.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <button
                onClick={() => setField("featured", !form.featured)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  form.featured
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-[#E5E7EB] dark:border-white/10 text-[#6B7280] dark:text-white/65"
                }`}
              >
                <span className="text-[13px]" style={{ fontWeight: 600 }}>Article vedette</span>
                <Star className={`w-4 h-4 ${form.featured ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E7EB] dark:border-white/10">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/65 hover:bg-[#F3F4F6] dark:hover:bg-white/5 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] disabled:opacity-50"
            style={{ fontWeight: 700 }}
          >
            {isEdit ? "Enregistrer" : "Creer l'article"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminBlog() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const perPage = 6;

  const defaultAuthor = useMemo(() => {
    return user?.full_name?.trim() || "Equipe ElectroHome";
  }, [user?.full_name]);

  const sortPosts = (items: BlogPost[]) => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return b.id - a.id;
    });
  };

  const loadPosts = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getAdminBlogPosts();
      setPosts(sortPosts(data));
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de charger les articles du blog."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>(BLOG_CATEGORIES);

    posts.forEach((post) => {
      const category = post.category.trim();
      if (category) {
        categorySet.add(category);
      }
    });

    return Array.from(categorySet);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }

      if (!debouncedSearch) {
        return true;
      }

      const haystack = [
        post.title,
        post.slug,
        post.excerpt,
        post.content || "",
        post.author,
        post.category,
        post.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(debouncedSearch);
    });
  }, [categoryFilter, debouncedSearch, posts, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPosts.slice(start, start + perPage);
  }, [filteredPosts, page]);

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((post) => post.status === "published").length;
    const featured = posts.filter((post) => post.featured).length;
    const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

    return {
      total,
      published,
      featured,
      totalViews,
      totalComments,
    };
  }, [posts]);

  const statusCounts = useMemo(() => {
    return {
      all: posts.length,
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      archived: posts.filter((post) => post.status === "archived").length,
    };
  }, [posts]);

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingPost(null);
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleSavePost = async (payload: AdminBlogPostInput, id?: number) => {
    setIsSubmitting(true);

    try {
      if (id) {
        const updatedPost = await updateAdminBlogPost(id, payload);
        setPosts((current) => sortPosts(current.map((post) => (post.id === id ? updatedPost : post))));
        toast.success("Article mis a jour avec succes.");
      } else {
        const createdPost = await createAdminBlogPost(payload);
        setPosts((current) => sortPosts([createdPost, ...current]));
        toast.success("Article cree avec succes.");
      }

      setIsModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible d'enregistrer l'article."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    const confirmed = window.confirm(`Supprimer l'article \"${post.title}\" ?`);

    if (!confirmed) {
      return;
    }

    setDeletingPostId(post.id);

    try {
      await deleteAdminBlogPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success("Article supprime avec succes.");

      if (editingPost?.id === post.id) {
        setEditingPost(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de supprimer l'article."));
    } finally {
      setDeletingPostId(null);
    }
  };

  if (isLoading) {
    return <BlogLoadingState />;
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total articles", value: stats.total, icon: FileText, color: "#3B82F6" },
          { label: "Publies", value: stats.published, icon: TrendingUp, color: "#10B981" },
          { label: "Vues cumul.", value: stats.totalViews.toLocaleString("fr-DZ"), icon: Eye, color: "#F59E0B" },
          { label: "Commentaires", value: stats.totalComments.toLocaleString("fr-DZ"), icon: MessageSquare, color: "#8B5CF6" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#1E1E24] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/10 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.color + "15" }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#9CA3AF] truncate">{card.label}</p>
              <p className="text-[18px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 700 }}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", `Tous (${statusCounts.all})`],
          ["published", `Publies (${statusCounts.published})`],
          ["draft", `Brouillons (${statusCounts.draft})`],
          ["scheduled", `Planifies (${statusCounts.scheduled})`],
          ["archived", `Archives (${statusCounts.archived})`],
        ] as const).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as BlogPostStatus | "all")}
            className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
              statusFilter === status
                ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                : "border-[#E5E7EB] dark:border-white/10 text-[#6B7280] dark:text-white/55"
            }`}
            style={{ fontWeight: 500 }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher titre, auteur, tag..."
                className="pl-9 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] w-72 outline-none text-[#1A2332] dark:text-white placeholder:text-[#9CA3AF] focus:border-[#FF6B35] transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] outline-none text-[#1A2332] dark:text-white focus:border-[#FF6B35]"
            >
              <option value="all">Toutes les categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={() => void loadPosts({ silent: true })}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-[12px] text-[#6B7280] dark:text-white/60 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              {isRefreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-[12px] ${
                  viewMode === "grid"
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#6B7280] dark:text-white/55"
                }`}
                style={{ fontWeight: 600 }}
              >
                Grille
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-[12px] ${
                  viewMode === "list"
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#6B7280] dark:text-white/55"
                }`}
                style={{ fontWeight: 600 }}
              >
                Liste
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B]"
              style={{ fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" /> Nouvel article
            </button>
          </div>
        </div>

        <p className="text-[12px] text-[#9CA3AF]">
          {filteredPosts.length} article{filteredPosts.length > 1 ? "s" : ""} trouve{filteredPosts.length > 1 ? "s" : ""}
          {stats.featured > 0 ? ` · ${stats.featured} vedette${stats.featured > 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {paginatedPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-dashed border-[#D1D5DB] dark:border-white/10 p-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F3F4F6] dark:bg-white/10 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <h3 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 700 }}>
            Aucun article a afficher
          </h3>
          <p className="text-[13px] text-[#6B7280] dark:text-white/55 mt-1">
            Ajustez les filtres ou creez un nouvel article.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] mt-4"
            style={{ fontWeight: 700 }}
          >
            <Plus className="w-4 h-4" /> Creer un article
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedPosts.map((post) => {
            const statusConfig = BLOG_STATUS_CONFIG[post.status];
            const publishedDate = post.publishedAt || post.createdAt;

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden"
              >
                <div className="aspect-[16/10] bg-[#F3F4F6] dark:bg-white/5 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-[10px]"
                      style={{ fontWeight: 600, backgroundColor: statusConfig.color + "15", color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                    {post.featured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#FF6B35]" style={{ fontWeight: 700 }}>
                        <Star className="w-3 h-3 fill-current" /> Vedette
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-[15px] text-[#1A2332] dark:text-white leading-snug" style={{ fontWeight: 700 }}>
                    {post.title}
                  </h3>

                  <p className="text-[12px] text-[#6B7280] dark:text-white/60 line-clamp-2">
                    {post.excerpt || "Aucun extrait disponible."}
                  </p>

                  <div className="space-y-1.5 text-[11px] text-[#9CA3AF]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatBlogDate(publishedDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatBlogReadTime(post.readTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-md text-[10px] bg-[#F3F4F6] dark:bg-white/8 text-[#6B7280] dark:text-white/65">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={`/blog/${post.slug || post.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[#3B82F6] hover:underline"
                      style={{ fontWeight: 600 }}
                    >
                      <Eye className="w-3.5 h-3.5" /> Apercu
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(post)}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35]"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => void handleDeletePost(post)}
                        disabled={deletingPostId === post.id}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[860px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Article</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Auteur</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Statut</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Publication</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Lecture</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Stats</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedPosts.map((post) => {
                  const statusConfig = BLOG_STATUS_CONFIG[post.status];
                  const publishedDate = post.publishedAt || post.createdAt;

                  return (
                    <tr key={post.id} className="border-b border-[#E5E7EB]/60 dark:border-white/5 last:border-none">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-10 rounded-lg bg-[#F3F4F6] dark:bg-white/10 overflow-hidden shrink-0">
                            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] text-[#1A2332] dark:text-white truncate" style={{ fontWeight: 600 }}>
                              {post.title}
                            </p>
                            <p className="text-[11px] text-[#9CA3AF] truncate">{post.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-white/65">{post.author}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px]"
                          style={{ fontWeight: 600, backgroundColor: statusConfig.color + "15", color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-white/65">{formatBlogDate(publishedDate)}</td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-white/65">{formatBlogReadTime(post.readTime)}</td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-white/65">
                        <div className="inline-flex items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views}</span>
                          <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.comments}</span>
                          {post.featured ? <span className="inline-flex items-center gap-1 text-[#FF6B35]"><Star className="w-3.5 h-3.5 fill-current" /> Vedette</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/blog/${post.slug || post.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#3B82F6]"
                            title="Apercu"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openEditModal(post)}
                            className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#FF6B35]"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDeletePost(post)}
                            disabled={deletingPostId === post.id}
                            className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between bg-white dark:bg-[#1E1E24] rounded-xl border border-[#E5E7EB] dark:border-white/10 px-4 py-3">
          <p className="text-[12px] text-[#9CA3AF]">
            Page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <PostFormModal
          post={editingPost}
          defaultAuthor={defaultAuthor}
          isSubmitting={isSubmitting}
          categories={categories}
          onClose={closeModal}
          onSave={handleSavePost}
        />
      ) : null}
    </div>
  );
}
