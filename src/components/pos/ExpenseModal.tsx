'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Trash2, X } from 'lucide-react';
import { usePos, type CashierShiftExpense, type ExpenseCategory } from '@/context/PosContext';
import { TabletActionButton } from './TabletPrimitives';

// ── Constants ──────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'operational', label: 'Operasional' },
  { value: 'supplies',    label: 'Bahan & Perlengkapan' },
  { value: 'utilities',   label: 'Listrik / Air / Internet' },
  { value: 'transport',   label: 'Transportasi' },
  { value: 'food_staff',  label: 'Konsumsi Karyawan' },
  { value: 'other',       label: 'Lainnya' },
];

const DELETE_REASON_SHORTCUTS = [
  'Salah input',
  'Batal transaksi',
  'Duplikat',
  'Lainnya',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCurrency(input: string): number {
  const normalized = input.replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : 0;
}

function formatInputCurrency(value: string): string {
  const amount = parseCurrency(value);
  if (!amount) return '';
  return new Intl.NumberFormat('id-ID').format(amount);
}

function categoryLabel(cat: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? 'Lainnya';
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────

function DeleteExpenseDialog({
  expense,
  onConfirm,
  onCancel,
}: {
  expense: CashierShiftExpense;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [selectedShortcut, setSelectedShortcut] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  const isCustom = selectedShortcut === 'Lainnya';
  const finalReason = isCustom ? customReason.trim() : selectedShortcut;

  const handleConfirm = () => {
    if (!finalReason) {
      setError('Alasan penghapusan wajib diisi.');
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4 backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0.94, y: 8, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 8, opacity: 0 }}
        className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
            <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h4 className="font-black tracking-[-0.02em] text-slate-950 dark:text-white">Hapus Pengeluaran</h4>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {expense.description} — {formatRupiah(expense.amount)}
            </p>
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Alasan penghapusan</p>

        <div className="mb-3 flex flex-wrap gap-2">
          {DELETE_REASON_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut}
              type="button"
              onClick={() => { setSelectedShortcut(shortcut); setError(''); }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedShortcut === shortcut
                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/15 dark:text-rose-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
              }`}
            >
              {shortcut}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {isCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                value={customReason}
                onChange={(e) => { setCustomReason(e.target.value); setError(''); }}
                placeholder="Tulis alasan lainnya..."
                className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <TabletActionButton type="button" tone="secondary" className="justify-center" onClick={onCancel}>
            Batal
          </TabletActionButton>
          <TabletActionButton type="button" tone="danger" className="justify-center" onClick={handleConfirm}>
            <Trash2 className="h-4 w-4" />
            Hapus
          </TabletActionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ExpenseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { activeCashierShift, currentShiftExpenses, addShiftExpense, deleteShiftExpense } = usePos();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('operational');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<CashierShiftExpense | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const totalExpenses = currentShiftExpenses.reduce((sum, e) => sum + e.amount, 0);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('operational');
    setFormError('');
  };

  const handleAdd = async () => {
    const parsedAmount = parseCurrency(amount);
    if (parsedAmount <= 0) {
      setFormError('Jumlah pengeluaran harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setFormError('Keterangan pengeluaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await addShiftExpense(parsedAmount, description.trim(), category);
      resetForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal mencatat pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!deletingExpense) return;
    setIsDeletingId(deletingExpense.id);
    setDeletingExpense(null);
    try {
      await deleteShiftExpense(deletingExpense.id, reason);
    } catch (e) {
      console.error('delete expense failed:', e);
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            className="flex max-h-[90dvh] w-full max-w-[560px] flex-col rounded-[28px] border border-white/10 bg-white shadow-2xl dark:bg-slate-950"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Shift Kasir</p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                  Catat Pengeluaran
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Catat pengeluaran kas selama shift berlangsung.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* No shift warning */}
              {!activeCashierShift && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Tidak ada shift aktif. Buka shift terlebih dahulu.
                </div>
              )}

              {/* Add form */}
              {activeCashierShift && (
                <div className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Tambah Pengeluaran
                  </p>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kategori</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Keterangan</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setFormError(''); }}
                      placeholder="cth: beli es batu, bayar parkir..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Jumlah</label>
                    <input
                      value={formatInputCurrency(amount)}
                      onChange={(e) => { setAmount(e.target.value); setFormError(''); }}
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  {formError && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {formError}
                    </p>
                  )}

                  <TabletActionButton
                    type="button"
                    className="w-full justify-center"
                    onClick={handleAdd}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Menyimpan...' : '+ Tambah Pengeluaran'}
                  </TabletActionButton>
                </div>
              )}

              {/* Expense list */}
              {currentShiftExpenses.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      Pengeluaran Shift Ini
                    </p>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {formatRupiah(totalExpenses)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {currentShiftExpenses.map((expense) => (
                      <motion.div
                        key={expense.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: isDeletingId === expense.id ? 0.4 : 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {expense.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {categoryLabel(expense.category)} · {expense.staffName}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-slate-950 dark:text-white">
                          {formatRupiah(expense.amount)}
                        </p>
                        {activeCashierShift && expense.cashierShiftId === activeCashierShift.id && (
                          <button
                            type="button"
                            disabled={isDeletingId === expense.id}
                            onClick={() => setDeletingExpense(expense)}
                            className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                activeCashierShift && (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center dark:border-white/10">
                    <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada pengeluaran dicatat.</p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Delete confirm dialog — rendered on top */}
      <AnimatePresence>
        {deletingExpense && (
          <DeleteExpenseDialog
            expense={deletingExpense}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingExpense(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
