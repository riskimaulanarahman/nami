'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Search,
  ShoppingBag,
  Receipt,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Printer,
  Save,
  Users,
  ScanQrCode,
  UtensilsCrossed,
  UserPlus,
  ChefHat,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { FulfillmentType, Member, OpenBill, OrderHistory, PaymentOption } from '@/context/PosContext';
import MenuList from './MenuList';
import PrintReceipt from './PrintReceipt';
import { printDraftReceiptDirect, printReceiptDirect, printKitchenReceiptFromBill, printKitchenReceiptFromOrder } from './PrintReceipt';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fulfillmentLabel(type: FulfillmentType): string {
  return type === 'dine-in' ? 'Dine-in' : 'Takeaway';
}

function billSubtitle(bill: OpenBill): string {
  const hasDineIn = bill.groups.some((group) => group.fulfillmentType === 'dine-in' && group.items.length > 0);
  const hasTakeaway = bill.groups.some((group) => group.fulfillmentType === 'takeaway' && group.items.length > 0);
  if (hasDineIn && hasTakeaway) return 'Mixed Bill';
  if (hasDineIn) return 'Open Table';
  if (hasTakeaway) return 'Open Bill Takeaway';
  return 'Draft Bill';
}

export default function CafeOrderModal() {
  const {
    tables,
    openBills,
    activeOpenBillId,
    setActiveOpenBillId,
    updateOpenBill,
    saveOpenBillDraft,
    fetchOpenBillReceipt,
    deleteOpenBill,
    assignTableToOpenBill,
    addItemToOpenBill,
    removeItemFromOpenBill,
    updateOpenBillItemQuantity,
    updateOpenBillItemNote,
    checkoutOpenBill,
    canTransact,
    activeCashierShift,
    settings,
    paymentOptions,
    activePaymentOptions,
    getOpenBillTotals,
    members,
    addMember,
    attachMemberToOpenBill,
  } = usePos();
  const { currentStaff } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'order' | 'bill'>('order');
  const [activeFulfillment, setActiveFulfillment] = useState<FulfillmentType>('dine-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastOrder, setLastOrder] = useState<OrderHistory | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [refError, setRefError] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPrintingDraft, setIsPrintingDraft] = useState(false);
  const [expandedNoteKeys, setExpandedNoteKeys] = useState<Set<string>>(new Set());

  const activeBill = openBills.find((bill) => bill.id === activeOpenBillId) ?? null;
  const isVisible = activeBill !== null || lastOrder !== null;
  const isCarryoverBill = Boolean(
    activeBill &&
    activeBill.originCashierShiftId &&
    activeCashierShift &&
    activeBill.originCashierShiftId !== activeCashierShift.id
  );

  const selectedMember = activeBill
    ? members.find((member) => member.id === activeBill.memberId) ?? null
    : null;

  const totals = activeBill ? getOpenBillTotals(activeBill) : null;
  const nonEmptyGroups = activeBill?.groups.filter((group) => group.items.length > 0) ?? [];
  const hasBillItems = nonEmptyGroups.length > 0;

  const availableTables = tables.filter(
    (table) =>
      !table.activeOpenBillId || table.activeOpenBillId === activeBill?.id
  );

  const activeGroup = activeBill?.groups.find((group) => group.fulfillmentType === activeFulfillment) ?? null;
  const activeGroupQuantityByItemId = activeGroup
    ? Object.fromEntries(activeGroup.items.map((item) => [item.menuItem.id, item.quantity]))
    : {};
  const paymentChildren = paymentOptions.filter((option) => option.isActive && option.parentId !== null);
  const resolvePaymentMethodName = (payment: PaymentOption): string => {
    if (!payment.parentId) return payment.name;
    const parent = paymentOptions.find((option) => option.id === payment.parentId);
    return parent ? `${parent.name} ${payment.name}` : payment.name;
  };

  const handleAddMember = () => {
    if (!activeBill || !newMemberName.trim()) return;
    const member = addMember({ code: '', name: newMemberName.trim(), phone: newMemberPhone.trim() });
    attachMemberToOpenBill(activeBill.id, member.id);
    setNewMemberName('');
    setNewMemberPhone('');
    setShowNewMember(false);
  };

  const handleOpenPayment = () => {
    if (isSubmitting) return;
    if (!canTransact) {
      setRefError('Buka shift kasir terlebih dahulu untuk checkout.');
      return;
    }
    setShowPayment(true);
    setSelectedPayment(null);
    setPaymentRef('');
    setRefError('');
    setExpandedPaymentId(null);
  };

  const handleConfirmPayment = async () => {
    if (!activeBill || !selectedPayment || !currentStaff) return;
    if (!canTransact) {
      setRefError('Buka shift kasir terlebih dahulu untuk checkout.');
      return;
    }
    if (selectedPayment.requiresReference && !paymentRef.trim()) {
      setRefError(`${selectedPayment.referenceLabel} wajib diisi`);
      return;
    }

    setIsSubmitting(true);
    setRefError('');

    try {
      const history = await checkoutOpenBill(
        activeBill.id,
        { id: currentStaff.id, name: currentStaff.name },
        selectedPayment.id,
        resolvePaymentMethodName(selectedPayment),
        selectedPayment.requiresReference ? paymentRef.trim() : null
      );
      setShowPayment(false);
      setLastOrder(history);
      setSelectedPayment(null);
      setPaymentRef('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan sistem saat memproses pembayaran.';
      setRefError(message);
      toast({
        title: 'Checkout Gagal',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setLastOrder(null);
    setActiveOpenBillId(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (lastOrder) return;
    if (showPayment) {
      setShowPayment(false);
      return;
    }
    setActiveOpenBillId(null);
  };

  const handleSaveDraft = async () => {
    if (isSubmitting || isSavingDraft || isPrintingDraft) return;
    if (showPayment || lastOrder) return;
    if (!activeBill) return;

    setIsSavingDraft(true);
    try {
      const savedBill = await saveOpenBillDraft(activeBill.id);
      setActiveOpenBillId(null);
      toast({
        title: 'Draft disimpan',
        description: `${savedBill.code} sudah sinkron ke database.`,
      });
    } catch (e) {
      toast({
        title: 'Gagal menyimpan draft',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem saat menyimpan draft.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePrintDraft = async () => {
    if (isSubmitting || isSavingDraft || isPrintingDraft) return;
    if (showPayment || lastOrder) return;
    if (!activeBill) return;

    setIsPrintingDraft(true);
    try {
      const savedBill = await saveOpenBillDraft(activeBill.id);
      const receipt = await fetchOpenBillReceipt(savedBill.id);
      printDraftReceiptDirect(receipt, settings, settings.paperSize);
    } catch (e) {
      toast({
        title: 'Gagal mencetak draft',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem saat mengambil struk draft dari database.',
        variant: 'destructive',
      });
    } finally {
      setIsPrintingDraft(false);
    }
  };

  const handlePrintKitchen = () => {
    if (!activeBill) return;
    const paperSize = settings.printerSettings?.kitchen?.paperSize ?? '58mm';
    printKitchenReceiptFromBill(activeBill, settings, paperSize);
  };

  const handlePrintKasirAfterCheckout = () => {
    if (!lastOrder) return;
    const paperSize = settings.printerSettings?.cashier?.paperSize ?? settings.paperSize;
    printReceiptDirect(lastOrder, settings, paperSize);
  };

  const handlePrintKitchenAfterCheckout = () => {
    if (!lastOrder) return;
    const paperSize = settings.printerSettings?.kitchen?.paperSize ?? '58mm';
    printKitchenReceiptFromOrder(lastOrder, settings, paperSize);
  };

  if (!isVisible) return null;

  if (lastOrder) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 flex flex-col"
          >
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
              {lastOrder.paymentMethodName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  via {lastOrder.paymentMethodName}{lastOrder.paymentReference ? ` • ${lastOrder.paymentReference}` : ''}
                </p>
              )}
              {lastOrder.memberName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member {lastOrder.memberName} • +{lastOrder.pointsEarned} poin
                  {lastOrder.pointsRedeemed > 0 ? ` • -${lastOrder.pointsRedeemed} poin` : ''}
                </p>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3 space-y-2 text-sm">
                {lastOrder.groups.map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>{group.fulfillmentType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span>
                      <span>{group.tableName ?? 'Tanpa meja'}</span>
                    </div>
                    {group.items.map((item) => (
                      <div key={`${group.id}-${item.menuItem.id}`} className="flex justify-between text-foreground">
                        <span>{item.menuItem.emoji} {item.menuItem.name} x{item.quantity}</span>
                        <span>{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {lastOrder.redeemAmount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Redeem Poin</span>
                    <span>-{formatRupiah(lastOrder.redeemAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-white/10 pt-1.5 flex justify-between font-bold text-base text-foreground">
                  <span>Total</span>
                  <span>{formatRupiah(lastOrder.grandTotal)}</span>
                </div>
              </div>

              {(() => {
                const cashierEnabled = settings.printerSettings?.cashier?.enabled ?? true;
                const kitchenEnabled = settings.printerSettings?.kitchen?.enabled ?? false;
                if (cashierEnabled && kitchenEnabled) {
                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePrintKasirAfterCheckout}
                          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                        >
                          <Printer className="h-4 w-4" />
                          Cetak Kasir
                        </button>
                        <button
                          onClick={handlePrintKitchenAfterCheckout}
                          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
                        >
                          <ChefHat className="h-4 w-4" />
                          Cetak Dapur
                        </button>
                      </div>
                      <button
                        onClick={() => { handlePrintKasirAfterCheckout(); handlePrintKitchenAfterCheckout(); }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-600 py-2.5 text-sm font-bold text-white hover:bg-slate-500 transition-colors"
                      >
                        <Printer className="h-4 w-4" />
                        Cetak Keduanya
                      </button>
                    </div>
                  );
                }
                if (kitchenEnabled) {
                  return (
                    <button
                      onClick={handlePrintKitchenAfterCheckout}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
                    >
                      <ChefHat className="h-4 w-4" />
                      Cetak Struk Dapur
                    </button>
                  );
                }
                return <PrintReceipt order={lastOrder} settings={settings} paperSize={settings.printerSettings?.cashier?.paperSize ?? settings.paperSize} />;
              })()}
            </div>

            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/80">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDone}
                className="w-full py-3 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
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

  if (!activeBill || !totals) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden p-4 bg-black/70 backdrop-blur-sm touch-pan-y sm:items-center"
      >
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
                className="mx-4 flex max-h-[calc(100vh-3rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Metode Pembayaran</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Satu pembayaran untuk seluruh open bill</p>
                    </div>
                    <button
                      onClick={() => { if (!isSubmitting) setShowPayment(false); }}
                      disabled={isSubmitting}
                      className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                  <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2.5 text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Total Tagihan</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatRupiah(totals.total)}</p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {activePaymentOptions.map((payment) => {
                    const childOptions = paymentChildren.filter((child) => child.parentId === payment.id);
                    const selectedChild = childOptions.find((child) => child.id === selectedPayment?.id) ?? null;
                    const isSelected = selectedPayment?.id === payment.id || Boolean(selectedChild);
                    const isExpanded = expandedPaymentId === payment.id;
                    return (
                      <div key={payment.id} className="space-y-2">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isSubmitting}
                          onClick={() => {
                            if (isSubmitting) return;
                            if (payment.isGroup) {
                              setExpandedPaymentId((prev) => prev === payment.id ? null : payment.id);
                              setSelectedPayment(null);
                              setPaymentRef('');
                              setRefError('');
                              return;
                            }
                            setSelectedPayment(payment);
                            setExpandedPaymentId(null);
                            setPaymentRef('');
                            setRefError('');
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/50'
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                          )}
                        >
                          <span className="text-2xl flex-shrink-0">{payment.icon}</span>
                          <div className="flex-1">
                            <p className={cn('text-sm font-bold', isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>{payment.name}</p>
                            {selectedChild && (
                              <p className="text-xs text-muted-foreground">Dipilih: {selectedChild.name}</p>
                            )}
                            {!selectedChild && payment.requiresReference && (
                              <p className="text-xs text-muted-foreground">{payment.referenceLabel}</p>
                            )}
                            {payment.isGroup && childOptions.length > 0 && (
                              <p className="text-xs text-muted-foreground">{childOptions.length} sub opsi</p>
                            )}
                          </div>
                          <ChevronRight className={cn('h-4 w-4 flex-shrink-0 transition-transform', isExpanded ? 'rotate-90 text-emerald-500' : isSelected ? 'text-emerald-500' : 'text-muted-foreground')} />
                        </motion.button>
                        {payment.isGroup && isExpanded && childOptions.length > 0 && (
                          <div className="pl-4 space-y-2">
                            {childOptions.map((child) => {
                              const isChildSelected = selectedPayment?.id === child.id;
                              return (
                                <button
                                  key={child.id}
                                  disabled={isSubmitting}
                                  onClick={() => {
                                    if (isSubmitting) return;
                                    setSelectedPayment(child);
                                    setPaymentRef('');
                                    setRefError('');
                                  }}
                                  className={cn(
                                    'w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                                    isChildSelected
                                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                      : 'border-gray-200 dark:border-white/10 text-foreground hover:border-gray-300 dark:hover:border-white/20'
                                  )}
                                >
                                  {payment.name} {child.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

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
                          disabled={isSubmitting}
                          onChange={(event) => { setPaymentRef(event.target.value); setRefError(''); }}
                          placeholder={selectedPayment.referenceLabel}
                          className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                        {refError && <p className="text-xs text-red-500 mt-1">{refError}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {refError && !selectedPayment?.requiresReference && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-red-500">{refError}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 px-4 py-4 dark:border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmPayment}
                    disabled={!selectedPayment || isSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    {isSubmitting ? 'MEMPROSES...' : 'KONFIRMASI PEMBAYARAN'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          style={{ width: 'min(980px, calc(100vw - 2rem))' }}
          className="relative flex min-h-0 max-h-[calc(100vh-2rem)] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 sm:rounded-[30px]"
        >
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Open Bill F&B</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeBill.code} • {billSubtitle(activeBill)}
                  </p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="mt-3">
              {isCarryoverBill && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  Transaksi sebelumnya{activeBill.originStaffName ? ` dari ${activeBill.originStaffName}` : ''}. Pastikan item dan total sudah sesuai sebelum checkout.
                </div>
              )}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3.5 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Customer / Catatan</label>
                    <input
                      type="text"
                      value={activeBill.customerName}
                      onChange={(event) => updateOpenBill(activeBill.id, { customerName: event.target.value })}
                      placeholder="Nama customer"
                      className="w-full rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Member</label>
                    <div className="flex gap-2">
                      <select
                        value={activeBill.memberId ?? ''}
                        onChange={(event) => attachMemberToOpenBill(activeBill.id, event.target.value || null)}
                        className="flex-1 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      >
                        <option value="">Tanpa member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} • {member.code} • {member.pointsBalance} poin
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewMember((prev) => !prev)}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:hover:bg-orange-500/25"
                        title="Tambah member"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showNewMember && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(event) => setNewMemberName(event.target.value)}
                          placeholder="Nama member baru"
                          className="rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                        <input
                          type="text"
                          value={newMemberPhone}
                          onChange={(event) => setNewMemberPhone(event.target.value)}
                          placeholder="Nomor telepon"
                          className="rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                        <button
                          onClick={handleAddMember}
                          className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
                        >
                          Simpan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {selectedMember && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{selectedMember.name} • {selectedMember.pointsBalance} poin</span>
                      <span>{selectedMember.tier}</span>
                    </div>
                    <div className="mt-2">
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Redeem poin</label>
                      <input
                        type="number"
                        min="0"
                        value={activeBill.pointsToRedeem}
                        onChange={(event) => updateOpenBill(activeBill.id, { pointsToRedeem: Math.max(0, parseInt(event.target.value, 10) || 0) })}
                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-amber-500/20 dark:bg-gray-950"
                      />
                    </div>
                    {totals.redeemAmount > 0 && (
                      <div className="mt-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                        <span>Nilai redeem</span>
                        <span>-{formatRupiah(totals.redeemAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 border-b border-gray-200 px-4 pt-2 dark:border-white/10">
            <button
              onClick={() => setActiveTab('order')}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all',
                activeTab === 'order' ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Tambah Pesanan
              {activeTab === 'order' && (
                <motion.div
                  layoutId="openBillTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('bill')}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all',
                activeTab === 'bill' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Receipt className="h-4 w-4" />
              Detail Bill
              {activeTab === 'bill' && (
                <motion.div
                  layoutId="openBillTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full"
                />
              )}
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'order' ? (
                <motion.div
                  key="order"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden p-4"
                >
                  <div className="mb-4 flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex items-center rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-0.5">
                      <button
                        onClick={() => setActiveFulfillment('dine-in')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                          activeFulfillment === 'dine-in' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        Dine-in
                      </button>
                      <button
                        onClick={() => setActiveFulfillment('takeaway')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                          activeFulfillment === 'takeaway' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Takeaway
                      </button>
                    </div>

                    {activeFulfillment === 'dine-in' && (
                      <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 dark:border-white/10 dark:bg-white/5 sm:w-auto">
                        <Users className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <select
                          value={activeGroup?.tableId ?? ''}
                          onChange={(event) => {
                            const value = parseInt(event.target.value, 10);
                            if (value) assignTableToOpenBill(activeBill.id, value);
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none sm:min-w-[190px]"
                        >
                          <option value="">Pilih meja dine-in</option>
                          {availableTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name} • {table.type === 'vip' ? 'VIP' : 'Standar'}{table.status === 'occupied' ? ' (Aktif)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="relative w-full sm:min-w-[220px] sm:flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder={`Cari menu untuk ${fulfillmentLabel(activeFulfillment).toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pb-24 [-webkit-overflow-scrolling:touch]">
                    <MenuList
                      searchQuery={searchQuery}
                      quantityByItemId={activeGroupQuantityByItemId}
                      accent="orange"
                      onAdd={(item) => addItemToOpenBill(activeBill.id, activeFulfillment, item)}
                      onDecrease={(item) => {
                        const quantity = activeGroupQuantityByItemId[item.id] ?? 0;
                        updateOpenBillItemQuantity(activeBill.id, activeFulfillment, item.id, quantity - 1);
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
                  className="flex min-h-0 flex-1 flex-col overflow-hidden p-4"
                >
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-3 pb-24 [-webkit-overflow-scrolling:touch]">
                    <div className="space-y-4">
                      {!hasBillItems ? (
                        <div className="mx-auto flex min-h-[280px] w-full max-w-[560px] items-center px-1">
                          <div className="w-full overflow-hidden rounded-2xl border border-dashed border-amber-200 dark:border-amber-500/25">
                            <div className="bg-amber-50/80 p-6 text-center dark:bg-amber-500/10">
                              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-950/80 dark:text-amber-300">
                                <Receipt className="h-5 w-5" />
                              </div>
                              <p className="text-base font-bold text-amber-800 dark:text-amber-200">
                                Belum ada pesanan cafe
                              </p>
                              <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-300/80">
                                Tambahkan item dari tab <span className="font-semibold">Tambah Pesanan</span>, lalu detail tagihan akan tampil di sini.
                              </p>
                              <button
                                onClick={() => setActiveTab('order')}
                                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
                              >
                                <ShoppingBag className="h-4 w-4" />
                                Buka Tambah Pesanan
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        nonEmptyGroups
                          .sort((a, b) => (a.fulfillmentType === 'dine-in' ? -1 : 1))
                          .map((group) => (
                            <div key={group.id} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                              <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-foreground">{fulfillmentLabel(group.fulfillmentType)}</p>
                                  <p className="text-xs text-muted-foreground">{group.tableName ?? 'Tanpa meja'}</p>
                                </div>
                                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatRupiah(group.subtotal)}</p>
                              </div>
                              <div className="p-3 space-y-2">
                                {group.items.map((order) => {
                                  const noteKey = `${group.fulfillmentType}-${order.menuItem.id}`;
                                  const noteOpen = expandedNoteKeys.has(noteKey);
                                  const hasNote = Boolean(order.note);
                                  return (
                                    <div key={order.menuItem.id} className="rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden">
                                      <div className="flex flex-wrap items-center gap-2 p-2.5 sm:flex-nowrap">
                                        <span className="text-lg shrink-0">{order.menuItem.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-foreground truncate">{order.menuItem.name}</p>
                                          <p className="text-xs text-muted-foreground">{formatRupiah(order.menuItem.price)} / item</p>
                                        </div>
                                        <div className="flex items-center gap-1 sm:ml-auto">
                                          <button
                                            title={hasNote ? order.note : 'Tambah catatan'}
                                            onClick={() => setExpandedNoteKeys((prev) => {
                                              const next = new Set(prev);
                                              next.has(noteKey) ? next.delete(noteKey) : next.add(noteKey);
                                              return next;
                                            })}
                                            className={cn(
                                              'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                                              hasNote
                                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                                                : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-muted-foreground'
                                            )}
                                          >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => updateOpenBillItemQuantity(activeBill.id, group.fulfillmentType, order.menuItem.id, order.quantity - 1)}
                                            className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-foreground flex items-center justify-center"
                                          >
                                            <Minus className="h-3.5 w-3.5" />
                                          </button>
                                          <span className="min-w-7 text-center text-sm font-bold text-foreground">{order.quantity}</span>
                                          <button
                                            onClick={() => updateOpenBillItemQuantity(activeBill.id, group.fulfillmentType, order.menuItem.id, order.quantity + 1)}
                                            className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-foreground flex items-center justify-center"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => removeItemFromOpenBill(activeBill.id, group.fulfillmentType, order.menuItem.id)}
                                            className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25 text-red-500 dark:text-red-400 flex items-center justify-center"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <div className="w-full text-right text-sm font-bold text-foreground sm:w-24">
                                          {formatRupiah(order.menuItem.price * order.quantity)}
                                        </div>
                                      </div>
                                      {noteOpen && (
                                        <div className="px-2.5 pb-2.5">
                                          <input
                                            type="text"
                                            autoFocus
                                            defaultValue={order.note ?? ''}
                                            placeholder="Catatan untuk item ini..."
                                            onBlur={(e) => updateOpenBillItemNote(activeBill.id, group.fulfillmentType, order.menuItem.id, e.target.value)}
                                            className="w-full rounded-md bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-500/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-400/60 transition-all"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                      )}

                      <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal F&B</span>
                          <span>{formatRupiah(totals.subtotal)}</span>
                        </div>
                        {totals.redeemAmount > 0 && (
                          <div className="flex justify-between text-sm text-amber-700 dark:text-amber-300">
                            <span>Redeem poin ({totals.pointsRedeemed})</span>
                            <span>-{formatRupiah(totals.redeemAmount)}</span>
                          </div>
                        )}
                        {settings.taxPercent > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Pajak</span>
                            <span>{formatRupiah(totals.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-amber-200 dark:border-amber-500/20">
                          <span>Total Bayar</span>
                          <span>{formatRupiah(totals.total)}</span>
                        </div>
                        {selectedMember && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Estimasi poin didapat</span>
                            <span>{Math.floor(totals.redeemableSubtotal / 10000)} poin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-gray-950/80 sm:flex-row">
            <button
              onClick={() => deleteOpenBill(activeBill.id)}
              disabled={isSavingDraft || isPrintingDraft || isSubmitting}
              className="w-full rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 sm:w-auto"
            >
              Hapus Open Bill
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isPrintingDraft || isSubmitting}
              className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSavingDraft ? 'Menyimpan...' : 'Save Draft Bill'}
              </span>
            </button>
            <button
              onClick={handlePrintDraft}
              disabled={isSavingDraft || isPrintingDraft || isSubmitting}
              className="w-full rounded-xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25 sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" />
                {isPrintingDraft ? 'Menyiapkan...' : 'Cetak Draft'}
              </span>
            </button>
            {hasBillItems && (
              <button
                onClick={handlePrintKitchen}
                disabled={isSavingDraft || isPrintingDraft || isSubmitting}
                className="w-full rounded-xl bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25 sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Cetak Dapur
                </span>
              </button>
            )}
            <button
              onClick={handleOpenPayment}
              disabled={activeBill.groups.every((group) => group.items.length === 0) || isSavingDraft || isPrintingDraft}
              className="flex-1 py-3 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {selectedPayment?.type === 'qris' ? <ScanQrCode className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              Checkout Open Bill
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
