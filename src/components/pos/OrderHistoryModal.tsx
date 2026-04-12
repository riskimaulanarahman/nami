'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Clock,
  UtensilsCrossed,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  CircleDot,
  Crown,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import type { OrderHistory } from '@/context/PosContext';
import PrintReceipt from './PrintReceipt';

// ============================================================
// Format currency
// ============================================================
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h}j`;
  return `${m}m`;
}

// ============================================================
// Filter type
// ============================================================
type FilterType = 'all' | 'completed' | 'refunded';
type SessionFilter = 'all' | 'billiard' | 'cafe';

// ============================================================
// OrderHistoryModal Component
// ============================================================
export default function OrderHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { orderHistory, refundOrder, settings, canTransact } = usePos();
  const { currentStaff, verifyAdminPin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [filterSession, setFilterSession] = useState<SessionFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<OrderHistory | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundStep, setRefundStep] = useState<'auth-choice' | 'pin' | 'email' | 'confirm' | 'reason' | 'success' | 'email-sent'>('auth-choice');
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [printTarget, setPrintTarget] = useState<OrderHistory | null>(null);
  const isAdmin = currentStaff?.role === 'admin';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !refundTarget && !printTarget) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, refundTarget, printTarget]);

  // Filter orders
  const filteredOrders = orderHistory.filter((order) => {
    if (filterStatus === 'completed' && order.status !== 'completed') return false;
    if (filterStatus === 'refunded' && order.status !== 'refunded') return false;
    if (filterSession === 'billiard' && order.sessionType !== 'billiard') return false;
    if (filterSession === 'cafe' && order.sessionType !== 'cafe') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.tableName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.servedBy.toLowerCase().includes(q) ||
        order.orders.some((o) => o.menuItem.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalRevenue = orderHistory
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.grandTotal, 0);
  const totalRefunded = orderHistory
    .filter((o) => o.status === 'refunded')
    .reduce((s, o) => s + o.grandTotal, 0);

  const handleRefund = () => {
    if (!refundTarget || !currentStaff) return;
    if (!canTransact) {
      setPinError('Buka shift kasir terlebih dahulu untuk refund.');
      return;
    }
    refundOrder(refundTarget.id, refundReason, { id: currentStaff.id, name: currentStaff.name });
    setRefundStep('success');
  };

  const handleCloseRefund = () => {
    setRefundTarget(null);
    setRefundReason('');
    setRefundStep('auth-choice');
    setPinValue('');
    setPinError('');
    setEmailValue('');
  };

  const handleOpenRefund = (order: OrderHistory) => {
    setRefundTarget(order);
    setRefundReason('');
    setPinValue('');
    setPinError('');
    setEmailValue('');
    if (isAdmin) {
      setRefundStep('confirm');
    } else {
      setRefundStep('auth-choice');
    }
  };

  const handlePinVerify = () => {
    if (verifyAdminPin(pinValue)) {
      setRefundStep('confirm');
      setPinError('');
    } else {
      setPinError('PIN admin salah. Coba lagi atau pilih kirim email.');
    }
  };

  const handleSendEmail = () => {
    // Simulate sending email to owner
    setRefundStep('email-sent');
  };

  const handleClosePrint = () => {
    setPrintTarget(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          {/* ---- Refund Flow Overlay ---- */}
          <AnimatePresence>
            {refundTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-60 flex items-center justify-center bg-black/80"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-[520px] mx-4 overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94"
                >
                  {/* Step: Auth Choice (for kasir) */}
                  {refundStep === 'auth-choice' && (
                    <div className="p-6 space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center mb-3">
                          <ShieldCheck className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Verifikasi Diperlukan</h3>
                        <p className="text-sm text-muted-foreground mt-1">Refund memerlukan otorisasi admin/owner.</p>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => { setRefundStep('pin'); setPinValue(''); setPinError(''); }}
                          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="h-5 w-5" />
                          Masukkan PIN Admin/Owner
                        </button>
                        <button
                          onClick={() => { setRefundStep('email'); setEmailValue(''); }}
                          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Mail className="h-5 w-5" />
                          Kirim Email ke Owner
                        </button>
                      </div>
                      <button
                        onClick={handleCloseRefund}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {/* Step: PIN Verification */}
                  {refundStep === 'pin' && (
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Masukkan PIN Admin</h3>
                        <p className="text-sm text-muted-foreground mt-1">Minta admin/owner memasukkan PIN mereka.</p>
                      </div>
                      <div>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={pinValue}
                          onChange={(e) => { setPinValue(e.target.value); setPinError(''); }}
                          placeholder="PIN Admin"
                          className={cn(
                            'w-full rounded-lg border px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all',
                            pinError
                              ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 focus:ring-red-500/50'
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-blue-500/50'
                          )}
                          autoFocus
                        />
                        {pinError && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{pinError}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setRefundStep('auth-choice')}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                        >
                          Kembali
                        </button>
                        <button
                          onClick={handlePinVerify}
                          disabled={pinValue.length < 4}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step: Email */}
                  {refundStep === 'email' && (
                    <div className="p-6 space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center mb-3">
                          <Mail className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Kirim Permintaan ke Owner</h3>
                        <p className="text-sm text-muted-foreground mt-1">Email notifikasi akan dikirim ke owner untuk persetujuan refund.</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-3 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">Pesanan</span>
                          <span className="font-semibold text-foreground">{refundTarget.tableName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">Total</span>
                          <span className="font-bold text-foreground">{formatRupiah(refundTarget.grandTotal)}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleSendEmail}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Mail className="h-5 w-5" />
                        Kirim Email Permintaan Refund
                      </button>
                      <button
                        onClick={() => setRefundStep('auth-choice')}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        Kembali
                      </button>
                    </div>
                  )}

                  {/* Step: Email Sent */}
                  {refundStep === 'email-sent' && (
                    <div className="p-6 space-y-4 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center"
                      >
                        <Mail className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Email Terkirim!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permintaan refund untuk <span className="font-semibold text-foreground">{refundTarget.tableName}</span> telah dikirim ke owner.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Menunggu persetujuan owner. Owner dapat melakukan refund dari menu Riwayat Pesanan.
                        </p>
                      </div>
                      <button
                        onClick={handleCloseRefund}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  )}

                  {/* Step: Confirm */}
                  {refundStep === 'confirm' && (
                    <div className="p-6 space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center mb-3">
                          <AlertTriangle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Konfirmasi Refund</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Yakin ingin refund pesanan dari <span className="font-semibold text-foreground">{refundTarget.tableName}</span>?
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Waktu</span>
                          <span className="font-semibold text-foreground">{formatDate(refundTarget.createdAt)} {formatTime(refundTarget.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{formatRupiah(refundTarget.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dilayani</span>
                          <span className="font-semibold text-foreground">{refundTarget.servedBy}</span>
                        </div>
                        {refundTarget.paymentMethodName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bayar via</span>
                            <span className="font-semibold text-foreground">{refundTarget.paymentMethodName}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-red-500 dark:text-red-400 text-center">
                        Stok bahan akan dikembalikan secara otomatis.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleCloseRefund}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => setRefundStep('reason')}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Lanjutkan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step: Reason */}
                  {refundStep === 'reason' && (
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Alasan Refund</h3>
                        <p className="text-sm text-muted-foreground mt-1">Berikan alasan refund untuk catatan.</p>
                      </div>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Contoh: Pesanan salah, customer tidak puas, dll..."
                        rows={3}
                        className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none transition-all"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setRefundStep('confirm')}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                        >
                          Kembali
                        </button>
                        <button
                          onClick={handleRefund}
                          disabled={!refundReason.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Refund Sekarang
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step: Success */}
                  {refundStep === 'success' && (
                    <div className="p-6 space-y-4 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Refund Berhasil!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pesanan <span className="font-semibold text-foreground">{refundTarget.tableName}</span> telah di-refund.
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                          -{formatRupiah(refundTarget.grandTotal)}
                        </p>
                      </div>
                      <button
                        onClick={handleCloseRefund}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Print Overlay ---- */}
          <AnimatePresence>
            {printTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-60 flex items-center justify-center bg-black/80"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-full max-w-[520px] mx-4 rounded-[30px] border border-white/70 bg-white/96 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 space-y-4"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🧾</div>
                    <h3 className="text-lg font-bold text-foreground">Cetak Struk</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(printTarget.grandTotal)}</span>
                    </p>
                    {printTarget.status === 'refunded' && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">⚠️ Struk refund</p>
                    )}
                  </div>
                  <PrintReceipt order={printTarget} settings={settings} paperSize={settings.paperSize} />
                  <button
                    onClick={handleClosePrint}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold bg-gray-100 dark:bg-white/10 text-foreground hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                  >
                    Selesai
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Main Modal ---- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-[1120px] overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Riwayat Pesanan</h2>
                    <p className="text-xs text-muted-foreground">{orderHistory.length} transaksi tercatat</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </motion.button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Pendapatan</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalRevenue)}</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase">Refund</p>
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">{formatRupiah(totalRefunded)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Bersih</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatRupiah(totalRevenue - totalRefunded)}</p>
                </div>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 space-y-3 border-b border-gray-100 dark:border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari meja, kasir, menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {/* Status filters */}
                {(['all', 'completed', 'refunded'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors border',
                      filterStatus === f
                        ? f === 'all'
                          ? 'bg-gray-800 dark:bg-white/20 text-white dark:text-white border-gray-800 dark:border-white/20'
                          : f === 'completed'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-red-500 text-white border-red-500'
                        : 'bg-white dark:bg-white/5 text-muted-foreground border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                    )}
                  >
                    {f === 'all' ? 'Semua' : f === 'completed' ? '✓ Selesai' : '↩ Refund'}
                  </button>
                ))}
                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />
                {/* Session filters */}
                {(['all', 'billiard', 'cafe'] as SessionFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterSession(f)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors border',
                      filterSession === f
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-white/5 text-muted-foreground border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                    )}
                  >
                    {f === 'all' ? 'Semua Sesi' : f === 'billiard' ? '🎱 Billiard' : '🍽️ Cafe'}
                  </button>
                ))}
              </div>
            </div>

            {/* Order List */}
            <div className="px-6 py-3">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Belum ada pesanan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery ? 'Tidak ditemukan hasil untuk pencarian ini.' : 'Pesanan akan muncul di sini setelah checkout.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedId === order.id;
                    const isRefunded = order.status === 'refunded';

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        className={cn(
                          'rounded-xl border transition-colors overflow-hidden',
                          isRefunded
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-500/20'
                            : 'bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10'
                        )}
                      >
                        {/* Order Header Row */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          {/* Session type icon */}
                          <div className={cn(
                            'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            order.sessionType === 'cafe'
                              ? 'bg-orange-100 dark:bg-orange-500/15'
                              : order.tableType === 'vip'
                              ? 'bg-amber-100 dark:bg-amber-500/15'
                              : 'bg-blue-100 dark:bg-blue-500/15'
                          )}>
                            {order.sessionType === 'cafe' ? (
                              <UtensilsCrossed className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            ) : order.tableType === 'vip' ? (
                              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <CircleDot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground truncate">
                                {order.tableName}
                              </span>
                              {isRefunded && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">
                                  Refund
                                </span>
                              )}
                              {!isRefunded && order.sessionType === 'billiard' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase">
                                  Selesai
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
                              <span>•</span>
                              <span>{order.servedBy}</span>
                              {order.sessionType === 'billiard' && order.durationMinutes > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(order.durationMinutes)}</span>
                                </>
                              )}
                            </div>
                            {order.isContinuedFromPreviousShift && (
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300">
                                Transaksi Sebelumnya{order.originStaffName ? ` • ${order.originStaffName}` : ''}
                              </p>
                            )}
                          </div>

                          {/* Total + Expand */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={cn(
                              'text-sm font-bold',
                              isRefunded ? 'text-red-500 dark:text-red-400 line-through' : 'text-foreground'
                            )}>
                              {formatRupiah(order.grandTotal)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-gray-200 dark:border-white/5 px-4 py-3 space-y-3">
                                {/* Items */}
                                {order.orders.length > 0 && (
                                  <div className="space-y-1.5">
                                    {order.orders.map((item) => (
                                      <div
                                        key={item.menuItem.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">{item.menuItem.emoji}</span>
                                          <span className="text-foreground">{item.menuItem.name}</span>
                                          <span className="text-muted-foreground text-xs">x{item.quantity}</span>
                                        </div>
                                        <span className="font-semibold text-foreground">{formatRupiah(item.subtotal)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Bill breakdown */}
                                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3 space-y-1.5 text-xs">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Kasir terlibat</span>
                                    <span className="font-semibold text-foreground">{order.involvedStaffNames.join(' -> ')}</span>
                                  </div>
                                  {order.sessionType === 'billiard' && (
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>Sewa Meja ({formatDuration(order.durationMinutes)})</span>
                                      <span>{formatRupiah(order.rentalCost)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Pesanan ({order.orders.length} item)</span>
                                    <span>{formatRupiah(order.orderTotal)}</span>
                                  </div>
                                  <div className="border-t border-gray-200 dark:border-white/10 pt-1.5 flex justify-between text-sm font-bold text-foreground">
                                    <span>Total</span>
                                    <span>{formatRupiah(order.grandTotal)}</span>
                                  </div>
                                </div>

                                {/* Refund info */}
                                {isRefunded && (
                                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-red-600 dark:text-red-400 font-semibold">Refund oleh</span>
                                      <span className="font-semibold text-foreground">{order.refundedBy}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-red-600 dark:text-red-400 font-semibold">Waktu refund</span>
                                      <span className="text-foreground">
                                        {order.refundedAt ? `${formatDate(order.refundedAt)} ${formatTime(order.refundedAt)}` : '-'}
                                      </span>
                                    </div>
                                    {order.refundReason && (
                                      <div>
                                        <span className="text-red-600 dark:text-red-400 font-semibold">Alasan:</span>
                                        <p className="text-foreground mt-0.5">{order.refundReason}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrintTarget(order);
                                    }}
                                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    🧾 Cetak Struk
                                  </button>
                                  {!isRefunded && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenRefund(order);
                                      }}
                                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                      Refund{!isAdmin ? ' (PIN)' : ''}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/80">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Menampilkan {filteredOrders.length} dari {orderHistory.length} pesanan
                </p>
                {orderHistory.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Hanya admin dapat melakukan refund
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
