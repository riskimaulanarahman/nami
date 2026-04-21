'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CreditCard, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import { TabletActionButton } from './TabletPrimitives';
import { cn } from '@/lib/utils';

type ShiftModalMode = 'open' | 'close';
type CloseStep = 'input' | 'summary';

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
  if (!normalized) return 0;
  return Number(normalized);
}

function formatInputCurrency(value: string): string {
  const amount = parseCurrency(value);
  if (!amount) return '';
  return new Intl.NumberFormat('id-ID').format(amount);
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Summary row component ──────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  tone = 'default',
  bold = false,
  dividerTop = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'strong';
  bold?: boolean;
  dividerTop?: boolean;
}) {
  const valueClass = {
    default:  'text-slate-900 dark:text-white',
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    strong:   'text-slate-950 dark:text-white',
  }[tone];

  return (
    <div className={cn(
      'flex items-center justify-between py-2',
      dividerTop && 'border-t-2 border-slate-200 dark:border-white/10',
      bold && 'py-2.5',
    )}>
      <span className={cn(
        'text-sm text-slate-500 dark:text-slate-400',
        bold && 'font-bold text-slate-700 dark:text-slate-200',
      )}>
        {label}
      </span>
      <span className={cn(
        'text-sm font-semibold tabular-nums',
        valueClass,
        bold && 'text-base font-black',
      )}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CashierShiftModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
  onRequestSwitchStaff,
}: {
  isOpen: boolean;
  mode: ShiftModalMode;
  onClose: () => void;
  onSuccess?: () => void;
  onRequestSwitchStaff?: () => void;
}) {
  const {
    activeCashierShift,
    openCashierShift,
    closeCashierShift,
    currentShiftExpenses,
    tables,
    openBills,
  } = usePos();
  const { currentStaff } = useAuth();

  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [closeStep, setCloseStep] = useState<CloseStep>('input');

  const activeOpenBills = openBills.filter((bill) => bill.status === 'open').length;
  const activeTables    = tables.filter((table) => table.status === 'occupied').length;
  const hasPending      = activeOpenBills > 0 || activeTables > 0;

  // Computed summary values from closingCash input
  const closingCashAmount  = parseCurrency(closingCash);
  const totalExpenses      = activeCashierShift?.totalExpenses ?? 0;
  const expectedCash       = activeCashierShift
    ? activeCashierShift.openingCash + activeCashierShift.cashSales - activeCashierShift.cashRefunds - totalExpenses
    : 0;
  const variance           = closingCashAmount - expectedCash;
  const isVariancePositive = variance >= 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenShift = () => {
    if (!currentStaff) return;
    const amount = parseCurrency(openingCash);
    if (amount < 0 || !Number.isFinite(amount)) {
      setError('Kas awal harus valid.');
      return;
    }
    try {
      openCashierShift({
        staffId: currentStaff.id,
        staffName: currentStaff.name,
        openingCash: amount,
        note: note.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka shift');
    }
  };

  const handlePreviewSummary = () => {
    const amount = parseCurrency(closingCash);
    if (amount < 0 || !Number.isFinite(amount)) {
      setError('Kas fisik akhir harus valid.');
      return;
    }
    setError('');
    setCloseStep('summary');
  };

  const handleConfirmClose = () => {
    try {
      closeCashierShift({
        closingCash: closingCashAmount,
        note: note.trim() || null,
      });
      onSuccess?.();
      onClose();
      onRequestSwitchStaff?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup shift');
      setCloseStep('input');
    }
  };

  if (!isOpen) return null;

  // ── Render: Close Step 2 — Summary ──────────────────────────────────────────

  if (mode === 'close' && closeStep === 'summary' && activeCashierShift) {
    return (
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
            <div className="p-6 pb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Ringkasan Shift
              </p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                Konfirmasi Tutup Shift
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Periksa ringkasan sebelum menutup shift.
              </p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6">

              {/* Staff & time info */}
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="font-bold text-slate-900 dark:text-white">{activeCashierShift.staffName}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(activeCashierShift.openedAt)} → {new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {activeCashierShift.transactionCount} transaksi · {activeCashierShift.refundCount} refund
                </p>
              </div>

              {/* Cash breakdown */}
              <div className="mb-4 rounded-2xl border border-slate-200 px-4 dark:border-white/10">
                <SummaryRow label="Modal Awal"          value={formatRupiah(activeCashierShift.openingCash)} />
                <SummaryRow label="Penjualan Tunai"     value={`+ ${formatRupiah(activeCashierShift.cashSales)}`}     tone="positive" />
                <SummaryRow label="Penjualan Non-Tunai" value={formatRupiah(activeCashierShift.nonCashSales)} />
                <SummaryRow label="Refund Tunai"        value={`− ${formatRupiah(activeCashierShift.cashRefunds)}`}   tone="negative" />
                {totalExpenses > 0 && (
                  <SummaryRow label={`Total Pengeluaran (${currentShiftExpenses.length} item)`} value={`− ${formatRupiah(totalExpenses)}`} tone="negative" />
                )}
                <SummaryRow label="Ekspektasi Kas"      value={formatRupiah(expectedCash)} bold dividerTop />
                <SummaryRow label="Kas Fisik (dihitung)" value={formatRupiah(closingCashAmount)} />
              </div>

              {/* Variance highlight */}
              <div className={cn(
                'mb-5 flex items-center gap-3 rounded-2xl border p-4',
                isVariancePositive
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10',
              )}>
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                  isVariancePositive
                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                    : 'bg-rose-100 dark:bg-rose-500/20',
                )}>
                  {isVariancePositive
                    ? <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    : <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  }
                </div>
                <div>
                  <p className={cn(
                    'text-xs font-bold uppercase tracking-[0.16em]',
                    isVariancePositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}>
                    Selisih Kas — {isVariancePositive ? 'Lebih' : 'Kurang'}
                  </p>
                  <p className={cn(
                    'text-2xl font-black tracking-[-0.02em]',
                    isVariancePositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
                  )}>
                    {formatRupiah(Math.abs(variance))}
                  </p>
                </div>
              </div>

              {/* Note preview */}
              {note.trim() && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Catatan</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{note}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-2 p-6 pt-4">
              <TabletActionButton
                type="button"
                tone="secondary"
                className="justify-center"
                onClick={() => setCloseStep('input')}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </TabletActionButton>
              <TabletActionButton type="button" className="justify-center" onClick={handleConfirmClose}>
                <ShieldCheck className="h-4 w-4" />
                Tutup Shift
              </TabletActionButton>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Render: Step 1 — Input ───────────────────────────────────────────────────

  return (
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
          className="w-full max-w-[560px] rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950"
        >
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Shift Kasir</p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950 dark:text-white">
              {mode === 'open' ? 'Buka Shift' : 'Tutup Shift'}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'open'
                ? 'Masukkan modal kas awal sebelum memulai transaksi.'
                : 'Hitung kas fisik akhir lalu lihat ringkasan sebelum menutup shift.'}
            </p>
          </div>

          {activeCashierShift && mode !== 'open' && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-white">Shift Aktif: {activeCashierShift.staffName}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ekspektasi {formatRupiah(expectedCash)} · Transaksi {activeCashierShift.transactionCount} · Refund {activeCashierShift.refundCount}
                {totalExpenses > 0 && ` · Pengeluaran ${formatRupiah(totalExpenses)}`}
              </p>
            </div>
          )}

          {mode === 'close' && hasPending && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Masih ada transaksi berjalan
              </div>
              <p className="mt-1 text-xs">Meja aktif: {activeTables} · Open bill: {activeOpenBills}</p>
              <p className="mt-1 text-xs">Transaksi ini tetap bisa dilanjutkan setelah login ulang dan buka shift baru.</p>
            </div>
          )}

          <div className="space-y-3">
            {mode === 'open' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kas Awal</label>
                <input
                  value={formatInputCurrency(openingCash)}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            )}

            {mode === 'close' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kas Fisik Akhir</label>
                <input
                  value={formatInputCurrency(closingCash)}
                  onChange={(e) => setClosingCash(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan (Opsional)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}
          </div>

          <div className={`mt-5 grid gap-2 ${onRequestSwitchStaff ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabletActionButton type="button" tone="secondary" className="justify-center" onClick={onClose}>
              Batal
            </TabletActionButton>
            {onRequestSwitchStaff && (
              <TabletActionButton type="button" tone="secondary" className="justify-center" onClick={onRequestSwitchStaff}>
                Ganti Staff
              </TabletActionButton>
            )}
            {mode === 'open' ? (
              <TabletActionButton type="button" className="justify-center" onClick={handleOpenShift}>
                <CreditCard className="h-4 w-4" />
                Buka Shift
              </TabletActionButton>
            ) : (
              <TabletActionButton type="button" className="justify-center" onClick={handlePreviewSummary}>
                <ShieldCheck className="h-4 w-4" />
                Lihat Ringkasan
              </TabletActionButton>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
