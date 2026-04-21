'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChefHat, Plus, Printer, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { BusinessSettings, OrderHistory } from '@/context/PosContext';
import { usePos } from '@/context/PosContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { printReceiptDirect, printKitchenReceiptFromOrder } from './PrintReceipt';
import {
  TabletActionButton,
  TabletChip,
  TabletEmptyState,
  TabletPage,
  TabletPanel,
  TabletSectionHeader,
} from './TabletPrimitives';

type SettingsTab = 'business' | 'payments' | 'packages' | 'members';

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'business', label: 'Bisnis & Struk' },
  { id: 'payments', label: 'Pembayaran' },
  { id: 'packages', label: 'Paket Jam' },
  { id: 'members', label: 'Membership' },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminSettings() {
  const {
    settings,
    updateSettings,
    paymentOptions,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption,
    billiardPackages,
    addBilliardPackage,
    updateBilliardPackage,
    deleteBilliardPackage,
    members,
  } = usePos();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [newPayName, setNewPayName] = useState('');
  const [newPayIcon, setNewPayIcon] = useState('');
  const [newPayType, setNewPayType] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [newPayRef, setNewPayRef] = useState(false);
  const [newPayRefLabel, setNewPayRefLabel] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageHours, setNewPackageHours] = useState(2);
  const [newPackagePrice, setNewPackagePrice] = useState(45000);
  const [form, setForm] = useState<BusinessSettings>(settings);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  const [paymentError, setPaymentError] = useState('');
  const [packageError, setPackageError] = useState('');
  const [paymentDeleteConfirm, setPaymentDeleteConfirm] = useState<string | null>(null);
  const [packageDeleteConfirm, setPackageDeleteConfirm] = useState<string | null>(null);

  const autoSaveInitRef = useRef(true);

  const updateFormDraft = (updater: (current: BusinessSettings) => BusinessSettings) => {
    setSaveStatus('saving');
    setForm(updater);
  };

  useEffect(() => {
    if (autoSaveInitRef.current) {
      autoSaveInitRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      updateSettings(form);
      setSaveStatus('saved');
    }, 500);

    return () => window.clearTimeout(timer);
  }, [form, updateSettings]);

  const topLevelPaymentOptions = paymentOptions.filter((option) => option.parentId === null);
  const qrisParent = paymentOptions.find((option) => option.id === 'pm-qris') ?? null;

  const inputClass =
    'w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white';
  const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500';
  const receiptPrintOptions: Array<{
    key: keyof BusinessSettings['receiptPrint'];
    label: string;
    description: string;
  }> = [
    { key: 'showTaxLine', label: 'Tampilkan baris pajak', description: 'Menampilkan rincian pajak di struk jika pajak aktif.' },
    { key: 'showCashier', label: 'Tampilkan nama kasir', description: 'Menampilkan informasi staff yang melayani transaksi.' },
    { key: 'showPaymentInfo', label: 'Tampilkan metode bayar', description: 'Menampilkan metode pembayaran dan reference code.' },
    { key: 'showMemberInfo', label: 'Tampilkan data member', description: 'Menampilkan member serta detail poin earn/redeem.' },
    { key: 'showPrintTime', label: 'Tampilkan waktu cetak', description: 'Menampilkan jam saat struk dicetak.' },
  ];

  const handlePrintTest = () => {
    const now = new Date();
    const testOrder: OrderHistory = {
      id: 'test-order',
      tableId: 1,
      tableName: 'Meja 1',
      tableType: 'standard',
      sessionType: 'billiard',
      billType: 'package',
      billiardBillingMode: 'package',
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: now,
      durationMinutes: 60,
      sessionDurationHours: 2,
      rentalCost: 45000,
      selectedPackageId: 'pkg-2',
      selectedPackageName: 'Paket 2 Jam',
      selectedPackageHours: 2,
      selectedPackagePrice: 45000,
      orders: [
        {
          menuItem: {
            id: 'd2',
            name: 'Kopi Susu',
            category: 'drink',
            categoryId: 'cat-2',
            cost: 2750,
            recipe: [],
            isAvailable: true,
            price: 15000,
            emoji: '☕',
            description: 'Es kopi susu',
          },
          quantity: 2,
          subtotal: 30000,
        },
        {
          menuItem: {
            id: 's1',
            name: 'Kentang Goreng',
            category: 'snack',
            categoryId: 'cat-3',
            cost: 6300,
            recipe: [],
            isAvailable: true,
            price: 15000,
            emoji: '🍟',
            description: 'French fries',
          },
          quantity: 1,
          subtotal: 15000,
        },
      ],
      groups: [
        {
          id: 'group-billiard',
          fulfillmentType: 'dine-in',
          tableId: 1,
          tableName: 'Meja 1',
          items: [
            {
              menuItem: {
                id: 'd2',
                name: 'Kopi Susu',
                category: 'drink',
                categoryId: 'cat-2',
                cost: 2750,
                recipe: [],
                isAvailable: true,
                price: 15000,
                emoji: '☕',
                description: 'Es kopi susu',
              },
              quantity: 2,
              subtotal: 30000,
            },
          ],
          subtotal: 15000,
        },
      ],
      orderTotal: 45000,
      grandTotal: 90000,
      orderCost: 0,
      servedBy: 'Admin',
      status: 'completed',
      refundedAt: null,
      refundedBy: null,
      refundReason: null,
      paymentMethodId: 'pm-cash',
      paymentMethodName: 'Cash',
      paymentMethodType: 'cash',
      paymentReference: null,
      cashierShiftId: null,
      refundedInCashierShiftId: null,
      originCashierShiftId: null,
      originStaffId: 'staff-admin',
      originStaffName: 'Admin',
      involvedStaffIds: ['staff-admin'],
      involvedStaffNames: ['Admin'],
      isContinuedFromPreviousShift: false,
      memberId: null,
      memberCode: null,
      memberName: null,
      pointsEarned: 0,
      pointsRedeemed: 0,
      redeemAmount: 0,
      createdAt: now,
    };

    printReceiptDirect(testOrder, form, form.paperSize);
  };

  const handlePrintKitchenTest = () => {
    const now = new Date();
    const testOrder: OrderHistory = {
      id: 'test-kitchen',
      tableId: 1,
      tableName: 'TEST DAPUR',
      tableType: 'standard',
      sessionType: 'cafe',
      billType: 'open-bill',
      billiardBillingMode: null,
      startTime: now,
      endTime: now,
      durationMinutes: 0,
      sessionDurationHours: 0,
      rentalCost: 0,
      selectedPackageId: null,
      selectedPackageName: null,
      selectedPackageHours: 0,
      selectedPackagePrice: 0,
      orders: [],
      groups: [
        {
          id: 'g1',
          fulfillmentType: 'dine-in',
          tableId: 1,
          tableName: 'Meja 1',
          items: [
            { menuItem: { id: 'd2', name: 'Kopi Susu', category: 'drink', categoryId: '', cost: 0, recipe: [], isAvailable: true, price: 15000, emoji: '☕', description: '' }, quantity: 2, subtotal: 30000, note: 'tanpa gula' },
            { menuItem: { id: 'f1', name: 'Nasi Goreng', category: 'food', categoryId: '', cost: 0, recipe: [], isAvailable: true, price: 20000, emoji: '🍳', description: '' }, quantity: 1, subtotal: 20000 },
          ],
          subtotal: 50000,
        },
      ],
      orderTotal: 50000,
      grandTotal: 50000,
      orderCost: 0,
      servedBy: 'Admin',
      status: 'completed',
      refundedAt: null,
      refundedBy: null,
      refundReason: null,
      paymentMethodId: null,
      paymentMethodName: null,
      paymentMethodType: 'cash',
      paymentReference: null,
      cashierShiftId: null,
      refundedInCashierShiftId: null,
      originCashierShiftId: null,
      originStaffId: null,
      originStaffName: null,
      involvedStaffIds: [],
      involvedStaffNames: [],
      isContinuedFromPreviousShift: false,
      memberId: null,
      memberCode: null,
      memberName: null,
      pointsEarned: 0,
      pointsRedeemed: 0,
      redeemAmount: 0,
      createdAt: now,
    };
    printKitchenReceiptFromOrder(testOrder, form, form.printerSettings?.kitchen?.paperSize ?? '58mm');
  };

  const handleAddPaymentOption = () => {
    if (!newPayName.trim()) {
      const message = 'Nama metode pembayaran wajib diisi.';
      setPaymentError(message);
      toast({ title: 'Metode pembayaran belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    if (!newPayIcon.trim()) {
      const message = 'Emoji / ikon metode pembayaran wajib diisi.';
      setPaymentError(message);
      toast({ title: 'Metode pembayaran belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    if (newPayRef && newPayType !== 'qris' && !newPayRefLabel.trim()) {
      const message = 'Label reference wajib diisi jika metode membutuhkan reference.';
      setPaymentError(message);
      toast({ title: 'Metode pembayaran belum lengkap', description: message, variant: 'destructive' });
      return;
    }

    addPaymentOption({
      name: newPayName.trim(),
      icon: newPayIcon.trim(),
      type: newPayType,
      isActive: true,
      requiresReference: newPayType === 'qris' ? false : newPayRef,
      referenceLabel: newPayType === 'qris' ? '' : newPayRefLabel.trim(),
      parentId: newPayType === 'qris' ? (qrisParent?.id ?? 'pm-qris') : null,
      isGroup: false,
    });
    toast({
      title: 'Metode pembayaran ditambahkan',
      description: `${newPayName.trim()} berhasil ditambahkan.`,
    });
    setNewPayName('');
    setNewPayIcon('');
    setNewPayType('cash');
    setNewPayRef(false);
    setNewPayRefLabel('');
    setPaymentError('');
  };

  const handleAddPackage = () => {
    if (!newPackageName.trim()) {
      const message = 'Nama paket wajib diisi.';
      setPackageError(message);
      toast({ title: 'Paket belum lengkap', description: message, variant: 'destructive' });
      return;
    }
    if (newPackageHours <= 0) {
      const message = 'Durasi paket harus lebih dari 0 jam.';
      setPackageError(message);
      toast({ title: 'Paket belum valid', description: message, variant: 'destructive' });
      return;
    }
    if (newPackagePrice < 0) {
      const message = 'Harga paket tidak boleh negatif.';
      setPackageError(message);
      toast({ title: 'Paket belum valid', description: message, variant: 'destructive' });
      return;
    }

    addBilliardPackage({
      name: newPackageName.trim(),
      durationHours: newPackageHours,
      price: newPackagePrice,
      isActive: true,
    });
    toast({
      title: 'Paket ditambahkan',
      description: `${newPackageName.trim()} berhasil ditambahkan.`,
    });
    setNewPackageName('');
    setNewPackageHours(2);
    setNewPackagePrice(45000);
    setPackageError('');
  };

  return (
    <TabletPage
      eyebrow="Configuration"
      title="Pengaturan Bisnis"
      subtitle="Semua rule operasional utama untuk kasir, printer, membership, dan billing."
      actions={
        <>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold',
              saveStatus === 'saving'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            )}
          >
            {saveStatus === 'saving' ? 'Menyimpan…' : 'Tersimpan otomatis'}
          </span>
          <TabletActionButton tone="secondary" onClick={handlePrintTest}>
            <Printer className="h-4 w-4" />
            Cetak Tes
          </TabletActionButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <TabletPanel className="z-10 rounded-[16px] px-3 py-2.5 xl:sticky xl:top-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SETTINGS_TABS.map((tab) => (
              <TabletChip
                key={tab.id}
                active={activeTab === tab.id}
                className="shrink-0"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabletChip>
            ))}
          </div>
        </TabletPanel>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {activeTab === 'business' && (
            <TabletPanel>
              <TabletSectionHeader
                title="Informasi Bisnis"
                subtitle="Data yang muncul di login, header, dan struk."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama Bisnis</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateFormDraft((current) => ({ ...current, name: event.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) => updateFormDraft((current) => ({ ...current, phone: event.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Alamat</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => updateFormDraft((current) => ({ ...current, address: event.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Pajak (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.taxPercent}
                    onChange={(event) =>
                      updateFormDraft((current) => ({
                        ...current,
                        taxPercent: parseInt(event.target.value, 10) || 0,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ukuran Kertas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['58mm', '80mm'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateFormDraft((current) => ({ ...current, paperSize: size }))}
                        className={cn(
                          'rounded-[12px] border px-3 py-2 text-sm font-semibold transition-colors',
                          form.paperSize === size
                            ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                            : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Footer Struk</label>
                  <textarea
                    value={form.footerMessage}
                    onChange={(event) =>
                      updateFormDraft((current) => ({ ...current, footerMessage: event.target.value }))
                    }
                    rows={3}
                    className={cn(inputClass, 'resize-none')}
                    placeholder="Pesan terima kasih atau informasi promosi."
                  />
                </div>
                <div className="col-span-2 rounded-[16px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Pengaturan Print Struk</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Atur elemen informasi yang ditampilkan pada struk cetak.
                  </p>
                  <div className="mt-3 space-y-2">
                    {receiptPrintOptions.map((option) => {
                      const active = form.receiptPrint[option.key];
                      return (
                        <button
                          key={option.key}
                          onClick={() =>
                            updateFormDraft((current) => ({
                              ...current,
                              receiptPrint: {
                                ...current.receiptPrint,
                                [option.key]: !current.receiptPrint[option.key],
                              },
                            }))
                          }
                          className={cn(
                            'flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left transition-colors',
                            active
                              ? 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/70'
                              : 'border-slate-200/60 bg-slate-100 dark:border-white/10 dark:bg-white/5'
                          )}
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-bold text-slate-950 dark:text-white">{option.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                          </div>
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                              active
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            )}
                          >
                            {active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-[16px] bg-slate-50 p-4 dark:bg-white/5">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Mode Cetak</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Aktifkan mode struk kasir dan/atau dapur. Tiap mode bisa pakai ukuran kertas berbeda.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { mode: 'cashier' as const, label: 'Struk Kasir', icon: <Printer className="h-4 w-4" />, color: 'blue' },
                    { mode: 'kitchen' as const, label: 'Struk Dapur', icon: <ChefHat className="h-4 w-4" />, color: 'orange' },
                  ] as const).map(({ mode, label, icon }) => {
                    const modeSettings = form.printerSettings?.[mode] ?? { enabled: mode === 'cashier', paperSize: mode === 'cashier' ? '80mm' : '58mm' };
                    return (
                      <div key={mode} className="rounded-[12px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/60">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400">{icon}</span>
                            <p className="text-sm font-bold text-slate-950 dark:text-white">{label}</p>
                          </div>
                          <button
                            onClick={() =>
                              updateFormDraft((current) => ({
                                ...current,
                                printerSettings: {
                                  ...current.printerSettings,
                                  [mode]: { ...modeSettings, enabled: !modeSettings.enabled },
                                },
                              }))
                            }
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                              modeSettings.enabled
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            )}
                          >
                            {modeSettings.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                        </div>
                        <div>
                          <label className={labelClass}>Ukuran Kertas</label>
                          <div className="flex gap-2">
                            {(['58mm', '80mm'] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() =>
                                  updateFormDraft((current) => ({
                                    ...current,
                                    printerSettings: {
                                      ...current.printerSettings,
                                      [mode]: { ...modeSettings, paperSize: size },
                                    },
                                  }))
                                }
                                className={cn(
                                  'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                                  modeSettings.paperSize === size
                                    ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                                )}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={mode === 'cashier' ? handlePrintTest : handlePrintKitchenTest}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                        >
                          {icon}
                          Test Print {label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabletPanel>
          )}

          {activeTab === 'payments' && (
            <TabletPanel>
              <TabletSectionHeader
                title="Metode Pembayaran"
                subtitle="Top level method, sub QRIS, dan metode yang butuh reference code."
              />
              <div className="space-y-3">
                <div className="space-y-2">
                  {topLevelPaymentOptions.map((payment) => {
                    const childOptions = paymentOptions.filter((option) => option.parentId === payment.id);
                    return (
                      <div key={payment.id} className="space-y-2 rounded-[16px] bg-slate-50 p-3 dark:bg-white/5">
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-[14px] border px-3 py-2.5',
                            payment.isActive
                              ? 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/70'
                              : 'border-slate-200/60 bg-slate-100 opacity-60 dark:border-white/10 dark:bg-white/5'
                          )}
                        >
                          <span className="text-2xl">{payment.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                                {payment.name}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-white/10 dark:text-slate-400">
                                {payment.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {payment.isGroup
                                ? `${childOptions.length} sub opsi`
                                : payment.requiresReference
                                  ? payment.referenceLabel
                                  : 'Langsung tampil di kasir'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              updatePaymentOption(payment.id, { isActive: !payment.isActive });
                              toast({
                                title: payment.isActive ? 'Metode dinonaktifkan' : 'Metode diaktifkan',
                                description: `${payment.name} sekarang ${payment.isActive ? 'nonaktif' : 'aktif'}.`,
                              });
                            }}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                              payment.isActive
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            )}
                          >
                            {payment.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          {!payment.isGroup && (
                            paymentDeleteConfirm === payment.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    deletePaymentOption(payment.id);
                                    setPaymentDeleteConfirm(null);
                                    toast({
                                      title: 'Metode dihapus',
                                      description: `${payment.name} berhasil dihapus.`,
                                    });
                                  }}
                                  className="rounded-lg bg-rose-500 px-2 py-1 text-[10px] font-bold text-white"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setPaymentDeleteConfirm(null)}
                                  className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPaymentDeleteConfirm(payment.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )
                          )}
                        </div>

                        {childOptions.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pl-4">
                            {childOptions.map((child) => (
                              <div
                                key={child.id}
                                className={cn(
                                  'flex items-center gap-3 rounded-[18px] border px-3 py-2.5',
                                  child.isActive
                                    ? 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/70'
                                    : 'border-slate-200/60 bg-slate-100 opacity-60 dark:border-white/10 dark:bg-white/5'
                                )}
                              >
                                <span className="text-lg">{child.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                    {child.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Sub QRIS</p>
                                </div>
                                <button
                                  onClick={() => {
                                    updatePaymentOption(child.id, { isActive: !child.isActive });
                                    toast({
                                      title: child.isActive ? 'Sub metode dinonaktifkan' : 'Sub metode diaktifkan',
                                      description: `${child.name} sekarang ${child.isActive ? 'nonaktif' : 'aktif'}.`,
                                    });
                                  }}
                                  className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-xl transition-colors',
                                    child.isActive
                                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                      : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                                  )}
                                >
                                  {child.isActive ? (
                                    <ToggleRight className="h-4 w-4" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4" />
                                  )}
                                </button>
                                {paymentDeleteConfirm === child.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        deletePaymentOption(child.id);
                                        setPaymentDeleteConfirm(null);
                                        toast({
                                          title: 'Sub metode dihapus',
                                          description: `${child.name} berhasil dihapus.`,
                                        });
                                      }}
                                      className="rounded-lg bg-rose-500 px-1.5 py-1 text-[10px] font-bold text-white"
                                    >
                                      Ya
                                    </button>
                                    <button
                                      onClick={() => setPaymentDeleteConfirm(null)}
                                      className="rounded-lg bg-slate-200 px-1.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setPaymentDeleteConfirm(child.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-[16px] bg-slate-50 p-3 dark:bg-white/5 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">Ringkasan Pembayaran</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Metode aktif akan langsung muncul di kasir. QRIS parent akan menampung sub opsi bank.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-[18px] bg-white px-3 py-3 dark:bg-slate-950/70">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Top Level</p>
                        <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{topLevelPaymentOptions.length}</p>
                      </div>
                      <div className="rounded-[18px] bg-white px-3 py-3 dark:bg-slate-950/70">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">QRIS Sub</p>
                        <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                          {paymentOptions.filter((option) => option.parentId !== null).length}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-3 py-3 dark:bg-slate-950/70">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Active</p>
                        <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                          {paymentOptions.filter((option) => option.isActive).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">Tambah Metode Baru</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      QRIS baru otomatis jadi sub opsi di bawah metode induk.
                    </p>
                    {paymentError ? (
                      <div className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                        {paymentError}
                      </div>
                    ) : null}
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        value={newPayName}
                        onChange={(event) => {
                          setNewPayName(event.target.value);
                          setPaymentError('');
                        }}
                        placeholder="Nama metode"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={newPayIcon}
                        onChange={(event) => {
                          setNewPayIcon(event.target.value);
                          setPaymentError('');
                        }}
                        placeholder="Emoji"
                        maxLength={4}
                        className={cn(inputClass, 'text-center text-lg')}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {(['cash', 'qris', 'transfer'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setNewPayType(type)}
                            className={cn(
                              'rounded-[12px] border px-2 py-2 text-xs font-semibold uppercase transition-colors',
                              newPayType === type
                                ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                                : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setNewPayRef((current) => !current)}
                        disabled={newPayType === 'qris'}
                        className={cn(
                          'w-full rounded-[12px] border px-3 py-2 text-sm font-semibold transition-colors',
                          newPayRef
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
                          newPayType === 'qris' && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        Perlu Reference
                      </button>
                      {newPayRef && newPayType !== 'qris' && (
                        <input
                          type="text"
                          value={newPayRefLabel}
                          onChange={(event) => {
                            setNewPayRefLabel(event.target.value);
                            setPaymentError('');
                          }}
                          placeholder="Contoh: No. Pesanan Gojek"
                          className={inputClass}
                        />
                      )}
                      <TabletActionButton
                        className="w-full"
                        onClick={handleAddPaymentOption}
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Metode
                      </TabletActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </TabletPanel>
          )}

          {activeTab === 'packages' && (
            <TabletPanel>
              <TabletSectionHeader
                title="Paket Jam"
                subtitle="Billing paket global untuk semua meja billiard."
              />
              <div className="space-y-2">
                {billiardPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={cn(
                      'rounded-[16px] border px-3 py-2.5',
                      pkg.isActive
                        ? 'border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/5'
                        : 'border-slate-200/60 bg-slate-100 opacity-60 dark:border-white/10 dark:bg-white/5'
                    )}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_74px_108px_auto] items-center gap-2">
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(event) => updateBilliardPackage(pkg.id, { name: event.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min="1"
                        value={pkg.durationHours}
                        onChange={(event) =>
                          updateBilliardPackage(pkg.id, {
                            durationHours: Math.max(1, parseInt(event.target.value, 10) || 1),
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min="0"
                        value={pkg.price}
                        onChange={(event) =>
                          updateBilliardPackage(pkg.id, {
                            price: Math.max(0, parseInt(event.target.value, 10) || 0),
                          })
                        }
                        className={inputClass}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            updateBilliardPackage(pkg.id, { isActive: !pkg.isActive });
                            toast({
                              title: pkg.isActive ? 'Paket dinonaktifkan' : 'Paket diaktifkan',
                              description: `${pkg.name} sekarang ${pkg.isActive ? 'nonaktif' : 'aktif'}.`,
                            });
                          }}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                            pkg.isActive
                              ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                              : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                          )}
                        >
                          {pkg.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        {packageDeleteConfirm === pkg.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                deleteBilliardPackage(pkg.id);
                                setPackageDeleteConfirm(null);
                                toast({
                                  title: 'Paket dihapus',
                                  description: `${pkg.name} berhasil dihapus.`,
                                });
                              }}
                              className="rounded-lg bg-rose-500 px-2 py-1 text-[10px] font-bold text-white"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setPackageDeleteConfirm(null)}
                              className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPackageDeleteConfirm(pkg.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{pkg.durationHours} jam</span>
                      <span>{formatRupiah(pkg.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {packageError ? (
                <div className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {packageError}
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_74px_108px] gap-2 rounded-[16px] bg-slate-50 p-3 dark:bg-white/5">
                <input
                  type="text"
                  value={newPackageName}
                  onChange={(event) => {
                    setNewPackageName(event.target.value);
                    setPackageError('');
                  }}
                  placeholder="Nama paket"
                  className={inputClass}
                />
                <input
                  type="number"
                  min="1"
                  value={newPackageHours}
                  onChange={(event) => {
                    setNewPackageHours(Math.max(1, parseInt(event.target.value, 10) || 1));
                    setPackageError('');
                  }}
                  placeholder="Jam"
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  value={newPackagePrice}
                  onChange={(event) => {
                    setNewPackagePrice(Math.max(0, parseInt(event.target.value, 10) || 0));
                    setPackageError('');
                  }}
                  placeholder="Harga"
                  className={inputClass}
                />
                <TabletActionButton
                  className="col-span-3"
                  onClick={handleAddPackage}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Paket
                </TabletActionButton>
              </div>
            </TabletPanel>
          )}

          {activeTab === 'members' && (
            <TabletPanel className="flex min-h-[360px] flex-col">
              <TabletSectionHeader
                title="Membership"
                subtitle="Member local-first yang bisa dipakai untuk redeem dan poin."
              />
              {members.length === 0 ? (
                <TabletEmptyState
                  title="Belum ada member"
                  description="Member baru akan muncul otomatis setelah dibuat dari open bill."
                  className="min-h-[220px] flex-1"
                />
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.code} • {member.phone || 'Tanpa telepon'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-950 dark:text-white">
                          {member.pointsBalance} poin
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.tier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabletPanel>
          )}
        </div>
      </div>
    </TabletPage>
  );
}
