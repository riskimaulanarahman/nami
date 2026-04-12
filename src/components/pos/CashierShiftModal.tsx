'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import { TabletActionButton } from './TabletPrimitives';

type ShiftModalMode = 'open' | 'close';

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

export default function CashierShiftModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
  onRequestLogout,
}: {
  isOpen: boolean;
  mode: ShiftModalMode;
  onClose: () => void;
  onSuccess?: () => void;
  onRequestLogout?: () => void;
}) {
  const {
    activeCashierShift,
    openCashierShift,
    closeCashierShift,
    tables,
    openBills,
  } = usePos();
  const { currentStaff } = useAuth();

  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState(
    mode === 'open' ? '' : String(Math.max(0, activeCashierShift?.expectedCash ?? 0))
  );
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const activeOpenBills = openBills.filter((bill) => bill.status === 'open').length;
  const activeTables = tables.filter((table) => table.status === 'occupied').length;
  const hasPending = activeOpenBills > 0 || activeTables > 0;

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

  const handleCloseShift = () => {
    const amount = parseCurrency(closingCash);
    if (amount < 0 || !Number.isFinite(amount)) {
      setError('Kas fisik akhir harus valid.');
      return;
    }
    try {
      closeCashierShift({
        closingCash: amount,
        note: note.trim() || null,
      });
      onSuccess?.();
      onClose();
      onRequestLogout?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup shift');
    }
  };

  if (!isOpen) return null;

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
                : 'Hitung kas fisik akhir untuk menutup shift. Setelah sukses Anda akan kembali ke halaman login.'}
            </p>
          </div>

          {activeCashierShift && mode !== 'open' && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-white">Shift Aktif: {activeCashierShift.staffName}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Kas teoritis {formatRupiah(activeCashierShift.expectedCash)} • Transaksi {activeCashierShift.transactionCount} • Refund {activeCashierShift.refundCount}
              </p>
            </div>
          )}

          {mode === 'close' && hasPending && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Masih ada transaksi berjalan
              </div>
              <p className="mt-1 text-xs">Meja aktif: {activeTables} • Open bill: {activeOpenBills}</p>
              <p className="mt-1 text-xs">Transaksi ini tetap bisa dilanjutkan setelah login ulang dan buka shift baru.</p>
            </div>
          )}

          <div className="space-y-3">
            {mode === 'open' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kas Awal</label>
                <input
                  value={formatInputCurrency(openingCash)}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            )}

            {mode === 'close' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kas Fisik Akhir</label>
                <input
                  value={formatInputCurrency(closingCash)}
                  onChange={(event) => setClosingCash(event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan (Opsional)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}
          </div>

          <div className={`mt-5 grid gap-2 ${onRequestLogout ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabletActionButton type="button" tone="secondary" className="justify-center" onClick={onClose}>
              Batal
            </TabletActionButton>
            {onRequestLogout && (
              <TabletActionButton type="button" tone="secondary" className="justify-center" onClick={onRequestLogout}>
                Keluar
              </TabletActionButton>
            )}
            {mode === 'open' ? (
              <TabletActionButton type="button" className="justify-center" onClick={handleOpenShift}>
                <CreditCard className="h-4 w-4" />
                Buka Shift
              </TabletActionButton>
            ) : (
              <TabletActionButton type="button" className="justify-center" onClick={handleCloseShift}>
                <ShieldCheck className="h-4 w-4" />
                Tutup Shift
              </TabletActionButton>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
