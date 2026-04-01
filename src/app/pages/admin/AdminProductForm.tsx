import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, Upload, ImageIcon, ArrowLeft, Loader2, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import {
  AdminProduct,
  BrandRef,
  CategoryRef,
  getProduct,
  getReferences,
  createProduct,
  updateProduct
} from "../../api/adminProducts";

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<BrandRef[]>([]);
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    brand_id: 0,
    category_id: 0,
    price: "",
    oldPrice: "",
    stock: "0",
    status: "active",
    energy: "A+",
    specs: "",
    description: "",
  });

  const [images, setImages] = useState<{file: File | null, url: string}[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const refs = await getReferences();
        setBrands(refs.brands);
        setCategories(refs.categories);

        if (!isEdit && refs.brands.length > 0 && refs.categories.length > 0) {
          setForm(prev => ({
            ...prev,
            brand_id: refs.brands[0].id,
            category_id: refs.categories[0].id
          }));
        }

        if (isEdit) {
          const product = await getProduct(Number(id));
          setForm({
            name: product.name || "",
            sku: product.sku || "",
            brand_id: product.brand_id || (refs.brands.length > 0 ? refs.brands[0].id : 0),
            category_id: product.category_id || (refs.categories.length > 0 ? refs.categories[0].id : 0),
            price: product.price?.toString() || "",
            oldPrice: product.oldPrice?.toString() || "",
            stock: product.stock?.toString() || "0",
            status: product.status || "active",
            energy: product.energy || "A+",
            specs: product.specs || "",
            description: product.description || "",
          });

          setImages(
            product.images && product.images.length > 0 
              ? product.images.map(url => ({ file: null, url }))
              : product.image ? [{ file: null, url: product.image }] : []
          );
        }
      } catch (e: any) {
        toast.error(e.message || "Erreur de chargement");
        navigate("/admin/produits");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const set = (key: keyof typeof form, value: any) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.brand_id || !form.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const data = new FormData();
    data.append("name", form.name);
    data.append("sku", form.sku);
    data.append("brand_id", form.brand_id.toString());
    data.append("category_id", form.category_id.toString());
    data.append("price", form.price);
    if (form.oldPrice) data.append("oldPrice", form.oldPrice);
    data.append("stock", form.stock);
    data.append("status", form.status);
    data.append("energy", form.energy);
    data.append("specs", form.specs);
    data.append("description", form.description);

    const newFiles = images.filter(img => img.file).map(img => img.file as File);
    if (newFiles.length > 0) {
      newFiles.forEach(file => data.append("image_files[]", file));
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateProduct(Number(id), data);
        toast.success("Produit mis à jour avec succès");
      } else {
        await createProduct(data);
        toast.success("Produit ajouté avec succès");
      }
      navigate("/admin/produits");
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/admin/produits")} 
          className="w-10 h-10 rounded-xl border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:bg-[#F3F4F6] dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>
            {isEdit ? "Modifier le produit" : "Ajouter un nouveau produit"}
          </h1>
          <p className="text-[13px] text-[#6B7280] dark:text-white/50 mt-1">
            Remplissez les informations ci-dessous pour {isEdit ? "mettre à jour ce" : "publier un"} produit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-5">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Nom du produit *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="Ex: Réfrigérateur Multi-Portes" />
              </div>
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>SKU</label>
                <input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="Ex: SAM-RF23-001" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors resize-y" placeholder="Description détaillée du produit..." />
            </div>

            <div>
              <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Spécifications techniques</label>
              <input value={form.specs} onChange={(e) => set("specs", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="634L, No Frost, A+++" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-5">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Images du produit</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-[#D1D5DB] dark:border-white/30 text-[13px] text-[#6B7280] dark:text-white/70 hover:border-[#FF6B35] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all w-full justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Sélectionner des images
                </button>
              </div>
              <p className="text-[12px] text-[#9CA3AF] text-center">Formats acceptés : PNG, JPG, WEBP. Taille max : 2MB.</p>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4 bg-[#F9FAFB] dark:bg-white/5 p-4 rounded-xl border border-[#E5E7EB] dark:border-white/10">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-xl bg-white dark:bg-[#1E1E24] shadow-sm border border-[#E5E7EB] dark:border-white/10 overflow-hidden shrink-0 group">
                      <img src={img.url} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 shadow-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {idx === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm text-white text-[9px] py-1 text-center font-medium">Image principale</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Controls) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-5">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Prix & Stock</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Prix (DA) *</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[12px]">DA</span>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="w-full px-4 pr-10 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="189000" />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Ancien prix barré (DA)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[12px]">DA</span>
                  <input type="number" value={form.oldPrice} onChange={(e) => set("oldPrice", e.target.value)} className="w-full px-4 pr-10 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="232000" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Quantité en stock *</label>
                <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors" placeholder="24" min="0" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-5">
            <h2 className="text-[15px] text-[#1A2332] dark:text-white" style={{ fontWeight: 600 }}>Classification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Statut</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
                  <option value="active">Actif (Publié)</option>
                  <option value="draft">Brouillon (Caché)</option>
                  <option value="outofstock">En rupture de stock</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Marque *</label>
                <select value={form.brand_id} onChange={(e) => set("brand_id", Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Catégorie *</label>
                <select value={form.category_id} onChange={(e) => set("category_id", Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#6B7280] dark:text-white/50 mb-1.5" style={{ fontWeight: 500 }}>Classe énergétique</label>
                <select value={form.energy} onChange={(e) => set("energy", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#1A2332] dark:text-white outline-none focus:border-[#FF6B35] transition-colors">
                  {["A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"].map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Fixed Action Bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[260px] bg-white/80 dark:bg-[#1E1E24]/80 backdrop-blur-md border-t border-[#E5E7EB] dark:border-white/10 p-4 px-6 flex justify-end gap-3 z-50">
        <button 
          onClick={() => navigate("/admin/produits")} 
          disabled={isSubmitting} 
          className="px-6 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-white/10 text-[13px] text-[#6B7280] dark:text-white/70 hover:bg-[#F3F4F6] dark:hover:bg-white/5 transition-colors disabled:opacity-50" 
          style={{ fontWeight: 500 }}
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white text-[13px] hover:bg-[#E55A2B] shadow-lg shadow-[#FF6B35]/20 transition-all disabled:opacity-50"
          style={{ fontWeight: 600 }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Enregistrer les modifications" : "Publier le produit"}
        </button>
      </div>
    </div>
  );
}