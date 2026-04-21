'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Check, Search, Tag, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem, RecipeItem } from '@/context/PosContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
  food: { color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15 border-orange-500/20', label: 'Makanan' },
  drink: { color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-500/20', label: 'Minuman' },
  snack: { color: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/15 border-pink-500/20', label: 'Snack' },
};

interface FormData {
  name: string;
  category: MenuItem['category'];
  categoryId: string;
  price: number;
  cost: number;
  emoji: string;
  description: string;
  recipe: RecipeItem[];
  isAvailable: boolean;
}

const emptyForm: FormData = {
  name: '', category: 'food', categoryId: 'cat-1', price: 0, cost: 0,
  emoji: '🍽️', description: '', recipe: [], isAvailable: true,
};

// ============================================================
// Category Tab Content
// ============================================================
function CategoryTab() {
  const { categories, addCategory, updateCategory, deleteCategory, menuItems } = usePos();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');

  const getCategoryItemCount = (catId: string) => menuItems.filter((m) => m.categoryId === catId).length;

  const resetCatForm = () => {
    setFormName('');
    setFormEmoji('');
    setFormDesc('');
    setFormError('');
  };

  const handleAdd = () => {
    if (!formName.trim()) {
      const message = 'Nama kategori wajib diisi.';
      setFormError(message);
      toast({ title: 'Kategori belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    addCategory({
      name: formName.trim(),
      emoji: formEmoji || '📦',
      description: formDesc.trim(),
      isActive: true,
    });
    resetCatForm();
    setShowForm(false);
    toast({
      title: 'Kategori ditambahkan',
      description: `${formName.trim()} berhasil ditambahkan.`,
    });
  };

  const handleEdit = (cat: typeof categories[0]) => {
    setFormName(cat.name);
    setFormEmoji(cat.emoji);
    setFormDesc(cat.description);
    setEditingId(cat.id);
    setShowForm(false);
    setFormError('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !formName.trim()) {
      const message = 'Nama kategori wajib diisi.';
      setFormError(message);
      toast({ title: 'Perubahan kategori belum valid', description: message, variant: 'destructive' });
      return;
    }
    updateCategory(editingId, {
      name: formName.trim(),
      emoji: formEmoji || '📦',
      description: formDesc.trim(),
    });
    setEditingId(null);
    resetCatForm();
    toast({
      title: 'Kategori diperbarui',
      description: 'Perubahan kategori berhasil disimpan.',
    });
  };

  const handleToggleActive = (cat: typeof categories[0]) => {
    updateCategory(cat.id, { isActive: !cat.isActive });
    toast({
      title: cat.isActive ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan',
      description: `${cat.name} sekarang ${cat.isActive ? 'nonaktif' : 'aktif'}.`,
    });
  };

  const handleDelete = (id: string) => {
    const itemCount = getCategoryItemCount(id);
    const category = categories.find((cat) => cat.id === id);
    if (itemCount > 0) {
      toast({
        title: 'Kategori tidak bisa dihapus',
        description: 'Masih ada menu yang memakai kategori ini.',
        variant: 'destructive',
      });
      return;
    }
    deleteCategory(id);
    setDeleteConfirm(null);
    toast({
      title: 'Kategori dihapus',
      description: `${category?.name ?? 'Kategori'} berhasil dihapus.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} kategori</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowForm(true); resetCatForm(); setEditingId(null); }}
          className="px-3.5 py-2 rounded-[12px] text-sm font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </motion.button>
      </div>

      {/* Add Form */}
      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {formError}
        </div>
      ) : null}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 p-4 space-y-3 overflow-hidden"
          >
            <h4 className="text-sm font-bold text-foreground">Tambah Kategori Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Emoji (contoh: 🍔)"
                value={formEmoji}
                onChange={(e) => setFormEmoji(e.target.value)}
                className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Nama kategori"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Deskripsi"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Simpan
              </button>
              <button onClick={() => { setShowForm(false); resetCatForm(); }} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20 flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Batal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {categories.map((cat, idx) => {
            const isEditing = editingId === cat.id;
            const itemCount = getCategoryItemCount(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.03 * idx }}
                className={cn(
                  'rounded-xl border p-4',
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10',
                  !cat.isActive && 'opacity-50',
                )}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formEmoji}
                        onChange={(e) => setFormEmoji(e.target.value)}
                        className="w-12 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="😊"
                      />
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="flex-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Nama"
                      />
                    </div>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Deskripsi"
                    />
                    <div className="flex gap-1">
                      <button onClick={handleSaveEdit} className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400">Simpan</button>
                      <button onClick={() => { setEditingId(null); resetCatForm(); }} className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20">Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{cat.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(cat)} className="p-1 rounded-lg bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20">
                          <Pencil className="h-3 w-3" />
                        </button>
                        {itemCount === 0 ? (
                          deleteConfirm === cat.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(cat.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">Y</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-foreground text-[10px]">T</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(cat.id)} className="p-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground" title="Tidak bisa dihapus">
                            {itemCount} item
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs text-muted-foreground">{itemCount} menu item</span>
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={cn(
                          'flex items-center gap-1 text-xs font-semibold',
                          cat.isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'
                        )}
                      >
                        {cat.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {cat.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// AdminMenu Component
// ============================================================
export default function AdminMenu() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, categories, ingredients } = usePos();
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<'menu' | 'category'>('menu');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [menuFormError, setMenuFormError] = useState('');

  const filtered = useMemo(() => menuItems.filter((item) => {
    if (activeTab !== 'all' && item.categoryId !== activeTab) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [menuItems, activeTab, search]);

  // Calculate cost from recipe
  const calculatedCost = useMemo(() => {
    return form.recipe.reduce((total, ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      if (!ing) return total;
      return total + ing.unitCost * ri.quantity;
    }, 0);
  }, [form.recipe, ingredients]);

  const handleAdd = () => {
    if (!form.name.trim()) {
      const message = 'Nama menu wajib diisi.';
      setMenuFormError(message);
      toast({ title: 'Menu belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    if (!form.categoryId) {
      const message = 'Kategori menu wajib dipilih.';
      setMenuFormError(message);
      toast({ title: 'Menu belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    if (form.price <= 0) {
      const message = 'Harga jual harus lebih dari 0.';
      setMenuFormError(message);
      toast({ title: 'Menu belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    addMenuItem({
      id: `item-${Date.now()}`,
      ...form,
      cost: calculatedCost || form.cost,
    });
    const savedName = form.name.trim();
    setForm(emptyForm);
    setShowForm(false);
    setShowRecipeEditor(false);
    setMenuFormError('');
    toast({
      title: 'Menu ditambahkan',
      description: `${savedName} berhasil ditambahkan ke daftar menu.`,
    });
  };

  const handleEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      category: item.category,
      categoryId: item.categoryId,
      price: item.price,
      cost: item.cost,
      emoji: item.emoji,
      description: item.description,
      recipe: [...item.recipe],
      isAvailable: item.isAvailable,
    });
    setEditingId(item.id);
    setShowForm(false);
    setShowRecipeEditor(false);
    setMenuFormError('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name.trim()) {
      const message = 'Nama menu wajib diisi.';
      setMenuFormError(message);
      toast({ title: 'Perubahan menu belum valid', description: message, variant: 'destructive' });
      return;
    }
    if (form.price <= 0) {
      const message = 'Harga jual harus lebih dari 0.';
      setMenuFormError(message);
      toast({ title: 'Perubahan menu belum valid', description: message, variant: 'destructive' });
      return;
    }
    updateMenuItem(editingId, {
      ...form,
      cost: calculatedCost || form.cost,
    });
    setEditingId(null);
    setForm(emptyForm);
    setShowRecipeEditor(false);
    setMenuFormError('');
    toast({
      title: 'Menu diperbarui',
      description: 'Perubahan menu berhasil disimpan.',
    });
  };

  const handleDelete = (id: string) => {
    const menu = menuItems.find((item) => item.id === id);
    deleteMenuItem(id);
    setDeleteConfirm(null);
    toast({
      title: 'Menu dihapus',
      description: `${menu?.name ?? 'Menu'} berhasil dihapus.`,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowRecipeEditor(false);
    setMenuFormError('');
  };

  const addRecipeItem = () => {
    if (ingredients.length === 0) {
      toast({
        title: 'Bahan baku belum tersedia',
        description: 'Tambahkan bahan di Inventaris sebelum membuat resep menu.',
        variant: 'destructive',
      });
      return;
    }
    const firstIng = ingredients.find((i) => !form.recipe.some((r) => r.ingredientId === i.id)) || ingredients[0];
    setForm((f) => ({
      ...f,
      recipe: [...f.recipe, { ingredientId: firstIng.id, quantity: 1 }],
    }));
  };

  const removeRecipeItem = (idx: number) => {
    setForm((f) => ({
      ...f,
      recipe: f.recipe.filter((_, i) => i !== idx),
    }));
  };

  const updateRecipeItem = (idx: number, field: 'ingredientId' | 'quantity', value: string | number) => {
    setForm((f) => ({
      ...f,
      recipe: f.recipe.map((r, i) => i === idx ? { ...r, [field]: value } : r),
    }));
  };

  const toggleAvailable = (item: MenuItem) => {
    updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    toast({
      title: item.isAvailable ? 'Menu disembunyikan' : 'Menu ditampilkan',
      description: `${item.name} sekarang ${item.isAvailable ? 'tidak tersedia' : 'tersedia'} untuk kasir.`,
    });
  };

  // Sync category when selecting
  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    const catMap: Record<string, MenuItem['category']> = { 'cat-1': 'food', 'cat-2': 'drink', 'cat-3': 'snack' };
    let catType: MenuItem['category'] = 'food';
    if (cat) {
      catType = catMap[cat.id] || 'food';
    }
    setForm((f) => ({ ...f, categoryId: catId, category: catType }));
  };

  const mainTabs = [
    { id: 'menu' as const, label: 'Menu Makanan & Minuman', icon: <Search className="h-4 w-4" /> },
    { id: 'category' as const, label: 'Kategori', icon: <Tag className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Main Tabs */}
      <div className="flex items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              mainTab === tab.id
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {mainTab === 'category' ? (
          <CategoryTab />
        ) : (
          <>
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    activeTab === 'all'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                  )}
                >
                  Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      activeTab === cat.id
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                    )}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-48"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowForm(true);
                    setForm({ ...emptyForm, categoryId: categories[0]?.id || 'cat-1' });
                    setEditingId(null);
                    setShowRecipeEditor(false);
                  }}
                  className="px-3.5 py-2 rounded-[12px] text-sm font-semibold bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </motion.button>
              </div>
            </div>
            {menuFormError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {menuFormError}
              </div>
            ) : null}

            {/* Add Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 p-4 space-y-3 overflow-hidden"
                >
                  <h4 className="text-sm font-bold text-foreground">Tambah Menu Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Nama menu"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <select
                      value={form.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Harga jual"
                      value={form.price || ''}
                      onChange={(e) => setForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                      className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Emoji"
                      value={form.emoji}
                      onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                      className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Deskripsi"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />

                  {/* Recipe Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowRecipeEditor(!showRecipeEditor)}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-500 dark:text-emerald-400"
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showRecipeEditor && 'rotate-180')} />
                        Resep / Bahan Baku ({form.recipe.length} item)
                      </button>
                      <button
                        onClick={addRecipeItem}
                        className="text-xs text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Tambah Bahan
                      </button>
                    </div>
                    {showRecipeEditor && (
                      <div className="space-y-2">
                        {form.recipe.map((ri, idx) => {
                          const ing = ingredients.find((i) => i.id === ri.ingredientId);
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={ri.ingredientId}
                                onChange={(e) => updateRecipeItem(idx, 'ingredientId', e.target.value)}
                                className="flex-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                {ingredients.map((i) => (
                                  <option key={i.id} value={i.id}>{i.name} ({formatRupiah(i.unitCost)}/{i.unit})</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={ri.quantity || ''}
                                onChange={(e) => updateRecipeItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.1}
                                className="w-20 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              />
                              <span className="text-xs text-muted-foreground w-8">{ing?.unit || ''}</span>
                              <button onClick={() => removeRecipeItem(idx)} className="p-1 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                        {form.recipe.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            HPP otomatis: <span className="font-semibold text-foreground">{formatRupiah(calculatedCost)}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cost & Margin Preview */}
                  {form.price > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        HPP: <span className="text-amber-500 dark:text-amber-400 font-semibold">{formatRupiah(calculatedCost || form.cost)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Margin: <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{formatRupiah(form.price - (calculatedCost || form.cost))}</span>
                      </span>
                      <span className="text-muted-foreground">
                        % Margin: <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{form.price > 0 ? Math.round(((form.price - (calculatedCost || form.cost)) / form.price) * 100) : 0}%</span>
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Simpan
                    </button>
                    <button onClick={cancelForm} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20 flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {filtered.map((item, idx) => {
                  const config = categoryConfig[item.category];
                  const isEditing = editingId === item.id;
                  const margin = item.price - item.cost;
                  const marginPct = item.price > 0 ? Math.round((margin / item.price) * 100) : 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: 0.03 * idx }}
                      className={cn(
                        'rounded-xl border p-4',
                        'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10',
                        'hover:border-gray-300 dark:hover:border-white/20 transition-colors',
                        !item.isAvailable && 'opacity-60',
                      )}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={form.emoji}
                              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                              className="w-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                            <input
                              type="text"
                              value={form.name}
                              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                              className="flex-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={form.categoryId}
                              onChange={(e) => handleCategoryChange(e.target.value)}
                              className="flex-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={form.price || ''}
                              onChange={(e) => setForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                              className="w-24 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              placeholder="Harga"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={handleSaveEdit} className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400">Simpan</button>
                            <button onClick={cancelForm} className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20">Batal</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{item.emoji}</span>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleAvailable(item)}
                                className={cn('p-1 rounded-lg', item.isAvailable ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400')}
                                title={item.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
                              >
                                {item.isAvailable ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                              </button>
                              <button onClick={() => handleEdit(item)} className="p-1 rounded-lg bg-gray-200 dark:bg-white/10 text-foreground hover:bg-gray-300 dark:hover:bg-white/20">
                                <Pencil className="h-3 w-3" />
                              </button>
                              {deleteConfirm === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(item.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">Y</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-foreground text-[10px]">T</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(item.id)} className="p-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Cost / Margin Row */}
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">HPP</p>
                              <p className="text-xs font-semibold text-amber-500 dark:text-amber-400">{formatRupiah(item.cost)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">Margin</p>
                              <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{formatRupiah(margin)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground">% Margin</p>
                              <p className={cn('text-xs font-semibold', marginPct >= 50 ? 'text-emerald-500 dark:text-emerald-400' : marginPct >= 30 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400')}>
                                {marginPct}%
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', config.color, config.bg)}>
                              {config.label}
                            </span>
                            <span className="text-sm font-bold text-foreground">{formatRupiah(item.price)}</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Tidak ada menu ditemukan
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
