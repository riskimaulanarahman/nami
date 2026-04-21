'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Armchair,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  MessageSquare,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clock,
  CreditCard,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  Minus,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  X,
  Save,
  ScanQrCode,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Timer,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  PosProvider,
  usePos,
  type FulfillmentType,
  type OrderHistory,
  type PaymentOption,
  type Table,
  type TableLayoutPosition,
} from '@/context/PosContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import TableCard from '@/components/pos/TableCard';
import ActionModal from '@/components/pos/ActionModal';
import CashierShiftModal from '@/components/pos/CashierShiftModal';
import ExpenseModal from '@/components/pos/ExpenseModal';
import MenuList from '@/components/pos/MenuList';
import { printDraftReceiptDirect, printReceiptDirect, printKitchenReceiptFromBill, printKitchenReceiptFromOrder } from '@/components/pos/PrintReceipt';
import LoginScreen from '@/components/pos/LoginScreen';
import AdminLayout from '@/components/pos/AdminLayout';
import AdminDashboard from '@/components/pos/AdminDashboard';
import AdminTables from '@/components/pos/AdminTables';
import AdminMenu from '@/components/pos/AdminMenu';
import AdminOrders from '@/components/pos/AdminOrders';
import AdminStaff from '@/components/pos/AdminStaff';
import AdminReports from '@/components/pos/AdminReports';
import AdminSettings from '@/components/pos/AdminSettings';
import AdminInventory from '@/components/pos/AdminInventory';
import TabletAccessGate from '@/components/pos/TabletAccessGate';
import TabletShell from '@/components/pos/TabletShell';
import {
  TabletActionButton,
  TabletPanel,
  TabletScrollArea,
  TabletSectionHeader,
} from '@/components/pos/TabletPrimitives';
import type { AdminPage } from '@/components/pos/AdminLayout';
import { useTabletViewport, type AppShellMode, type TabletViewportState } from '@/hooks/use-tablet-viewport';

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={toggleTheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
        className
      )}
      title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </motion.button>
  );
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type PosTab = 'home' | 'tables' | 'orders' | 'history';
type HistoryFilterStatus = 'all' | 'completed' | 'refunded';
type HistorySessionFilter = 'all' | 'billiard' | 'cafe';
type RefundStep = 'auth-choice' | 'pin' | 'email' | 'email-sent' | 'confirm' | 'reason' | 'success';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
  if (hours > 0) return `${hours}j`;
  return `${mins}m`;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBillElapsed(startDate: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 60000));
  return formatDuration(minutes);
}

function fulfillmentLabel(type: FulfillmentType): string {
  return type === 'dine-in' ? 'Dine-in' : 'Takeaway';
}

function PosMetricCard({
  icon,
  label,
  value,
  subtitle,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
}) {
  const toneClass = {
    default: 'bg-slate-950 text-white dark:bg-white dark:text-slate-950',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  }[tone];

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/78">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', toneClass)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function WaitingListPanel({
  showForm = true,
}: {
  showForm?: boolean;
}) {
  const {
    waitingList,
    addWaitingListEntry,
    cancelWaitingListEntry,
    seatWaitingListEntry,
    tables,
    setActiveModalTableId,
  } = usePos();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [preferredTableType, setPreferredTableType] = useState<'any' | 'standard' | 'vip'>('any');
  const [seatSelections, setSeatSelections] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const waitingEntries = waitingList.filter((entry) => entry.status === 'waiting');
  const availableTables = tables.filter((table) => table.status === 'available');

  const handleAdd = async () => {
    if (!customerName.trim()) {
      const message = 'Nama customer wajib diisi.';
      setFormError(message);
      toast({
        title: 'Waiting list belum lengkap',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addWaitingListEntry({
        customerName: customerName.trim(),
        phone: phone.trim(),
        partySize,
        notes: '',
        preferredTableType,
      });

      setCustomerName('');
      setPhone('');
      setPartySize(2);
      setPreferredTableType('any');
      setFormError('');
      toast({
        title: 'Waiting list ditambahkan',
        description: `${customerName.trim()} masuk ke antrean meja.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal menambahkan waiting list',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan antrean.',
        variant: 'destructive',
      });
    }
  };

  const handleSeat = async (entryId: string, customerLabel: string, optionsCount: number) => {
    const selectedValue = parseInt(seatSelections[entryId] ?? '', 10);
    if (!selectedValue) {
      toast({
        title: 'Pilih meja terlebih dahulu',
        description: optionsCount === 0
          ? 'Belum ada meja kosong yang cocok untuk antrean ini.'
          : 'Pilih meja kosong sebelum menempatkan customer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tableId = await seatWaitingListEntry(entryId, selectedValue);
      if (tableId) {
        setActiveModalTableId(tableId);
      }
      setSeatSelections((current) => ({ ...current, [entryId]: '' }));
      toast({
        title: 'Customer ditempatkan',
        description: `${customerLabel} berhasil dipindahkan ke meja.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal menempatkan customer',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memilih meja.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelWaiting = async (entryId: string, customerLabel: string) => {
    try {
      await cancelWaitingListEntry(entryId);
      setCancelConfirmId(null);
      toast({
        title: 'Waiting list dibatalkan',
        description: `${customerLabel} sudah dikeluarkan dari antrean.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal membatalkan waiting list',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat membatalkan antrean.',
        variant: 'destructive',
      });
    }
  };

  return (
    <TabletPanel className="flex h-full min-h-0 flex-col overflow-hidden">
      <TabletSectionHeader
        icon={Users}
        title="Waiting List"
        subtitle={`${waitingEntries.length} customer menunggu meja.`}
      />

      {showForm && (
        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setFormError('');
              }}
              placeholder="Nama customer"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
            />
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Telepon"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
            />
            <input
              type="number"
              min="1"
              value={partySize}
              onChange={(event) => setPartySize(Math.max(1, parseInt(event.target.value, 10) || 1))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
            />
            <select
              value={preferredTableType}
              onChange={(event) => setPreferredTableType(event.target.value as 'any' | 'standard' | 'vip')}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
            >
              <option value="any">Any table</option>
              <option value="standard">Standar</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          {formError ? (
            <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          ) : null}
          <TabletActionButton className="w-full justify-center" onClick={() => { void handleAdd(); }}>
            Tambah Waiting
          </TabletActionButton>
        </div>
      )}

      <TabletScrollArea className="space-y-2">
        {waitingEntries.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/90 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            Belum ada antrean meja.
          </div>
        ) : (
          waitingEntries.map((entry) => {
            const options = availableTables.filter((table) =>
              entry.preferredTableType === 'any' ? true : table.type === entry.preferredTableType
            );

            return (
              <div
                key={entry.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                      {entry.customerName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.partySize} orang • pref {entry.preferredTableType}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    waiting
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <select
                    value={seatSelections[entry.id] ?? ''}
                    onChange={(event) =>
                      setSeatSelections((current) => ({ ...current, [entry.id]: event.target.value }))
                    }
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">Pilih meja kosong</option>
                    {options.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} • {table.type === 'vip' ? 'VIP' : 'Standar'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      void handleSeat(entry.id, entry.customerName, options.length);
                    }}
                    className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    Seat
                  </button>
                  {cancelConfirmId === entry.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          void handleCancelWaiting(entry.id, entry.customerName);
                        }}
                        className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-bold text-white"
                      >
                        Ya
                      </button>
                      <button
                        onClick={() => setCancelConfirmId(null)}
                        className="rounded-2xl bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCancelConfirmId(entry.id)}
                      className="rounded-2xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

      </TabletScrollArea>
    </TabletPanel>
  );
}

function HomeTab({
  activeSessions,
  availableTables,
  openBillCount,
  totalRevenue,
  waitingCount,
  totalTables,
  canTransact,
  isAdmin,
  onGoAdmin,
  onOpenCafe,
  onTabChange,
}: {
  activeSessions: Table[];
  availableTables: number;
  openBillCount: number;
  totalRevenue: number;
  waitingCount: number;
  totalTables: number;
  canTransact: boolean;
  isAdmin: boolean;
  onGoAdmin: () => void;
  onOpenCafe: () => void;
  onTabChange: (tab: PosTab) => void;
}) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      <div className="grid grid-cols-4 gap-4">
        <PosMetricCard
          icon={<Armchair className="h-5 w-5" />}
          label="Meja Kosong"
          value={`${availableTables}`}
          subtitle={`${totalTables} total meja`}
          tone="success"
        />
        <PosMetricCard
          icon={<Receipt className="h-5 w-5" />}
          label="Open Bill"
          value={`${openBillCount}`}
          subtitle="Sesi prorata berjalan"
          tone="warning"
        />
        <PosMetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pendapatan"
          value={formatRupiah(totalRevenue)}
          subtitle="Transaksi selesai"
          tone="success"
        />
        <PosMetricCard
          icon={<Users className="h-5 w-5" />}
          label="Waiting"
          value={`${waitingCount}`}
          subtitle="Antrian customer"
          tone="info"
        />
      </div>

      <div className="grid min-h-0 grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="grid min-h-0 gap-4">
          <TabletPanel>
            <TabletSectionHeader
              icon={CircleDot}
              title="Quick Actions"
              subtitle="Aksi kasir yang paling sering dipakai."
            />
            <div className="grid grid-cols-2 gap-3">
              <TabletActionButton className="justify-center" onClick={() => onTabChange('tables')}>
                <Armchair className="h-4 w-4" />
                Lihat Meja
              </TabletActionButton>
              {/* <TabletActionButton className="justify-center" onClick={onOpenCafe} disabled={!canTransact}>
                <UtensilsCrossed className="h-4 w-4" />
                Open Bill Cafe
              </TabletActionButton> */}
              <TabletActionButton tone="secondary" className="justify-center" onClick={() => onTabChange('orders')}>
                <Receipt className="h-4 w-4" />
                Kelola Orders
              </TabletActionButton>
              <TabletActionButton tone="secondary" className="justify-center" onClick={() => onTabChange('history')}>
                <TrendingUp className="h-4 w-4" />
                Riwayat
              </TabletActionButton>
              {isAdmin && (
                <TabletActionButton tone="secondary" className="col-span-2 justify-center" onClick={onGoAdmin}>
                  <LayoutDashboard className="h-4 w-4" />
                  Buka Admin Panel
                </TabletActionButton>
              )}
            </div>
          </TabletPanel>

          <WaitingListPanel showForm={false} />
        </div>

        <TabletPanel className="flex min-h-0 flex-col overflow-hidden">
          <TabletSectionHeader
            icon={Timer}
            title="Live Sessions"
            subtitle="Ringkasan meja yang sedang berjalan saat ini."
          />
          {activeSessions.length === 0 ? (
            <div className="flex h-full min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Belum ada sesi aktif.
            </div>
          ) : (
            <TabletScrollArea className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
              {activeSessions.map((table) => (
                <TableCard key={table.id} table={table} compact />
              ))}
            </TabletScrollArea>
          )}
        </TabletPanel>
      </div>
    </div>
  );
}

function getAutoLayoutPosition(index: number, columns: number): TableLayoutPosition {
  const widthPercent = columns >= 5 ? 17 : 21;
  const horizontalPadding = 4;
  const totalWidth = 100 - horizontalPadding * 2;
  const gap = columns > 1 ? (totalWidth - columns * widthPercent) / (columns - 1) : 0;
  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    xPercent: horizontalPadding + col * (widthPercent + gap),
    yPercent: 10 + row * 12,
    widthPercent,
  };
}

function FloorPlanNode({
  table,
  position,
  boardRef,
  editMode,
}: {
  table: Table;
  position: TableLayoutPosition;
  boardRef: React.RefObject<HTMLDivElement | null>;
  editMode: boolean;
}) {
  const { setActiveModalTableId, formatElapsed, updateTableLayoutPosition, activeCashierShift } = usePos();
  const [draftPosition, setDraftPosition] = useState<TableLayoutPosition | null>(null);
  const latestDraftRef = useRef<TableLayoutPosition | null>(null);
  const currentPosition = draftPosition ?? position;

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!editMode) return;
    const board = boardRef.current;
    if (!board) return;

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = draftPosition ?? position;
    const boardRect = board.getBoundingClientRect();
    const maxX = 98 - startPosition.widthPercent;
    const maxY = 92;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / boardRect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / boardRect.height) * 100;
      const nextPosition = {
        ...startPosition,
        xPercent: clamp(startPosition.xPercent + deltaX, 2, maxX),
        yPercent: clamp(startPosition.yPercent + deltaY, 6, maxY),
      };
      latestDraftRef.current = nextPosition;
      setDraftPosition(nextPosition);
    };

    const handlePointerUp = () => {
      const finalPosition = latestDraftRef.current ?? startPosition;
      updateTableLayoutPosition(table.id, finalPosition);
      latestDraftRef.current = null;
      setDraftPosition(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const cardTone =
    table.status === 'occupied'
      ? 'border-rose-200 bg-rose-50/90 dark:border-rose-500/20 dark:bg-rose-500/10'
      : table.status === 'reserved'
        ? 'border-sky-200 bg-sky-50/90 dark:border-sky-500/20 dark:bg-sky-500/10'
        : 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/20 dark:bg-emerald-500/10';
  const isCarryover = Boolean(
    table.status === 'occupied' &&
    table.originCashierShiftId &&
    activeCashierShift &&
    table.originCashierShiftId !== activeCashierShift.id
  );

  return (
    <motion.button
      whileHover={editMode ? { scale: 1.01 } : { y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onPointerDown={handlePointerDown}
      onClick={() => !editMode && setActiveModalTableId(table.id)}
      className={cn(
        'absolute rounded-[14px] border p-2 text-left shadow-sm transition-colors',
        cardTone,
        editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      )}
      style={{
        left: `${currentPosition.xPercent}%`,
        top: `${currentPosition.yPercent}%`,
        width: `${currentPosition.widthPercent}%`,
      }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="line-clamp-2 text-[11px] font-black leading-tight tracking-[-0.01em] text-slate-950 dark:text-white">
          {table.name}
        </p>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]',
            table.status === 'occupied'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
              : table.status === 'reserved'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
          )}
        >
          {table.status}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[9px] text-slate-500 dark:text-slate-400">
        <p className="rounded-md bg-white/60 px-1 py-0.5 text-center uppercase tracking-[0.12em] dark:bg-white/10">
          {table.type === 'vip' ? 'VIP' : 'STD'}
        </p>
        <p className="rounded-md bg-white/60 px-1 py-0.5 text-center font-semibold dark:bg-white/10">
          {formatRupiah(table.hourlyRate)}/j
        </p>
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] font-mono font-bold leading-tight text-slate-900 dark:text-white">
        {table.status === 'occupied'
          ? `${formatElapsed(table.id)} • ${table.billingMode === 'package' ? 'PKG' : 'OPEN'}`
          : table.status === 'reserved'
            ? 'Reserved'
            : 'Available'}
      </p>
      {isCarryover && (
        <p className="mt-1 line-clamp-1 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-300">
          Transaksi Sebelumnya
        </p>
      )}
    </motion.button>
  );
}

function TablesTab({
  mode,
  tables,
  tableLayout,
  layoutBoardRef,
  isLayoutEditMode,
  onToggleLayoutEdit,
  onResetLayout,
}: {
  mode: AppShellMode;
  tables: Table[];
  tableLayout: Record<number, TableLayoutPosition>;
  layoutBoardRef: React.RefObject<HTMLDivElement | null>;
  isLayoutEditMode: boolean;
  onToggleLayoutEdit: () => void;
  onResetLayout: () => void;
}) {
  const columns = mode === 'wide' ? 5 : 4;
  const baseWidth = columns >= 5 ? 17 : 21;
  const totalRows = Math.max(1, Math.ceil(tables.length / columns));
  const boardHeight = Math.max(mode === 'wide' ? 580 : 500, 150 + totalRows * 96);

  const resolvedPositions = useMemo(() => {
    const entries: Array<[number, TableLayoutPosition]> = tables.map((table, index) => {
      const fallback = getAutoLayoutPosition(index, columns);
      const saved = tableLayout[table.id];
      if (!saved) return [table.id, fallback];

      return [
        table.id,
        {
          xPercent: clamp(saved.xPercent, 2, 98 - baseWidth),
          yPercent: clamp(saved.yPercent, 6, 92),
          widthPercent: baseWidth,
        },
      ];
    });
    return Object.fromEntries(entries);
  }, [baseWidth, columns, tableLayout, tables]);

  return (
    <div className={cn('grid h-full gap-4', mode === 'wide' ? 'grid-cols-[1.42fr_0.88fr]' : 'grid-cols-[1.3fr_0.9fr]')}>
      <TabletPanel className="flex flex-1 min-h-0 flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Tables</p>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Floor Plan</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLayoutEdit}
              className={cn(
                'rounded-2xl border px-3 py-2 text-sm font-bold transition-colors',
                isLayoutEditMode
                  ? 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              )}
            >
              {isLayoutEditMode ? 'Selesai Atur' : 'Atur Layout'}
            </button>
            <button
              onClick={onResetLayout}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>

        {isLayoutEditMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            Drag card meja untuk menyesuaikan posisi floor plan.
          </div>
        )}

        <TabletScrollArea className="flex-1">
          <div
            ref={layoutBoardRef}
            className="relative min-h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(226,232,240,0.92))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(15,23,42,1))]"
            style={{ height: boardHeight }}
          >
            <div className="absolute inset-6 rounded-[28px] border border-dashed border-white/50 dark:border-white/10" />
            <div className="absolute left-[5%] top-[4%] rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
              Main Floor
            </div>
            {tables.map((table) => (
              <FloorPlanNode
                key={table.id}
                table={table}
                position={resolvedPositions[table.id]}
                boardRef={layoutBoardRef}
                editMode={isLayoutEditMode}
              />
            ))}
          </div>
        </TabletScrollArea>
      </TabletPanel>

      <WaitingListPanel />
    </div>
  );
}

function OrdersTab() {
  const {
    tables,
    openBills,
    activeOpenBillId,
    setActiveOpenBillId,
    createOpenBill,
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

  const [activeFulfillment, setActiveFulfillment] = useState<FulfillmentType>('dine-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showOpenBillSelector, setShowOpenBillSelector] = useState(false);
  const [isBillMetaCollapsed, setIsBillMetaCollapsed] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [refError, setRefError] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [lastOrder, setLastOrder] = useState<OrderHistory | null>(null);
  const [printCashier, setPrintCashier] = useState(true);
  const [printKitchen, setPrintKitchen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPrintingDraft, setIsPrintingDraft] = useState(false);
  const [expandedNoteKeys, setExpandedNoteKeys] = useState<Set<string>>(new Set());

  const activeOpenBills = useMemo(() => openBills.filter((bill) => bill.status === 'open'), [openBills]);
  const activeBill = useMemo(
    () => activeOpenBills.find((bill) => bill.id === activeOpenBillId) ?? null,
    [activeOpenBillId, activeOpenBills]
  );

  useEffect(() => {
    if (activeOpenBills.length === 0) {
      if (activeOpenBillId) setActiveOpenBillId(null);
      return;
    }
    if (!activeBill) {
      setActiveOpenBillId(activeOpenBills[0].id);
    }
  }, [activeBill, activeOpenBillId, activeOpenBills, setActiveOpenBillId]);

  const selectedMember = activeBill
    ? members.find((member) => member.id === activeBill.memberId) ?? null
    : null;
  const totals = activeBill ? getOpenBillTotals(activeBill) : null;
  const nonEmptyGroups = activeBill?.groups.filter((group) => group.items.length > 0) ?? [];
  const hasBillItems = nonEmptyGroups.length > 0;
  const isCarryoverBill = Boolean(
    activeBill &&
    activeBill.originCashierShiftId &&
    activeCashierShift &&
    activeBill.originCashierShiftId !== activeCashierShift.id
  );
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

  const handleCreateBill = () => {
    if (!canTransact) {
      toast({
        title: 'Shift belum aktif',
        description: 'Buka shift kasir terlebih dahulu untuk memulai transaksi.',
      });
      return;
    }
    const bill = createOpenBill();
    if (!bill) return;
    setActiveOpenBillId(bill.id);
    setActiveFulfillment('dine-in');
    setSearchQuery('');
    setShowPayment(false);
  };

  const handleSelectBill = (billId: string) => {
    setActiveOpenBillId(billId);
    setShowOpenBillSelector(false);
    setShowPayment(false);
    setSelectedPayment(null);
    setPaymentRef('');
    setRefError('');
    setExpandedPaymentId(null);
  };

  const handleSaveDraft = async () => {
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
    if (!activeBill) return;
    setIsPrintingDraft(true);
    try {
      const savedBill = await saveOpenBillDraft(activeBill.id);
      const draftReceipt = await fetchOpenBillReceipt(savedBill.id);
      printDraftReceiptDirect(draftReceipt, settings, settings.paperSize);
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

  const handleOpenPayment = () => {
    if (isSubmittingPayment) return;
    if (!activeBill || !totals) return;
    if (!canTransact) {
      setRefError('Buka shift kasir terlebih dahulu untuk checkout.');
      return;
    }
    if (!hasBillItems) {
      toast({
        title: 'Belum ada item',
        description: 'Tambahkan item F&B terlebih dahulu sebelum checkout.',
      });
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
    setIsSubmittingPayment(true);
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
      setPrintCashier(true);
      setPrintKitchen(settings.printerSettings?.kitchen?.enabled ?? false);
      setSelectedPayment(null);
      setPaymentRef('');
      setRefError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan sistem saat memproses pembayaran.';
      setRefError(message);
      toast({
        title: 'Checkout Gagal',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePrintFromSuccessModal = () => {
    if (!lastOrder) return;
    if (printCashier) printReceiptDirect(lastOrder, settings, settings.printerSettings?.cashier?.paperSize ?? settings.paperSize);
    if (printKitchen) printKitchenReceiptFromOrder(lastOrder, settings, settings.printerSettings?.kitchen?.paperSize ?? '58mm');
  };

  const handleAddMember = () => {
    if (!activeBill || !newMemberName.trim()) return;
    const member = addMember({ code: '', name: newMemberName.trim(), phone: newMemberPhone.trim() });
    attachMemberToOpenBill(activeBill.id, member.id);
    setNewMemberName('');
    setNewMemberPhone('');
    setShowNewMember(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">

      <TabletPanel className="flex min-h-0 flex-col overflow-hidden p-0">
        {!activeBill || !totals ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <TabletActionButton
                tone="secondary"
                className="justify-center"
                onClick={() => setShowOpenBillSelector(true)}
              >
                <Receipt className="h-4 w-4" />
                Open Bill ({activeOpenBills.length})
              </TabletActionButton>
              <TabletActionButton className="justify-center" onClick={handleCreateBill} disabled={!canTransact}>
                <Plus className="h-4 w-4" />
                Buat Bill Baru
              </TabletActionButton>
            </div>
            <div className="w-full max-w-xl rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 p-6 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-base font-bold text-slate-950 dark:text-white">Pilih Open Bill untuk mulai</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Buka modal Open Bill untuk memilih bill aktif, atau buat bill baru untuk memulai transaksi.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-2.5 p-3 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="flex min-h-0 flex-col rounded-[16px] border border-slate-200 bg-slate-50/90 p-2.5 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2.5 space-y-2 rounded-[14px] border border-slate-200 bg-white/90 p-2.5 dark:border-white/10 dark:bg-slate-950/80">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
                    <button
                      onClick={() => setActiveFulfillment('dine-in')}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                        activeFulfillment === 'dine-in' ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      Dine-in
                    </button>
                    <button
                      onClick={() => setActiveFulfillment('takeaway')}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                        activeFulfillment === 'takeaway' ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Takeaway
                    </button>
                  </div>

                  {activeFulfillment === 'dine-in' && (
                    <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                      <Users className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      <select
                        value={activeGroup?.tableId ?? ''}
                        onChange={(event) => {
                          const value = parseInt(event.target.value, 10);
                          if (value) assignTableToOpenBill(activeBill.id, value);
                        }}
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none dark:text-white"
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
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`Cari menu untuk ${fulfillmentLabel(activeFulfillment).toLowerCase()}...`}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
            </div>

            <div className="flex min-h-0 flex-col rounded-[16px] border border-slate-200 bg-slate-50/90 p-2.5 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2.5 dark:border-white/10">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">Cart Aktif</p>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                      {activeBill.code}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {formatDateTime(activeBill.createdAt)} • {activeBill.customerName || 'Tanpa nama customer'} • {selectedMember?.name ?? 'Tanpa member'}
                  </p>
                  {isCarryoverBill && (
                    <div className="mt-2 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                      Transaksi sebelumnya{activeBill.originStaffName ? ` dari ${activeBill.originStaffName}` : ''}.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <TabletActionButton
                    tone="secondary"
                    className="justify-center"
                    onClick={() => setShowOpenBillSelector(true)}
                  >
                    <Receipt className="h-4 w-4" />
                    Open Bill
                  </TabletActionButton>
                  <TabletActionButton className="justify-center" onClick={handleCreateBill} disabled={!canTransact}>
                    <Plus className="h-4 w-4" />
                    Buat Bill Baru
                  </TabletActionButton>
                  <button
                    onClick={() => setIsBillMetaCollapsed((current) => !current)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    {isBillMetaCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    {isBillMetaCollapsed ? 'Detail' : 'Ringkas'}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {!isBillMetaCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 border-b border-slate-200 py-2.5 dark:border-white/10">
                      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Nama Customer / Catatan</label>
                          <input
                            type="text"
                            value={activeBill.customerName}
                            onChange={(event) => updateOpenBill(activeBill.id, { customerName: event.target.value })}
                            placeholder="Nama customer"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Member</label>
                          <div className="flex gap-2">
                            <select
                              value={activeBill.memberId ?? ''}
                              onChange={(event) => attachMemberToOpenBill(activeBill.id, event.target.value || null)}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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

                      <AnimatePresence initial={false}>
                        {showNewMember && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_1fr_auto]">
                              <input
                                type="text"
                                value={newMemberName}
                                onChange={(event) => setNewMemberName(event.target.value)}
                                placeholder="Nama member baru"
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                              />
                              <input
                                type="text"
                                value={newMemberPhone}
                                onChange={(event) => setNewMemberPhone(event.target.value)}
                                placeholder="Nomor telepon"
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                              />
                              <button
                                onClick={handleAddMember}
                                className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white"
                              >
                                Simpan
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {selectedMember && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
                          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                            <span>{selectedMember.name} • {selectedMember.pointsBalance} poin</span>
                            <span>{selectedMember.tier}</span>
                          </div>
                          <div className="mt-2">
                            <label className="mb-1 block text-[11px] font-medium text-amber-800 dark:text-amber-300">Redeem poin</label>
                            <input
                              type="number"
                              min="0"
                              value={activeBill.pointsToRedeem}
                              onChange={(event) =>
                                updateOpenBill(activeBill.id, {
                                  pointsToRedeem: Math.max(0, parseInt(event.target.value, 10) || 0),
                                })
                              }
                              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-amber-500/20 dark:bg-slate-950 dark:text-white"
                              placeholder="Redeem poin"
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="min-h-0 flex-1 overflow-y-auto py-2.5 pr-1">
                {!hasBillItems ? (
                  <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-400">
                    Belum ada item F&B. Tambahkan item dari panel menu.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nonEmptyGroups
                      .sort((a, b) => (a.fulfillmentType === 'dine-in' ? -1 : 1))
                      .map((group) => (
                        <div key={group.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80">
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{fulfillmentLabel(group.fulfillmentType)}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{group.tableName ?? 'Tanpa meja'}</p>
                            </div>
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-300">{formatRupiah(group.subtotal)}</p>
                          </div>
                          <div className="space-y-1.5 p-2.5">
                            {group.items.map((order) => {
                              const noteKey = `${group.fulfillmentType}-${order.menuItem.id}`;
                              const noteOpen = expandedNoteKeys.has(noteKey);
                              const hasNote = Boolean(order.note);
                              return (
                                <div key={order.menuItem.id} className="overflow-hidden rounded-lg bg-slate-50 dark:bg-white/5">
                                  <div className="flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap">
                                    <span className="text-lg">{order.menuItem.emoji}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{order.menuItem.name}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatRupiah(order.menuItem.price)} / item</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1">
                                      <button
                                        title={hasNote ? order.note : 'Tambah catatan'}
                                        onClick={() => setExpandedNoteKeys((prev) => {
                                          const next = new Set(prev);
                                          next.has(noteKey) ? next.delete(noteKey) : next.add(noteKey);
                                          return next;
                                        })}
                                        className={cn(
                                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                          hasNote
                                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20'
                                        )}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => updateOpenBillItemQuantity(activeBill.id, group.fulfillmentType, order.menuItem.id, order.quantity - 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="min-w-[26px] text-center text-sm font-bold text-slate-900 dark:text-white">{order.quantity}</span>
                                      <button
                                        onClick={() => updateOpenBillItemQuantity(activeBill.id, group.fulfillmentType, order.menuItem.id, order.quantity + 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeItemFromOpenBill(activeBill.id, group.fulfillmentType, order.menuItem.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <p className="w-full text-right text-sm font-bold text-slate-900 dark:text-white sm:w-[92px]">
                                      {formatRupiah(order.menuItem.price * order.quantity)}
                                    </p>
                                  </div>
                                  {noteOpen && (
                                    <div className="px-2 pb-2">
                                      <input
                                        type="text"
                                        autoFocus
                                        defaultValue={order.note ?? ''}
                                        placeholder="Catatan untuk item ini..."
                                        onBlur={(e) => updateOpenBillItemNote(activeBill.id, group.fulfillmentType, order.menuItem.id, e.target.value)}
                                        className="w-full rounded-md border border-orange-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400/60 dark:border-orange-500/30 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2.5 dark:border-white/10">
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
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
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Pajak</span>
                      <span>{formatRupiah(totals.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-amber-200 pt-2 text-base font-bold text-slate-900 dark:border-amber-500/20 dark:text-white">
                    <span>Total Bayar</span>
                    <span>{formatRupiah(totals.total)}</span>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[auto_auto_auto_auto_1fr]">
                  <button
                    onClick={() => deleteOpenBill(activeBill.id)}
                    disabled={isSavingDraft || isPrintingDraft || isSubmittingPayment}
                    className="rounded-xl bg-rose-100 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                  >
                    Hapus Bill
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isPrintingDraft || isSubmittingPayment}
                    className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isSavingDraft ? 'Menyimpan...' : 'Simpan Draft'}
                    </span>
                  </button>
                  <button
                    onClick={handlePrintDraft}
                    disabled={isSavingDraft || isPrintingDraft || isSubmittingPayment}
                    className="rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      {isPrintingDraft ? 'Menyiapkan...' : 'Cetak Draft'}
                    </span>
                  </button>
                  {hasBillItems && (
                    <button
                      onClick={() => activeBill && printKitchenReceiptFromBill(activeBill, settings, settings.printerSettings?.kitchen?.paperSize ?? '58mm')}
                      disabled={isSavingDraft || isPrintingDraft || isSubmittingPayment}
                      className="rounded-xl bg-orange-100 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        Cetak Dapur
                      </span>
                    </button>
                  )}
                  <button
                    onClick={handleOpenPayment}
                    disabled={!hasBillItems || isSavingDraft || isPrintingDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedPayment?.type === 'qris' ? <ScanQrCode className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    Checkout Open Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </TabletPanel>

      <AnimatePresence>
        {showOpenBillSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="mx-auto flex max-h-[calc(100vh-3rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-950/94"
            >
              <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Open Bill</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeOpenBills.length} bill aktif</p>
                  </div>
                  <button
                    onClick={() => setShowOpenBillSelector(false)}
                    className="rounded-lg bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                {activeOpenBills.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    Belum ada open bill aktif.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeOpenBills.map((bill) => {
                      const hasDineIn = bill.groups.some((group) => group.fulfillmentType === 'dine-in' && group.items.length > 0);
                      const hasTakeaway = bill.groups.some((group) => group.fulfillmentType === 'takeaway' && group.items.length > 0);
                      const billType = hasDineIn && hasTakeaway ? 'Mixed' : hasDineIn ? 'Dine-in' : hasTakeaway ? 'Takeaway' : 'Draft';
                      const totalItems = bill.groups.reduce(
                        (sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.quantity, 0),
                        0
                      );
                      const runningTotal = bill.groups.reduce(
                        (sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.menuItem.price * item.quantity, 0),
                        0
                      );
                      const isActive = activeBill?.id === bill.id;

                      return (
                        <button
                          key={bill.id}
                          onClick={() => handleSelectBill(bill.id)}
                          className={cn(
                            'w-full rounded-[18px] border px-4 py-3 text-left transition-colors',
                            isActive
                              ? 'border-orange-400 bg-orange-50 dark:border-orange-400/60 dark:bg-orange-500/10'
                              : 'border-slate-200 bg-slate-50/90 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black tracking-[-0.02em] text-slate-950 dark:text-white">{bill.code}</p>
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                                  {billType}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {totalItems} item • {formatBillElapsed(bill.createdAt)} • {formatDateTime(bill.createdAt)}
                              </p>
                            </div>
                            <p className="text-sm font-black text-slate-950 dark:text-white">{formatRupiah(runningTotal)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {lastOrder && (
          <motion.div
            key="checkout-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="mx-auto flex max-h-[calc(100vh-3rem)] w-full max-w-115 flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
            >
              {/* Header */}
              <div className="bg-linear-to-br from-emerald-500 to-emerald-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black">Pembayaran Berhasil</p>
                    <p className="text-sm text-emerald-100">
                      {lastOrder.tableName} • {lastOrder.paymentMethodName ?? '-'}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-100/80">{formatDateTime(lastOrder.endTime)}</p>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Items grouped by fulfillment */}
                {lastOrder.groups.filter((g) => g.items.length > 0).map((group) => (
                  <div key={group.id}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {group.fulfillmentType === 'dine-in' ? `Dine-in${group.tableName ? ` — ${group.tableName}` : ''}` : 'Takeaway'}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.menuItem.emoji} {item.menuItem.name}
                              <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">x{item.quantity}</span>
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(item.subtotal)}</span>
                          </div>
                          {item.note && (
                            <p className="ml-5 text-xs italic text-slate-400 dark:text-slate-500">↳ {item.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal pesanan</span>
                    <span>{formatRupiah(lastOrder.orderTotal)}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between border-t border-slate-200 pt-1.5 font-black text-slate-950 dark:border-white/10 dark:text-white">
                    <span>Total</span>
                    <span>{formatRupiah(lastOrder.grandTotal)}</span>
                  </div>
                </div>

                {/* Print options */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Opsi Cetak</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={printCashier}
                        onChange={(e) => setPrintCashier(e.target.checked)}
                        className="h-4 w-4 accent-slate-900 dark:accent-white"
                      />
                      <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Struk Kasir</span>
                      <span className="text-xs text-slate-400">{settings.printerSettings?.cashier?.paperSize ?? settings.paperSize}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={printKitchen}
                        onChange={(e) => setPrintKitchen(e.target.checked)}
                        className="h-4 w-4 accent-orange-500"
                      />
                      <ChefHat className="h-4 w-4 text-orange-500" />
                      <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Struk Dapur</span>
                      <span className="text-xs text-slate-400">{settings.printerSettings?.kitchen?.paperSize ?? '58mm'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 border-t border-slate-200 px-5 py-4 dark:border-white/10">
                <button
                  onClick={handlePrintFromSuccessModal}
                  disabled={!printCashier && !printKitchen}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Struk
                </button>
                <button
                  onClick={() => setLastOrder(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPayment && activeBill && totals && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="mx-auto flex max-h-[calc(100vh-3rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/95 dark:border-white/10 dark:bg-slate-950/94"
            >
              <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Metode Pembayaran</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeBill.code}</p>
                  </div>
                  <button
                    onClick={() => { if (!isSubmittingPayment) setShowPayment(false); }}
                    disabled={isSubmittingPayment}
                    className="rounded-lg bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                </div>
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-xs text-amber-700 dark:text-amber-300">Total Tagihan</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-200">{formatRupiah(totals.total)}</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {activePaymentOptions.map((payment) => {
                  const childOptions = paymentChildren.filter((child) => child.parentId === payment.id);
                  const selectedChild = childOptions.find((child) => child.id === selectedPayment?.id) ?? null;
                  const isSelected = selectedPayment?.id === payment.id || Boolean(selectedChild);
                  const isExpanded = expandedPaymentId === payment.id;

                  return (
                    <div key={payment.id} className="space-y-2">
                      <button
                        disabled={isSubmittingPayment}
                        onClick={() => {
                          if (isSubmittingPayment) return;
                          if (payment.isGroup) {
                            setExpandedPaymentId((prev) => (prev === payment.id ? null : payment.id));
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
                          'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20'
                        )}
                      >
                        <span className="text-2xl">{payment.icon}</span>
                        <div className="flex-1">
                          <p className={cn('text-sm font-bold', isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white')}>
                            {payment.name}
                          </p>
                          {selectedChild && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Dipilih: {selectedChild.name}</p>
                          )}
                          {!selectedChild && payment.requiresReference && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{payment.referenceLabel}</p>
                          )}
                          {payment.isGroup && childOptions.length > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{childOptions.length} sub opsi</p>
                          )}
                        </div>
                        <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded ? 'rotate-90 text-emerald-500' : 'text-slate-400 dark:text-slate-500')} />
                      </button>
                      {payment.isGroup && isExpanded && childOptions.length > 0 && (
                        <div className="space-y-2 pl-4">
                          {childOptions.map((child) => {
                            const isChildSelected = selectedPayment?.id === child.id;
                            return (
                              <button
                                key={child.id}
                                disabled={isSubmittingPayment}
                                onClick={() => {
                                  if (isSubmittingPayment) return;
                                  setSelectedPayment(child);
                                  setPaymentRef('');
                                  setRefError('');
                                }}
                                className={cn(
                                  'w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
                                  isChildSelected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300'
                                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:border-white/20'
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden px-4 pb-3"
                  >
                    <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                      {selectedPayment.referenceLabel}
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      disabled={isSubmittingPayment}
                      onChange={(event) => {
                        setPaymentRef(event.target.value);
                        setRefError('');
                      }}
                      placeholder={selectedPayment.referenceLabel}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                    />
                    {refError && <p className="mt-1 text-xs text-rose-500">{refError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {refError && !selectedPayment?.requiresReference && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-rose-500">{refError}</p>
                </div>
              )}

              <div className="border-t border-slate-200 px-4 py-4 dark:border-white/10">
                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPayment || isSubmittingPayment}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {isSubmittingPayment ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryTab() {
  const { orderHistory, refundOrder, settings, canTransact } = usePos();
  const { currentStaff, verifyAdminPin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<HistoryFilterStatus>('all');
  const [filterSession, setFilterSession] = useState<HistorySessionFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refundState, setRefundState] = useState<{
    orderId: string;
    step: RefundStep;
    reason: string;
    pin: string;
    pinError: string;
    email: string;
    submitting: boolean;
  } | null>(null);

  const filteredOrders = useMemo(() => {
    return orderHistory.filter((order) => {
      if (filterStatus === 'completed' && order.status !== 'completed') return false;
      if (filterStatus === 'refunded' && order.status !== 'refunded') return false;
      if (filterSession === 'billiard' && order.sessionType !== 'billiard') return false;
      if (filterSession === 'cafe' && order.sessionType !== 'cafe') return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        order.tableName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.servedBy.toLowerCase().includes(q) ||
        order.orders.some((item) => item.menuItem.name.toLowerCase().includes(q))
      );
    });
  }, [filterSession, filterStatus, orderHistory, searchQuery]);

  const completedOrders = orderHistory.filter((order) => order.status === 'completed');
  const refundedOrders = orderHistory.filter((order) => order.status === 'refunded');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.grandTotal, 0);
  const totalRefunds = refundedOrders.reduce((sum, order) => sum + order.grandTotal, 0);

  const handleOpenRefund = (order: OrderHistory) => {
    if (!currentStaff || order.status === 'refunded') return;
    setRefundState({
      orderId: order.id,
      step: currentStaff.role === 'admin' ? 'confirm' : 'auth-choice',
      reason: '',
      pin: '',
      pinError: '',
      email: '',
      submitting: false,
    });
  };

  const handleVerifyPin = async () => {
    if (!refundState) return;
    const valid = await verifyAdminPin(refundState.pin);
    if (valid) {
      setRefundState((current) => (current ? { ...current, step: 'confirm', pinError: '' } : null));
      return;
    }
    setRefundState((current) =>
      current
        ? { ...current, pinError: 'PIN admin salah. Coba lagi atau kirim email.' }
        : null
    );
  };

  const handleRefundNow = async () => {
    if (!refundState || !currentStaff || !refundState.reason.trim() || refundState.submitting) return;
    if (!canTransact) {
      setRefundState((current) =>
        current
          ? { ...current, step: 'pin', pinError: 'Buka shift kasir terlebih dahulu untuk refund.' }
          : null
      );
      return;
    }
    setRefundState((current) => (current ? { ...current, submitting: true } : null));

    try {
      await refundOrder(refundState.orderId, refundState.reason, { id: currentStaff.id, name: currentStaff.name });
      setRefundState((current) => (current ? { ...current, step: 'success', submitting: false } : null));
      toast({
        title: 'Refund berhasil',
        description: 'Alasan / remarks refund tersimpan ke database.',
      });
    } catch (error) {
      setRefundState((current) => (current ? { ...current, submitting: false } : null));
      toast({
        title: 'Refund gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses refund.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      <div className="grid grid-cols-3 gap-4">
        <PosMetricCard
          icon={<Receipt className="h-5 w-5" />}
          label="Transaksi"
          value={`${orderHistory.length}`}
          subtitle="Seluruh riwayat"
          tone="info"
        />
        <PosMetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pendapatan"
          value={formatRupiah(totalRevenue)}
          subtitle="Transaksi selesai"
          tone="success"
        />
        <PosMetricCard
          icon={<LogOut className="h-5 w-5" />}
          label="Refund"
          value={formatRupiah(totalRefunds)}
          subtitle={`${refundedOrders.length} transaksi`}
          tone="warning"
        />
      </div>

      <TabletPanel className="flex min-h-0 flex-col overflow-hidden">
        <TabletSectionHeader
          icon={Receipt}
          title="Recent Transactions"
          subtitle="Filter, detail, cetak ulang struk, dan refund langsung dari halaman ini."
        />

        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari meja, kasir, menu..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            {(['all', 'completed', 'refunded'] as HistoryFilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold transition-colors',
                  filterStatus === status
                    ? status === 'all'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                )}
              >
                {status === 'all' ? 'Semua' : status === 'completed' ? 'Selesai' : 'Refund'}
              </button>
            ))}
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
            {(['all', 'billiard', 'cafe'] as HistorySessionFilter[]).map((session) => (
              <button
                key={session}
                onClick={() => setFilterSession(session)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold transition-colors',
                  filterSession === session
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                )}
              >
                {session === 'all' ? 'Semua Sesi' : session === 'billiard' ? 'Billiard' : 'Cafe'}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            Belum ada transaksi sesuai filter.
          </div>
        ) : (
          <TabletScrollArea className="space-y-2">
            {filteredOrders.map((order) => {
              const expanded = expandedId === order.id;
              const activeRefund = refundState?.orderId === order.id ? refundState : null;
              const isRefunded = order.status === 'refunded';

              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-[20px] border bg-white/85 px-4 py-3 shadow-sm dark:bg-white/5',
                    isRefunded ? 'border-rose-200 dark:border-rose-500/20' : 'border-slate-200 dark:border-white/10'
                  )}
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{order.tableName}</p>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                            isRefunded ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                          )}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(order.createdAt)} • {order.servedBy} • {order.sessionType}
                        {order.sessionType === 'billiard' && order.durationMinutes > 0 ? ` • ${formatDuration(order.durationMinutes)}` : ''}
                      </p>
                      {order.isContinuedFromPreviousShift && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300">
                          Transaksi Sebelumnya{order.originStaffName ? ` • ${order.originStaffName}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={cn('text-sm font-black', isRefunded ? 'text-rose-500 dark:text-rose-300 line-through' : 'text-slate-950 dark:text-white')}>
                        {formatRupiah(order.grandTotal)}
                      </p>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                          {order.orders.length > 0 && (
                            <div className="space-y-1.5 rounded-[18px] bg-slate-50/90 p-3 dark:bg-white/5">
                              {order.orders.map((item, idx) => (
                                <div key={`${order.id}-${item.menuItem.id}-${idx}`}>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {item.menuItem.emoji} {item.menuItem.name} x{item.quantity}
                                    </span>
                                    <span className="font-semibold text-slate-950 dark:text-white">{formatRupiah(item.subtotal)}</span>
                                  </div>
                                  {item.note && (
                                    <p className="ml-6 text-xs text-slate-400 dark:text-slate-500 italic">↳ {item.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1.5 rounded-[18px] bg-slate-50/90 p-3 text-xs dark:bg-white/5">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                              <span>Kasir terlibat</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{order.involvedStaffNames.join(' -> ')}</span>
                            </div>
                            {order.sessionType === 'billiard' && (
                              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Sewa meja</span>
                                <span>{formatRupiah(order.rentalCost)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                              <span>Pesanan</span>
                              <span>{formatRupiah(order.orderTotal)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-black text-slate-950 dark:border-white/10 dark:text-white">
                              <span>Total</span>
                              <span>{formatRupiah(order.grandTotal)}</span>
                            </div>
                          </div>

                          {isRefunded && (
                            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs dark:border-rose-500/20 dark:bg-rose-500/10">
                              <p className="font-semibold text-rose-700 dark:text-rose-300">
                                Refund oleh {order.refundedBy ?? '-'}
                              </p>
                              <p className="mt-1 text-rose-600 dark:text-rose-300/90">
                                {order.refundedAt ? formatDateTime(order.refundedAt) : '-'}
                              </p>
                              <p className="mt-1 font-semibold text-rose-700 dark:text-rose-300">
                                Alasan / Remarks Refund
                              </p>
                              <p className="mt-1 text-rose-600 dark:text-rose-300/90">
                                {order.refundReason?.trim() || '-'}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <TabletActionButton
                              tone="secondary"
                              className="flex-1 justify-center"
                              onClick={() => printReceiptDirect(order, settings, settings.paperSize)}
                            >
                              <Printer className="h-4 w-4" />
                              Cetak Struk
                            </TabletActionButton>
                            {!isRefunded && (
                              <TabletActionButton
                                tone="danger"
                                className="flex-1 justify-center"
                                onClick={() => handleOpenRefund(order)}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Refund
                              </TabletActionButton>
                            )}
                          </div>

                          {activeRefund && (
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                              {activeRefund.step === 'auth-choice' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Verifikasi Refund</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Pilih otorisasi admin/owner sebelum refund.
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <TabletActionButton
                                      tone="secondary"
                                      className="justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'pin' } : null))}
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                      PIN Admin
                                    </TabletActionButton>
                                    <TabletActionButton
                                      tone="secondary"
                                      className="justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'email' } : null))}
                                    >
                                      <Mail className="h-4 w-4" />
                                      Email Owner
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'pin' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Masukkan PIN Admin</p>
                                  <input
                                    type="password"
                                    inputMode="numeric"
                                    value={activeRefund.pin}
                                    onChange={(event) =>
                                      setRefundState((current) =>
                                        current ? { ...current, pin: event.target.value, pinError: '' } : null
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                                    placeholder="PIN admin"
                                  />
                                  {activeRefund.pinError && (
                                    <p className="text-xs text-rose-500 dark:text-rose-300">{activeRefund.pinError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <TabletActionButton
                                      tone="secondary"
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'auth-choice' } : null))}
                                    >
                                      Kembali
                                    </TabletActionButton>
                                    <TabletActionButton className="flex-1 justify-center" onClick={handleVerifyPin}>
                                      Verifikasi
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'email' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Kirim Permintaan ke Owner</p>
                                  <input
                                    type="email"
                                    value={activeRefund.email}
                                    onChange={(event) =>
                                      setRefundState((current) => (current ? { ...current, email: event.target.value } : null))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                                    placeholder="opsional: email owner"
                                  />
                                  <div className="flex gap-2">
                                    <TabletActionButton
                                      tone="secondary"
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'auth-choice' } : null))}
                                    >
                                      Kembali
                                    </TabletActionButton>
                                    <TabletActionButton
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'email-sent' } : null))}
                                    >
                                      Kirim Email
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'email-sent' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Permintaan Terkirim</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Permintaan refund sudah dikirim ke owner. Menunggu otorisasi.
                                  </p>
                                  <TabletActionButton
                                    tone="secondary"
                                    className="w-full justify-center"
                                    onClick={() => setRefundState(null)}
                                  >
                                    Tutup
                                  </TabletActionButton>
                                </div>
                              )}

                              {activeRefund.step === 'confirm' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <p className="text-sm font-bold">Konfirmasi Refund</p>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Lanjutkan ke alasan refund sebelum proses final.
                                  </p>
                                  <div className="flex gap-2">
                                    <TabletActionButton
                                      tone="secondary"
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState(null)}
                                    >
                                      Batal
                                    </TabletActionButton>
                                    <TabletActionButton
                                      tone="danger"
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'reason' } : null))}
                                    >
                                      Lanjutkan
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'reason' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Alasan / Remarks Refund</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Wajib diisi dan akan disimpan ke database sebagai catatan audit refund.
                                  </p>
                                  <textarea
                                    rows={3}
                                    value={activeRefund.reason}
                                    onChange={(event) =>
                                      setRefundState((current) => (current ? { ...current, reason: event.target.value } : null))
                                    }
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                                    placeholder="Contoh: pesanan salah, customer komplain, dll."
                                  />
                                  <div className="flex gap-2">
                                    <TabletActionButton
                                      tone="secondary"
                                      className="flex-1 justify-center"
                                      onClick={() => setRefundState((current) => (current ? { ...current, step: 'confirm' } : null))}
                                    >
                                      Kembali
                                    </TabletActionButton>
                                    <TabletActionButton
                                      tone="danger"
                                      className="flex-1 justify-center"
                                      onClick={handleRefundNow}
                                      disabled={!activeRefund.reason.trim() || activeRefund.submitting}
                                    >
                                      Refund Sekarang
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'success' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Refund berhasil diproses.</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Alasan / remarks refund sudah tersimpan ke database.
                                  </p>
                                  <TabletActionButton
                                    tone="secondary"
                                    className="w-full justify-center"
                                    onClick={() => setRefundState(null)}
                                  >
                                    Tutup
                                  </TabletActionButton>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </TabletScrollArea>
        )}
      </TabletPanel>
    </div>
  );
}

function PosBottomTabs({
  activeTab,
  onChange,
}: {
  activeTab: PosTab;
  onChange: (tab: PosTab) => void;
}) {
  const tabs: Array<{ id: PosTab; label: string; icon: React.ElementType }> = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'tables', label: 'Tables', icon: Armchair },
    { id: 'orders', label: 'Orders', icon: UtensilsCrossed },
    { id: 'history', label: 'History', icon: Receipt },
  ];

  return (
    <div className="border-t border-white/70 bg-white/88 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/72">
      <div className="mx-auto grid max-w-[620px] grid-cols-4 gap-2 rounded-[28px] border border-slate-200 bg-slate-50/90 p-2 dark:border-white/10 dark:bg-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-2 text-xs font-bold transition-colors',
                active
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PosDashboard({
  viewport,
  onGoAdmin,
  onSwitchStaff,
  onLogout,
}: {
  viewport: TabletViewportState;
  onGoAdmin: () => void;
  onSwitchStaff: () => void;
  onLogout: () => void;
}) {
  const {
    tables,
    orderHistory,
    waitingList,
    tableLayout,
    resetTableLayout,
    createOpenBill,
    setActiveOpenBillId,
    markPackageReminderShown,
    activeCashierShift,
    canTransact,
  } = usePos();
  const { currentStaff } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PosTab>('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'open' | 'close' | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [dismissedRequiredShiftKey, setDismissedRequiredShiftKey] = useState<string | null>(null);
  const layoutBoardRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const shellMode = viewport.appShellMode;
  const isAdmin = currentStaff?.role === 'admin';
  const totalTables = tables.length;
  const availableTables = tables.filter((table) => table.status === 'available').length;
  const activeSessions = tables.filter((table) => table.status === 'occupied');
  const openBillCount = activeSessions.filter((table) => table.billingMode === 'open-bill').length;
  const totalRevenue = orderHistory
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + order.grandTotal, 0);
  const waitingCount = waitingList.filter((entry) => entry.status === 'waiting').length;
  const isShiftOwnedByCurrentStaff = Boolean(currentStaff && activeCashierShift && activeCashierShift.staffId === currentStaff.id);
  const requiredShiftModalMode: 'open' | null = currentStaff
    ? !activeCashierShift
      ? 'open'
      : null
    : null;
  const requiredShiftKey = requiredShiftModalMode
    ? `${requiredShiftModalMode}:${activeCashierShift?.id ?? 'none'}:${currentStaff?.id ?? 'none'}`
    : null;
  const shiftGuardRequired = Boolean(requiredShiftKey && dismissedRequiredShiftKey !== requiredShiftKey);
  const resolvedShiftModalMode = shiftGuardRequired ? requiredShiftModalMode : shiftModalMode;
  const shiftOpenedAt = activeCashierShift?.openedAt ? new Date(activeCashierShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

  useEffect(() => {
    const candidate = tables.find((table) => {
      if (
        table.status !== 'occupied' ||
        table.billingMode !== 'package' ||
        !table.startTime ||
        table.selectedPackageHours <= 0 ||
        table.packageReminderShownAt
      ) {
        return false;
      }

      const elapsedMinutes = Math.floor((Date.now() - new Date(table.startTime).getTime()) / 60000);
      const remainingMinutes = table.selectedPackageHours * 60 - elapsedMinutes;
      return remainingMinutes > 0 && remainingMinutes <= 30;
    });

    if (!candidate) return;

    const elapsedMinutes = Math.floor((Date.now() - new Date(candidate.startTime as Date).getTime()) / 60000);
    const remainingMinutes = Math.max(1, candidate.selectedPackageHours * 60 - elapsedMinutes);
    toast({
      title: `Reminder ${candidate.name}`,
      description: `${candidate.selectedPackageName ?? 'Paket Jam'} akan habis dalam ${remainingMinutes} menit.`,
    });
    markPackageReminderShown(candidate.id);
  }, [markPackageReminderShown, tables, toast]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current?.contains(target)) return;
      setShowUserMenu(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const ordersFullMode = activeTab === 'orders';
  const shellPadding = shellMode === 'wide' ? 'px-6 py-5' : 'px-4 py-4';
  const resolvedHeaderPadding = ordersFullMode ? 'px-4 py-3' : shellPadding;
  const resolvedMainPadding = ordersFullMode ? 'px-0 py-0' : shellPadding;

  const openCafeOrder = () => {
    if (!canTransact) {
      toast({
        title: 'Shift belum aktif',
        description: 'Buka shift kasir terlebih dahulu untuk memulai transaksi.',
      });
      return;
    }
    const bill = createOpenBill();
    if (!bill) return;
    setActiveOpenBillId(bill.id);
    setActiveTab('orders');
  };

  const handleSwitchStaff = useCallback(() => {
    setShowUserMenu(false);
    setShiftModalMode(null);
    onSwitchStaff();
  }, [onSwitchStaff]);

  const handleLogout = useCallback(() => {
    setShowUserMenu(false);
    setShiftModalMode(null);
    onLogout();
  }, [onLogout]);

  return (
    <div
      className={cn(
        'h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fbfcfe,_#eef2ff)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a)]',
        ordersFullMode ? 'p-0' : 'p-3'
      )}
    >
      <ActionModal />
      {resolvedShiftModalMode && (
        <CashierShiftModal
          key={resolvedShiftModalMode}
          isOpen
          mode={resolvedShiftModalMode}
          onRequestSwitchStaff={() => {
            handleSwitchStaff();
          }}
          onSuccess={() => {
            toast({
              title: resolvedShiftModalMode === 'open' ? 'Shift dibuka' : 'Shift ditutup',
              description: 'Status sesi kasir telah diperbarui.',
            });
          }}
          onClose={() => {
            if (shiftGuardRequired && requiredShiftKey) {
              setDismissedRequiredShiftKey(requiredShiftKey);
            }
            setShiftModalMode(null);
          }}
        />
      )}
      <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} />

      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden bg-white/94 backdrop-blur dark:bg-slate-950/90',
          ordersFullMode
            ? 'max-w-none rounded-none border-0 shadow-none'
            : 'mx-auto max-w-[1680px] rounded-[36px] border border-white/80 shadow-[0_36px_120px_rgba(15,23,42,0.18)] dark:border-white/10'
        )}
      >
        <header className={cn('border-b border-white/70 dark:border-white/10', resolvedHeaderPadding)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
                <CircleDot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                  Pos Mobile App
                </p>
                <h1 className="truncate text-[24px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                  Kasir Workspace
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5 md:flex">
                <span
                  className={cn(
                    'inline-block h-2.5 w-2.5 rounded-full',
                    canTransact ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {activeCashierShift
                    ? `Shift ${activeCashierShift.staffName} • ${shiftOpenedAt}`
                    : 'Belum ada shift aktif'}
                </span>
              </div>

              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5 md:flex">
                <Clock className="h-4 w-4 animate-pulse text-amber-500 dark:text-amber-400" />
                <span className="text-sm font-mono font-semibold text-slate-950 dark:text-white" id="live-clock"></span>
              </div>

              <ThemeToggle />

              {!activeCashierShift && (
                <TabletActionButton tone="secondary" onClick={() => setShiftModalMode('open')}>
                  <CreditCard className="h-4 w-4" />
                  Buka Shift
                </TabletActionButton>
              )}

              {activeCashierShift && isShiftOwnedByCurrentStaff && (
                <TabletActionButton tone="secondary" onClick={() => setShiftModalMode('close')}>
                  <ShieldCheck className="h-4 w-4" />
                  Tutup Shift
                </TabletActionButton>
              )}

              {activeCashierShift && (
                <TabletActionButton tone="secondary" onClick={() => setShowExpenseModal(true)}>
                  <Wallet className="h-4 w-4" />
                  Pengeluaran
                </TabletActionButton>
              )}

              {isAdmin && (
                <TabletActionButton tone="secondary" onClick={onGoAdmin}>
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </TabletActionButton>
              )}

              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((current) => !current)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-black text-white dark:border-white/10"
                >
                  {currentStaff?.avatar ?? '?'}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
                    >
                      <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        <p className="text-sm font-bold text-slate-950 dark:text-white">{currentStaff?.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          {currentStaff?.role}
                        </p>
                      </div>
                      <div className="p-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              onGoAdmin();
                            }}
                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                          >
                            <Settings className="h-4 w-4" />
                            Admin Panel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            handleSwitchStaff();
                          }}
                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Ganti Staff
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className={cn('min-h-0 flex-1 overflow-hidden', resolvedMainPadding)}>
          {!canTransact && currentStaff && (
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
                ordersFullMode ? 'mx-3 mt-3 mb-0' : 'mb-3'
              )}
            >
              <span>
                {activeCashierShift && activeCashierShift.staffId !== currentStaff.id
                  ? `Transaksi dikunci. Shift aktif milik ${activeCashierShift.staffName}. Kasir tersebut harus login dan tutup shift terlebih dahulu.`
                  : 'Transaksi dikunci. Silakan buka shift kasir terlebih dahulu.'}
              </span>
              {activeCashierShift && activeCashierShift.staffId !== currentStaff.id && (
                <button
                  type="button"
                  onClick={handleSwitchStaff}
                  className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-400/30 dark:text-amber-300 dark:hover:bg-amber-500/20"
                >
                  Ganti Staff
                </button>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex h-full min-h-0 flex-col"
            >
              {activeTab === 'home' && (
                <HomeTab
                  activeSessions={activeSessions}
                  availableTables={availableTables}
                  openBillCount={openBillCount}
                  totalRevenue={totalRevenue}
                  waitingCount={waitingCount}
                  totalTables={totalTables}
                  canTransact={canTransact}
                  isAdmin={isAdmin}
                  onGoAdmin={onGoAdmin}
                  onOpenCafe={openCafeOrder}
                  onTabChange={setActiveTab}
                />
              )}

              {activeTab === 'tables' && (
                <TablesTab
                  mode={shellMode}
                  tables={tables}
                  tableLayout={tableLayout}
                  layoutBoardRef={layoutBoardRef}
                  isLayoutEditMode={isLayoutEditMode}
                  onToggleLayoutEdit={() => setIsLayoutEditMode((current) => !current)}
                  onResetLayout={resetTableLayout}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersTab />
              )}

              {activeTab === 'history' && (
                <HistoryTab />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <PosBottomTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}

function AdminPanel({
  viewport,
  onBackToPos,
  onSwitchStaff,
  onLogout,
}: {
  viewport: TabletViewportState;
  onBackToPos: () => void;
  onSwitchStaff: () => void;
  onLogout: () => void;
}) {
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');

  const renderPage = () => {
    switch (adminPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'tables':
        return <AdminTables />;
      case 'menu':
        return <AdminMenu />;
      case 'inventory':
        return <AdminInventory />;
      case 'orders':
        return <AdminOrders />;
      case 'staff':
        return <AdminStaff />;
      case 'reports':
        return <AdminReports />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout
      currentPage={adminPage}
      onNavigate={setAdminPage}
      onBackToPos={onBackToPos}
      onSwitchStaff={onSwitchStaff}
      onLogout={onLogout}
      shellMode={viewport.appShellMode}
    >
      {renderPage()}
    </AdminLayout>
  );
}

type AppView = 'login' | 'pos' | 'admin';

export type PosRouteMode = 'app' | 'login';

interface PosAppShellProps {
  routeMode?: PosRouteMode;
}

function AppController({ routeMode }: { routeMode: PosRouteMode }) {
  const router = useRouter();
  const { isAuthenticated, authReady, logoutStaff, logout, currentStaff } = useAuth();
  const viewport = useTabletViewport();
  const [view, setView] = useState<AppView>('login');

  const handleLogin = () => {
    if (routeMode === 'login') {
      router.replace('/app');
      return;
    }
    setView('pos');
  };

  const handleSwitchStaff = () => {
    void logoutStaff();
    setView('login');
  };

  const handleLogout = () => {
    void logout();
    setView('login');
  };

  const handleGoAdmin = () => {
    setView('admin');
  };

  const handleBackToPos = () => {
    setView('pos');
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const element = document.getElementById('live-clock');
      if (element) {
        element.textContent = `${hours}:${minutes}:${seconds}`;
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (routeMode === 'login' && authReady && isAuthenticated) {
      router.replace('/app');
    }
  }, [authReady, isAuthenticated, routeMode, router]);

  const resolvedView: AppView | 'loading' = !authReady
    ? 'loading'
    : !isAuthenticated
      ? 'login'
        : view === 'login'
          ? 'pos'
          : view;

  if (routeMode === 'login' && authReady && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-gray-900">
          Mengalihkan ke aplikasi...
        </div>
      </div>
    );
  }

  if (!viewport.isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-gray-900">
          Menyiapkan tampilan tablet...
        </div>
      </div>
    );
  }

  if (!viewport.isAllowed) {
    return <TabletAccessGate viewport={viewport} />;
  }

  if (resolvedView === 'pos' && isAuthenticated) {
    return <PosDashboard viewport={viewport} onGoAdmin={handleGoAdmin} onSwitchStaff={handleSwitchStaff} onLogout={handleLogout} />;
  }

  if (resolvedView === 'admin' && isAuthenticated && currentStaff?.role === 'admin') {
    return <AdminPanel viewport={viewport} onBackToPos={handleBackToPos} onSwitchStaff={handleSwitchStaff} onLogout={handleLogout} />;
  }

  return (
    <TabletShell
      isDesktopFallback={viewport.isDesktopFallback}
      maxWidth={viewport.shellMaxWidth}
      layoutMode={viewport.layoutMode}
      canvasHeight={viewport.canvasHeight}
    >
      <AnimatePresence mode="wait">
        {resolvedView === 'loading' && (
          <motion.div
            key="auth-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <div className="flex min-h-full items-center justify-center bg-gray-50 dark:bg-gray-950">
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-gray-900">
                Memulihkan sesi kasir...
              </div>
            </div>
          </motion.div>
        )}

        {resolvedView === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        )}
      </AnimatePresence>
    </TabletShell>
  );
}

export default function PosAppShell({ routeMode = 'app' }: PosAppShellProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PosProvider>
          <AppController routeMode={routeMode} />
        </PosProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
