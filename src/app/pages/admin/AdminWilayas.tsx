import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, X, Check, Loader2, Scale } from "lucide-react";
import {
  getWilayas,
  createWilaya,
  updateWilaya,
  deleteWilaya,
  getWeightPricings,
  createWeightPricing,
  updateWeightPricing,
  deleteWeightPricing,
  type Wilaya,
  type WeightPricing,
} from "../../api/adminWilayas";

type WilayaFormState = {
  name: string;
  delivery_price: string;
  delivery_price_agency: string;
  is_active: boolean;
};

type WeightFormState = {
  max_weight_kg: string;
  price: string;
};

const emptyWilayaForm: WilayaFormState = {
  name: "",
  delivery_price: "",
  delivery_price_agency: "",
  is_active: true,
};

const emptyWeightForm: WeightFormState = {
  max_weight_kg: "",
  price: "",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " DA";
}

// ─── Sub-page: Wilayas ────────────────────────────────────────────────────

function WilayasTab() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WilayaFormState>(emptyWilayaForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setWilayas(await getWilayas());
    } catch {
      toast.error("Impossible de charger les wilayas.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyWilayaForm);
    setShowForm(true);
  }

  function openEdit(w: Wilaya) {
    setEditingId(w.id);
    setForm({
      name: w.name,
      delivery_price: w.delivery_price.toString(),
      delivery_price_agency: w.delivery_price_agency.toString(),
      is_active: w.is_active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyWilayaForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Le nom de la wilaya est obligatoire."); return; }
    const price = parseFloat(form.delivery_price);
    const priceAgency = parseFloat(form.delivery_price_agency);
    if (isNaN(price) || price < 0) { toast.error("Prix domicile invalide."); return; }
    if (isNaN(priceAgency) || priceAgency < 0) { toast.error("Prix bureau agence invalide."); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        delivery_price: price,
        delivery_price_agency: priceAgency,
        is_active: form.is_active,
      };
      if (editingId) {
        const updated = await updateWilaya(editingId, payload);
        setWilayas((prev) => prev.map((w) => (w.id === editingId ? updated : w)));
        toast.success("Wilaya mise à jour.");
      } else {
        const created = await createWilaya(payload);
        setWilayas((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Wilaya ajoutée.");
      }
      closeForm();
    } catch (err: any) {
      const firstError = err.errors ? Object.values(err.errors as Record<string, string[]>)[0]?.[0] : undefined;
      toast.error(firstError || err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette wilaya ?")) return;
    setDeletingId(id);
    try {
      await deleteWilaya(id);
      setWilayas((prev) => prev.filter((w) => w.id !== id));
      toast.success("Wilaya supprimée.");
    } catch (err: any) {
      toast.error(err.message || "Impossible de supprimer.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = wilayas.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une wilaya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8400C] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Ajouter une wilaya
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Modifier la wilaya" : "Ajouter une wilaya"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wilaya *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ex: Alger, Oran, Constantine..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix livraison à domicile (DA) *
                </label>
                <input
                  type="number" min="0" step="50"
                  value={form.delivery_price}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_price: e.target.value }))}
                  placeholder="ex: 400"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix livraison au bureau de l'agence (DA) *
                </label>
                <input
                  type="number" min="0" step="50"
                  value={form.delivery_price_agency}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_price_agency: e.target.value }))}
                  placeholder="ex: 250"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.is_active ? "bg-[#E8400C]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {form.is_active ? "Active (visible au checkout)" : "Désactivée"}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#E8400C] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-sm text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {search ? "Aucune wilaya trouvée" : "Aucune wilaya configurée"}
            </p>
            {!search && <p className="text-xs text-gray-400 mt-1">Ajoutez des wilayas pour activer le calcul de livraison par région.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Wilaya</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Livraison domicile</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Bureau agence</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Statut</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#E8400C] shrink-0" />
                        {w.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-300">{formatPrice(w.delivery_price)}</td>
                    <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-300">{formatPrice(w.delivery_price_agency)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${w.is_active ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {w.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#E8400C] hover:bg-[#E8400C]/5 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(w.id)} disabled={deletingId === w.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40">
                          {deletingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-page: Prix par poids ─────────────────────────────────────────────

function WeightPricingsTab() {
  const [tiers, setTiers] = useState<WeightPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WeightFormState>(emptyWeightForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setTiers(await getWeightPricings());
    } catch {
      toast.error("Impossible de charger les tarifs poids.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyWeightForm);
    setShowForm(true);
  }

  function openEdit(t: WeightPricing) {
    setEditingId(t.id);
    setForm({ max_weight_kg: t.max_weight_kg.toString(), price: t.price.toString() });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyWeightForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weight = parseFloat(form.max_weight_kg);
    const price = parseFloat(form.price);
    if (isNaN(weight) || weight <= 0) { toast.error("Le poids doit être supérieur à 0."); return; }
    if (isNaN(price) || price < 0) { toast.error("Le prix est invalide."); return; }

    setSubmitting(true);
    try {
      const payload = { max_weight_kg: weight, price };
      if (editingId) {
        const updated = await updateWeightPricing(editingId, payload);
        setTiers((prev) => prev.map((t) => (t.id === editingId ? updated : t)).sort((a, b) => a.max_weight_kg - b.max_weight_kg));
        toast.success("Palier mis à jour.");
      } else {
        const created = await createWeightPricing(payload);
        setTiers((prev) => [...prev, created].sort((a, b) => a.max_weight_kg - b.max_weight_kg));
        toast.success("Palier ajouté.");
      }
      closeForm();
    } catch (err: any) {
      const firstError = err.errors ? Object.values(err.errors as Record<string, string[]>)[0]?.[0] : undefined;
      toast.error(firstError || err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce palier de poids ?")) return;
    setDeletingId(id);
    try {
      await deleteWeightPricing(id);
      setTiers((prev) => prev.filter((t) => t.id !== id));
      toast.success("Palier supprimé.");
    } catch (err: any) {
      toast.error(err.message || "Impossible de supprimer.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Définissez les frais supplémentaires selon le poids total de la commande. Le palier le plus bas couvrant le poids est appliqué.
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8400C] text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Ajouter un palier
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Modifier le palier" : "Ajouter un palier"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poids maximum (kg) *
                </label>
                <input
                  type="number" min="0.1" step="0.5"
                  value={form.max_weight_kg}
                  onChange={(e) => setForm((f) => ({ ...f, max_weight_kg: e.target.value }))}
                  placeholder="ex: 5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">Ce tarif s'applique aux commandes jusqu'à ce poids</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frais supplémentaires (DA) *
                </label>
                <input
                  type="number" min="0" step="50"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="ex: 200"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8400C]/30"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#E8400C] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-sm text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement...
          </div>
        ) : tiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Scale className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun palier de poids configuré</p>
            <p className="text-xs text-gray-400 mt-1">Ajoutez des paliers pour facturer selon le poids des commandes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Poids maximum</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Prix par poids</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {tiers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#E8400C] shrink-0" />
                        {idx === 0 ? `≤ ${t.max_weight_kg} kg` : `${tiers[idx - 1].max_weight_kg} – ${t.max_weight_kg} kg`}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-300">{formatPrice(t.price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#E8400C] hover:bg-[#E8400C]/5 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40">
                          {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page with tabs ──────────────────────────────────────────────────

type Tab = "wilayas" | "weight";

export function AdminWilayas() {
  const [activeTab, setActiveTab] = useState<Tab>("wilayas");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Wilayas &amp; Tarifs de livraison
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Gérez les wilayas, les prix de livraison et les tarifs selon le poids.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("wilayas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "wilayas"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Wilayas
        </button>
        <button
          onClick={() => setActiveTab("weight")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "weight"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <Scale className="w-4 h-4" />
          Prix par poids
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "wilayas" ? <WilayasTab /> : <WeightPricingsTab />}
    </div>
  );
}

