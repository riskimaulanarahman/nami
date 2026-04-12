'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Edit3,
  History,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePos } from '@/context/PosContext';
import type { Ingredient, IngredientUnit } from '@/context/PosContext';
import { cn } from '@/lib/utils';
import {
  paginateItems,
  TabletActionButton,
  TabletChip,
  TabletDialogShell,
  TabletEmptyState,
  TabletMetricCard,
  TabletPage,
  TabletPagination,
  TabletPanel,
  TabletScrollArea,
  TabletSectionHeader,
} from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const UNIT_LABELS: Record<IngredientUnit, string> = {
  pcs: 'Pcs',
  kg: 'Kg',
  gram: 'Gram',
  liter: 'Liter',
  ml: 'ml',
  sendok: 'Sendok',
  bungkus: 'Bungkus',
  porsi: 'Porsi',
  botol: 'Botol',
};

const REASONS = ['Restok harian', 'Stock opname', 'Kadaluarsa', 'Rusak/hilang', 'Lainnya'];
const ITEM_PAGE_SIZE = 8;
const LOG_PAGE_SIZE = 6;
type AdjustableIngredient = Ingredient & { _forceType?: 'in' | 'out' };

export default function AdminInventory() {
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
    lowStockIngredients,
    stockAdjustments,
  } = usePos();
  const { currentStaff } = useAuth();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [adjustingIng, setAdjustingIng] = useState<AdjustableIngredient | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [ingredientPage, setIngredientPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ingredients;
    return ingredients.filter((ingredient) => ingredient.name.toLowerCase().includes(query));
  }, [ingredients, search]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return stockAdjustments;
    return stockAdjustments.filter((adjustment) => adjustment.type === logFilter);
  }, [stockAdjustments, logFilter]);

  const ingredientPagination = paginateItems(filteredIngredients, ingredientPage, ITEM_PAGE_SIZE);
  const logPagination = paginateItems(filteredLogs, logPage, LOG_PAGE_SIZE);

  const totalValue = useMemo(
    () => ingredients.reduce((sum, ingredient) => sum + ingredient.stock * ingredient.unitCost, 0),
    [ingredients]
  );

  return (
    <TabletPage
      eyebrow="Operations"
      title="Inventaris Bahan Baku"
      subtitle="Kontrol stok, nilai inventaris, dan histori adjustment dalam satu workspace tablet."
      actions={
        <>
          <TabletActionButton tone="secondary" onClick={() => setShowLog((current) => !current)}>
            <History className="h-4 w-4" />
            {showLog ? 'Tutup Log' : 'Buka Log'}
          </TabletActionButton>
          <TabletActionButton onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Tambah Bahan
          </TabletActionButton>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <TabletMetricCard
          icon={Package}
          label="Item"
          value={`${ingredients.length}`}
          subtext="Total bahan baku"
          tone="info"
        />
        <TabletMetricCard
          icon={AlertTriangle}
          label="Low Stock"
          value={`${lowStockIngredients.length}`}
          subtext={lowStockIngredients.length > 0 ? 'Perlu restock segera' : 'Semua aman'}
          tone={lowStockIngredients.length > 0 ? 'critical' : 'success'}
        />
        <TabletMetricCard
          icon={DollarSign}
          label="Valuation"
          value={formatRupiah(totalValue)}
          subtext="Estimasi nilai inventaris"
          tone="warning"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.28fr_0.92fr] gap-3">
        <TabletPanel className="flex min-h-0 flex-col overflow-hidden">
          <TabletSectionHeader
            icon={Package}
            title="Daftar Bahan"
            subtitle="Cari, edit, restock, atau koreksi stok dari satu panel."
            actions={
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari bahan..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setIngredientPage(1);
                  }}
                  className="w-[160px] rounded-[12px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
                />
              </div>
            }
          />

          {ingredientPagination.items.length === 0 ? (
            <TabletEmptyState
              title="Bahan tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau tambahkan bahan baku baru."
              className="min-h-[240px] flex-1"
            />
          ) : (
            <>
              <TabletScrollArea className="space-y-2">
                {ingredientPagination.items.map((ingredient) => {
                  const isLow = ingredient.stock <= ingredient.minStock;
                  const totalItemValue = ingredient.stock * ingredient.unitCost;

                  return (
                    <div
                      key={ingredient.id}
                      className={cn(
                        'flex items-center gap-3 rounded-[16px] border px-3.5 py-2.5',
                        isLow
                          ? 'border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10'
                          : 'border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                            {ingredient.name}
                          </p>
                          {isLow && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                              low
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              Stok
                            </p>
                            <p
                              className={cn(
                                'text-sm font-black',
                                isLow ? 'text-rose-600 dark:text-rose-300' : 'text-slate-950 dark:text-white'
                              )}
                            >
                              {ingredient.stock} {UNIT_LABELS[ingredient.unit]}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              Unit Cost
                            </p>
                            <p className="text-sm font-bold text-slate-950 dark:text-white">
                              {formatRupiah(ingredient.unitCost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              Nilai
                            </p>
                            <p className="text-sm font-bold text-slate-950 dark:text-white">
                              {formatRupiah(totalItemValue)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Minimum {ingredient.minStock} {UNIT_LABELS[ingredient.unit]}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setAdjustingIng(ingredient)}
                          className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          title="Restock"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAdjustingIng({ ...ingredient, _forceType: 'out' as const })}
                          className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                          title="Kurangi"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingIng(ingredient)}
                          className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus ${ingredient.name}?`)) deleteIngredient(ingredient.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </TabletScrollArea>
              <div className="pt-3">
                <TabletPagination
                  page={ingredientPagination.page}
                  totalPages={ingredientPagination.totalPages}
                  onPageChange={setIngredientPage}
                />
              </div>
            </>
          )}
        </TabletPanel>

        <div className="grid min-h-0 gap-3">
          <TabletPanel>
            <TabletSectionHeader
              icon={AlertTriangle}
              title="Prioritas Restock"
              subtitle="Item yang sudah menyentuh batas minimum."
            />
            {lowStockIngredients.length === 0 ? (
              <TabletEmptyState
                title="Semua stok aman"
                description="Belum ada bahan yang melewati batas minimum."
                className="min-h-[210px]"
              />
            ) : (
              <div className="space-y-2">
                {lowStockIngredients.slice(0, 4).map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => setAdjustingIng(ingredient)}
                    className="flex w-full items-center justify-between rounded-[16px] border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-left dark:border-rose-500/20 dark:bg-rose-500/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                        {ingredient.name}
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-300">
                        {ingredient.stock} {UNIT_LABELS[ingredient.unit]} tersisa
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
                      Restock
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabletPanel>

          <TabletPanel className="flex min-h-0 flex-col overflow-hidden">
            <TabletSectionHeader
              icon={History}
              title="Log Adjustment"
              subtitle="Riwayat stok masuk, keluar, dan koreksi."
              actions={
                <div className="flex gap-2">
                  {(['all', 'in', 'out', 'adjustment'] as const).map((filter) => (
                    <TabletChip
                      key={filter}
                      active={logFilter === filter}
                      onClick={() => {
                        setLogFilter(filter);
                        setLogPage(1);
                      }}
                    >
                      {filter === 'all'
                        ? 'Semua'
                        : filter === 'in'
                          ? 'Masuk'
                          : filter === 'out'
                            ? 'Keluar'
                            : 'Koreksi'}
                    </TabletChip>
                  ))}
                </div>
              }
            />

            {!showLog ? (
              <TabletEmptyState
                title="Log disembunyikan"
                description="Gunakan tombol Buka Log di header untuk melihat histori adjustment."
                className="min-h-[220px]"
              />
            ) : logPagination.items.length === 0 ? (
              <TabletEmptyState
                title="Belum ada histori"
                description="Adjustment stok akan muncul otomatis setelah transaksi manual."
                className="min-h-[220px]"
              />
            ) : (
              <>
                <TabletScrollArea className="space-y-2">
                  {logPagination.items.map((adjustment) => {
                    const ingredient = ingredients.find((item) => item.id === adjustment.ingredientId);
                    return (
                      <div
                        key={adjustment.id}
                        className="rounded-[16px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                              {ingredient?.name ?? 'Bahan'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(adjustment.createdAt).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                              adjustment.type === 'in'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : adjustment.type === 'out'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                            )}
                          >
                            {adjustment.type}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{adjustment.reason}</span>
                          <span>
                            {adjustment.previousStock} → {adjustment.newStock}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </TabletScrollArea>
                <div className="pt-3">
                  <TabletPagination
                    page={logPagination.page}
                    totalPages={logPagination.totalPages}
                    onPageChange={setLogPage}
                  />
                </div>
              </>
            )}
          </TabletPanel>
        </div>
      </div>

      <AnimatePresence>
        {(showAddModal || editingIng) && (
          <IngredientFormModal
            ingredient={editingIng}
            onSave={(data) => {
              if (editingIng) {
                updateIngredient(editingIng.id, data);
              } else {
                addIngredient(data as Omit<Ingredient, 'id' | 'lastRestocked'>);
              }
              setShowAddModal(false);
              setEditingIng(null);
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditingIng(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adjustingIng && (
          <StockAdjustModal
            ingredient={adjustingIng}
            staffName={currentStaff?.name ?? 'Admin'}
            onAdjust={(type, quantity, reason) => {
              adjustStock(adjustingIng.id, type, quantity, reason, currentStaff?.name ?? 'Admin');
              setAdjustingIng(null);
            }}
            onClose={() => setAdjustingIng(null)}
          />
        )}
      </AnimatePresence>
    </TabletPage>
  );
}

function IngredientFormModal({
  ingredient,
  onSave,
  onClose,
}: {
  ingredient: Ingredient | null;
  onSave: (data: Partial<Ingredient>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(ingredient?.name ?? '');
  const [unit, setUnit] = useState<IngredientUnit>(ingredient?.unit ?? 'pcs');
  const [stock, setStock] = useState(String(ingredient?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(ingredient?.minStock ?? 0));
  const [unitCost, setUnitCost] = useState(String(ingredient?.unitCost ?? 0));

  const inputClass =
    'w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition-colors focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      unit,
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
      unitCost: parseFloat(unitCost) || 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(event) => event.stopPropagation()}
      >
        <TabletDialogShell width="narrow">
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                  Inventory Form
                </p>
                <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                  {ingredient ? 'Edit Bahan' : 'Tambah Bahan'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama bahan"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as IngredientUnit)}
                  className={inputClass}
                >
                  {Object.entries(UNIT_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  min="0"
                  step="any"
                  placeholder="Stok awal"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={minStock}
                  onChange={(event) => setMinStock(event.target.value)}
                  min="0"
                  step="any"
                  placeholder="Batas minimum"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  min="0"
                  step="any"
                  placeholder="Harga per satuan"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <TabletActionButton type="button" tone="secondary" className="flex-1" onClick={onClose}>
                  Batal
                </TabletActionButton>
                <TabletActionButton type="submit" className="flex-1">
                  Simpan
                </TabletActionButton>
              </div>
            </form>
          </div>
        </TabletDialogShell>
      </motion.div>
    </motion.div>
  );
}

function StockAdjustModal({
  ingredient,
  onAdjust,
  onClose,
}: {
  ingredient: AdjustableIngredient;
  staffName: string;
  onAdjust: (type: 'in' | 'out' | 'adjustment', qty: number, reason: string) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>(ingredient._forceType ?? 'in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(REASONS[0]);

  const inputClass =
    'w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition-colors focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return;
    onAdjust(type, qty, reason);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(event) => event.stopPropagation()}
      >
        <TabletDialogShell width="narrow">
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                  Stock Action
                </p>
                <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                  Adjustment Stok
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-[16px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-bold text-slate-950 dark:text-white">{ingredient.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stok saat ini {ingredient.stock} {UNIT_LABELS[ingredient.unit]}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['in', 'Masuk'],
                  ['out', 'Keluar'],
                  ['adjustment', 'Koreksi'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      'rounded-[12px] border px-3 py-2 text-sm font-semibold transition-colors',
                      type === value
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                min="0"
                step="any"
                placeholder={`Jumlah (${UNIT_LABELS[ingredient.unit]})`}
                className={inputClass}
              />
              <select value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass}>
                {REASONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <TabletActionButton type="button" tone="secondary" className="flex-1" onClick={onClose}>
                  Batal
                </TabletActionButton>
                <TabletActionButton type="submit" className="flex-1">
                  Konfirmasi
                </TabletActionButton>
              </div>
            </form>
          </div>
        </TabletDialogShell>
      </motion.div>
    </motion.div>
  );
}
