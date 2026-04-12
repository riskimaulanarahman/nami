'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  X,
  Play,
  ShoppingBag,
  Receipt,
  Clock,
  CreditCard,
  Crown,
  Search,
  Timer,
  CheckCircle2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import type { BilliardBillingMode, OrderHistory, PaymentOption } from '@/context/PosContext';
import PrintReceipt from './PrintReceipt';
import MenuList from './MenuList';
import OrderSummary from './OrderSummary';

// ============================================================
// Overlay & Modal Animation Variants
// ============================================================
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

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

// ============================================================
// ActionModal Component
// ============================================================
export default function ActionModal() {
  const {
    tables,
    activeModalTableId,
    setActiveModalTableId,
    startSession,
    endSession,
    endSessionWithHistory,
    formatElapsed,
    calculateTableBill,
    updateOrderItemQuantity,
    canTransact,
    activeCashierShift,
    settings,
    paymentOptions,
    activePaymentOptions,
    activeBilliardPackages,
  } = usePos();

  const { currentStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'order' | 'bill'>('order');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderHistory | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [pinError, setPinError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedBillingMode, setSelectedBillingMode] = useState<BilliardBillingMode>('open-bill');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const table = tables.find((t) => t.id === activeModalTableId);
  const isOpen = activeModalTableId !== null && !showSuccess && !lastOrder;
  const isCarryoverTransaction = Boolean(
    table &&
    table.status === 'occupied' &&
    table.originCashierShiftId &&
    activeCashierShift &&
    table.originCashierShiftId !== activeCashierShift.id
  );

  // Reset internal state when a new table is opened
  useEffect(() => {
    if (activeModalTableId !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('order');
      setSearchQuery('');
      setShowPayment(false);
      setShowCancelConfirm(false);
      setSelectedPayment(null);
      setPaymentRef('');
      setPinError('');
      setSelectedBillingMode('open-bill');
      setSelectedPackageId(activeBilliardPackages[0]?.id ?? '');
      setExpandedPaymentId(null);
    }
  }, [activeModalTableId]);

  const handleClose = () => {
    if (showCancelConfirm) { setShowCancelConfirm(false); return; }
    if (showPayment) { setShowPayment(false); return; }
    setActiveModalTableId(null);
  };

  const handleStartSession = () => {
    if (!canTransact) return;
    if (activeModalTableId !== null) {
      startSession(activeModalTableId, 'billiard', {
        billingMode: selectedBillingMode,
        packageId: selectedBillingMode === 'package' ? selectedPackageId : null,
      });
    }
  };

  const handleOpenPayment = () => {
    setShowPayment(true);
    setSelectedPayment(null);
    setPaymentRef('');
    setPinError('');
    setExpandedPaymentId(null);
  };

  const handleConfirmPayment = () => {
    if (activeModalTableId === null || !selectedPayment || !currentStaff) return;
    if (!canTransact) {
      setPinError('Buka shift kasir terlebih dahulu untuk memproses pembayaran.');
      return;
    }
    if (selectedPayment.requiresReference && !paymentRef.trim()) return;

    const ref = selectedPayment.requiresReference ? paymentRef.trim() : null;
    const history = endSessionWithHistory(
      activeModalTableId,
      { id: currentStaff.id, name: currentStaff.name },
      selectedPayment.id, resolvePaymentMethodName(selectedPayment), ref
    );
    setShowPayment(false);
    setLastOrder(history);
  };

  const handleCancelSession = () => {
    if (activeModalTableId !== null) {
      endSession(activeModalTableId);
    }
    setShowCancelConfirm(false);
  };

  const handleDone = () => {
    setLastOrder(null);
    setActiveModalTableId(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (lastOrder) return;
      handleClose();
    }
  };

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lastOrder) return;
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastOrder]);

  if (!table && !lastOrder) return null;

  const bill = table?.status === 'occupied' ? calculateTableBill(table) : null;
  const orderQuantityByItemId = table
    ? Object.fromEntries(table.orders.map((order) => [order.menuItem.id, order.quantity]))
    : {};
  const isVip = table?.type === 'vip';
  const selectedPackage = activeBilliardPackages.find((pkg) => pkg.id === selectedPackageId) ?? null;
  const canStartSession = selectedBillingMode === 'open-bill' || Boolean(selectedPackage);
  const paymentChildren = paymentOptions.filter((option) => option.isActive && option.parentId !== null);
  const resolvePaymentMethodName = (payment: PaymentOption): string => {
    if (!payment.parentId) return payment.name;
    const parent = paymentOptions.find((option) => option.id === payment.parentId);
    return parent ? `${parent.name} ${payment.name}` : payment.name;
  };

  // ---- Post-payment success screen (stays open) ----
  if (lastOrder) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 flex flex-col"
          >
            {/* Success Header */}
            <div className="flex-shrink-0 px-6 py-6 text-center border-b border-gray-200 dark:border-white/10 bg-emerald-50 dark:bg-emerald-500/5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-3"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Pembayaran Berhasil!</h3>
              <p className="text-sm text-muted-foreground mt-1">{lastOrder.tableName} — {formatRupiah(lastOrder.grandTotal)}</p>
              {lastOrder.sessionType === 'billiard' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastOrder.billiardBillingMode === 'package'
                    ? `${lastOrder.selectedPackageName ?? 'Paket Jam'}${lastOrder.selectedPackageHours > 0 ? ` • ${lastOrder.selectedPackageHours} jam` : ''}`
                    : 'Open Bill / Prorata'}
                </p>
              )}
              {lastOrder.paymentMethodName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  via {lastOrder.paymentMethodName}{lastOrder.paymentReference ? ` • ${lastOrder.paymentReference}` : ''}
                </p>
              )}
            </div>

            {/* Order details + actions */}
            <div className="px-6 py-5 space-y-4">
              {/* Quick order summary */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3 space-y-1.5 text-sm">
                {lastOrder.sessionType === 'billiard' && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{lastOrder.billiardBillingMode === 'package' ? (lastOrder.selectedPackageName ?? 'Paket Jam') : 'Open Bill / Prorata'}</span>
                    <span>{formatRupiah(lastOrder.rentalCost)}</span>
                  </div>
                )}
                {lastOrder.orders.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-foreground">
                    <span>{item.menuItem.emoji} {item.menuItem.name} x{item.quantity}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-white/10 pt-1.5 flex justify-between font-bold text-base text-foreground">
                  <span>Total</span>
                  <span>{formatRupiah(lastOrder.grandTotal)}</span>
                </div>
              </div>

              {/* Print receipt */}
              <PrintReceipt order={lastOrder} settings={settings} paperSize={settings.paperSize} />
            </div>

            {/* Done button */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/80">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDone}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-base transition-all',
                  'bg-gradient-to-r from-emerald-600 to-emerald-500',
                  'hover:from-emerald-500 hover:to-emerald-400',
                  'text-white shadow-lg shadow-emerald-500/20',
                  'flex items-center justify-center gap-2'
                )}
              >
                <CheckCircle2 className="h-5 w-5" />
                SELESAI
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ---- Payment method selection (overlay) ----
  return (
    <AnimatePresence>
      {isOpen && table && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden p-4 bg-black/70 backdrop-blur-sm touch-pan-y sm:items-center"
        >
          {/* Payment Selection Overlay */}
          <AnimatePresence>
            {showPayment && (
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
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full max-w-[520px] mx-4 overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94"
                >
                  {/* Payment header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Metode Pembayaran</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Pilih metode pembayaran customer</p>
                      </div>
                      <button
                        onClick={() => setShowPayment(false)}
                        className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4 text-foreground" />
                      </button>
                    </div>
                    {/* Total */}
                    <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2.5 text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Total Tagihan</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{bill ? formatRupiah(bill.grandTotal) : '-'}</p>
                    </div>
                  </div>

                  {/* Payment options grid */}
                  <div className="px-4 py-3 space-y-2">
                    {activePaymentOptions.map((pm) => {
                      const childOptions = paymentChildren.filter((child) => child.parentId === pm.id);
                      const selectedChild = childOptions.find((child) => child.id === selectedPayment?.id) ?? null;
                      const isSelected = selectedPayment?.id === pm.id || Boolean(selectedChild);
                      const isExpanded = expandedPaymentId === pm.id;
                      return (
                        <div key={pm.id} className="space-y-2">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (pm.isGroup) {
                                setExpandedPaymentId((prev) => prev === pm.id ? null : pm.id);
                                setSelectedPayment(null);
                                setPaymentRef('');
                                setPinError('');
                                return;
                              }
                              setSelectedPayment(pm);
                              setExpandedPaymentId(null);
                              setPaymentRef('');
                              setPinError('');
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/50'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                            )}
                          >
                            <span className="text-2xl flex-shrink-0">{pm.icon}</span>
                            <div className="flex-1">
                              <p className={cn('text-sm font-bold', isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>{pm.name}</p>
                              {selectedChild && (
                                <p className="text-xs text-muted-foreground">Dipilih: {selectedChild.name}</p>
                              )}
                              {!selectedChild && pm.requiresReference && (
                                <p className="text-xs text-muted-foreground">{pm.referenceLabel}</p>
                              )}
                              {pm.isGroup && childOptions.length > 0 && (
                                <p className="text-xs text-muted-foreground">{childOptions.length} sub opsi</p>
                              )}
                            </div>
                            <ChevronRight className={cn('h-4 w-4 flex-shrink-0 transition-transform', isExpanded ? 'rotate-90 text-emerald-500' : isSelected ? 'text-emerald-500' : 'text-muted-foreground')} />
                          </motion.button>
                          {pm.isGroup && isExpanded && childOptions.length > 0 && (
                            <div className="pl-4 space-y-2">
                              {childOptions.map((child) => {
                                const isChildSelected = selectedPayment?.id === child.id;
                                return (
                                  <button
                                    key={child.id}
                                    onClick={() => {
                                      setSelectedPayment(child);
                                      setPaymentRef('');
                                      setPinError('');
                                    }}
                                    className={cn(
                                      'w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                                      isChildSelected
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border-gray-200 dark:border-white/10 text-foreground hover:border-gray-300 dark:hover:border-white/20'
                                    )}
                                  >
                                    {pm.name} {child.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reference input */}
                  <AnimatePresence>
                    {selectedPayment?.requiresReference && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3">
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            {selectedPayment.referenceLabel}
                          </label>
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => { setPaymentRef(e.target.value); setPinError(''); }}
                            placeholder={selectedPayment.referenceLabel}
                            className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                          />
                          {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm button */}
                  <div className="px-4 pb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!selectedPayment) return;
                        if (selectedPayment.requiresReference && !paymentRef.trim()) {
                          setPinError(`${selectedPayment.referenceLabel} wajib diisi`);
                          return;
                        }
                        setPinError('');
                        handleConfirmPayment();
                      }}
                      disabled={!selectedPayment}
                      className={cn(
                        'w-full py-3 rounded-xl font-bold text-base transition-all',
                        'bg-gradient-to-r from-emerald-600 to-emerald-500',
                        'hover:from-emerald-500 hover:to-emerald-400',
                        'text-white shadow-lg shadow-emerald-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'flex items-center justify-center gap-2'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      KONFIRMASI PEMBAYARAN
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel Session Confirmation Overlay */}
          <AnimatePresence>
            {showCancelConfirm && (
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
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full max-w-[520px] mx-4 overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94"
                >
                  <div className="px-6 py-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                      <X className="h-7 w-7 text-red-500 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Batalkan Sesi?</h3>
                    <p className="text-sm text-muted-foreground">
                      Sesi billiard untuk <span className="font-semibold text-foreground">{table?.name}</span> akan dibatalkan. Semua pesanan akan dihapus dan meja kembali ke status kosong.
                    </p>
                    {table && table.orders.length > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-semibold">
                        ⚠️ {table.orders.length} pesanan akan ikut terhapus
                      </p>
                    )}
                  </div>
                  <div className="px-6 pb-5 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCancelConfirm(false)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all',
                        'bg-gray-100 dark:bg-white/10 text-foreground',
                        'hover:bg-gray-200 dark:hover:bg-white/20',
                        'border border-gray-200 dark:border-white/10'
                      )}
                    >
                      Kembali
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelSession}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all',
                        'bg-gradient-to-r from-red-600 to-red-500',
                        'hover:from-red-500 hover:to-red-400',
                        'text-white shadow-lg shadow-red-500/20',
                        'flex items-center justify-center gap-2'
                      )}
                    >
                      <X className="h-4 w-4" />
                      Ya, Batalkan
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: 'min(960px, calc(100vw - 2rem))' }}
            className={cn(
              'relative w-full max-w-full max-h-[calc(100vh-2rem)] overflow-hidden rounded-[30px] border shadow-[0_28px_80px_rgba(15,23,42,0.28)]',
              'border-white/70 bg-white/96 backdrop-blur dark:border-white/10 dark:bg-slate-950/94',
              'flex flex-col min-h-0'
            )}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center',
                      isVip
                        ? 'bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30'
                        : 'bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10'
                    )}
                  >
                    {isVip ? (
                      <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Timer className="h-5 w-5 text-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{table.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {isVip ? 'VIP Room' : 'Meja Standar'} &middot; {formatRupiah(table.hourlyRate)}/jam
                      {table.status === 'occupied' && table.billingMode === 'open-bill' ? ' · Open Bill / Prorata' : ''}
                      {table.status === 'occupied' && table.billingMode === 'package' && table.selectedPackageName ? ` · ${table.selectedPackageName}` : ''}
                      {table.status === 'reserved' ? ' · Reserved dari waiting list' : ''}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </motion.button>
              </div>

              {/* Timer */}
              {table.status === 'occupied' && table.startTime && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-1.5">
                    <Clock className="h-4 w-4 text-red-500 dark:text-red-400 animate-pulse" />
                    <span className="text-lg font-mono font-bold text-foreground">
                      {formatElapsed(table.id)}
                    </span>
                  </div>
                  {bill && (
                    <span className="text-sm text-muted-foreground">
                      Tagihan saat ini:{' '}
                      <span className="font-bold text-foreground">{formatRupiah(bill.grandTotal)}</span>
                    </span>
                  )}
                </div>
              )}
              {isCarryoverTransaction && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Transaksi sebelumnya{table?.originStaffName ? ` dari ${table.originStaffName}` : ''}. Lanjutkan di shift aktif saat ini.
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {(table.status === 'available' || table.status === 'reserved') ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-dashed border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center mb-6"
                  >
                    <Play className="h-10 w-10 text-emerald-600 dark:text-emerald-400 ml-1" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {table.status === 'reserved' ? 'Pilih Mode Billing' : 'Meja Tersedia'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    {table.status === 'reserved'
                      ? `Meja ini sudah di-assign dari waiting list. Pilih Open Bill / Prorata atau Paket Jam sebelum sesi dimulai.`
                      : `Mulai sesi billiard untuk ${table.name} dengan mode billing yang sesuai.`}
                  </p>
                  <div className="w-full max-w-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedBillingMode('open-bill')}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all',
                          selectedBillingMode === 'open-bill'
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                            : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                          <p className="font-bold text-foreground">Open Bill / Prorata</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Billing berjalan berdasarkan waktu main aktual dengan tarif {formatRupiah(table.hourlyRate)}/jam.
                        </p>
                      </button>
                      <button
                        onClick={() => setSelectedBillingMode('package')}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all',
                          selectedBillingMode === 'package'
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          <p className="font-bold text-foreground">Paket Jam</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Pilih paket global dari admin. Harga tetap dan tidak dihitung prorata saat checkout.
                        </p>
                      </button>
                    </div>

                    {selectedBillingMode === 'package' && (
                      <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-4 space-y-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">Paket Aktif</p>
                          <p className="text-xs text-muted-foreground">Pilih paket jam yang ingin dipakai untuk sesi ini.</p>
                        </div>
                        {activeBilliardPackages.length === 0 ? (
                          <div className="rounded-xl bg-white/80 dark:bg-gray-950/50 px-4 py-3 text-sm text-muted-foreground">
                            Belum ada paket aktif. Aktifkan paket dari admin terlebih dahulu.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activeBilliardPackages.map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setSelectedPackageId(pkg.id)}
                                className={cn(
                                  'w-full rounded-xl border px-4 py-3 text-left transition-all',
                                  selectedPackageId === pkg.id
                                    ? 'border-blue-400 bg-white dark:bg-gray-950'
                                    : 'border-blue-100 dark:border-blue-500/15 bg-white/70 dark:bg-white/5'
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                                    <p className="text-xs text-muted-foreground">{pkg.durationHours} jam</p>
                                  </div>
                                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatRupiah(pkg.price)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleStartSession}
                      disabled={!canStartSession}
                      className={cn(
                        'w-full px-8 py-4 rounded-xl font-bold text-base transition-all',
                        'bg-gradient-to-r from-emerald-600 to-emerald-500',
                        'hover:from-emerald-500 hover:to-emerald-400',
                        'text-white shadow-lg shadow-emerald-500/20',
                        'flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <Timer className="h-6 w-6" />
                      <span>MULAI BILLIARD</span>
                      <span className="text-xs font-normal opacity-80">
                        {selectedBillingMode === 'open-bill'
                          ? `Open Bill / Prorata • ${formatRupiah(table.hourlyRate)}/jam`
                          : selectedPackage
                            ? `${selectedPackage.name} • ${formatRupiah(selectedPackage.price)}`
                            : 'Pilih paket terlebih dahulu'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Tab Navigation */}
                  <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-white/10 px-4 pt-2">
                    <button
                      onClick={() => setActiveTab('order')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all relative',
                        activeTab === 'order'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Tambah Pesanan
                      {activeTab === 'order' && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('bill')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all relative',
                        activeTab === 'bill'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Receipt className="h-4 w-4" />
                      Detail Tagihan
                      {activeTab === 'bill' && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full"
                        />
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
                    <AnimatePresence mode="wait">
                      {activeTab === 'order' ? (
                        <motion.div
                          key="order"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        >
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Cari menu..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pb-2 [-webkit-overflow-scrolling:touch]">
                            <MenuList
                              tableId={table.id}
                              searchQuery={searchQuery}
                              quantityByItemId={orderQuantityByItemId}
                              accent="emerald"
                              onDecrease={(item) => {
                                const quantity = orderQuantityByItemId[item.id] ?? 0;
                                updateOrderItemQuantity(table.id, item.id, quantity - 1);
                              }}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="bill"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        >
                          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pb-[7.5rem] sm:pb-[7rem] [-webkit-overflow-scrolling:touch]">
                            <OrderSummary table={table} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Footer (only for occupied) */}
            {table.status === 'occupied' && (
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-5 py-3 bg-gray-50 dark:bg-gray-950/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Total Tagihan</p>
                    {bill && (
                      <p className="text-2xl font-bold text-foreground">
                        {formatRupiah(bill.grandTotal)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={showPayment}
                      className={cn(
                        'px-4 py-3 rounded-xl font-semibold text-sm transition-all',
                        'bg-gray-100 dark:bg-white/10 text-red-500 dark:text-red-400',
                        'hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-white/10',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'flex items-center gap-2'
                      )}
                    >
                      <X className="h-4 w-4" />
                      Batalkan
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenPayment}
                      disabled={showPayment}
                      className={cn(
                        'px-6 py-3 rounded-xl font-bold text-base transition-all',
                        'bg-gradient-to-r from-amber-600 to-amber-500',
                        'hover:from-amber-500 hover:to-amber-400',
                        'text-white shadow-lg shadow-amber-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'flex items-center gap-2'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      BAYAR
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
