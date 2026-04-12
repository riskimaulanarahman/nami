'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Armchair,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  CreditCard,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Timer,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  PosProvider,
  usePos,
  type CashierShift,
  type OpenBill,
  type OrderHistory,
  type Table,
  type TableLayoutPosition,
} from '@/context/PosContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import TableCard from '@/components/pos/TableCard';
import ActionModal from '@/components/pos/ActionModal';
import CafeOrderModal from '@/components/pos/CafeOrderModal';
import CashierShiftModal from '@/components/pos/CashierShiftModal';
import { printReceiptDirect } from '@/components/pos/PrintReceipt';
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

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [preferredTableType, setPreferredTableType] = useState<'any' | 'standard' | 'vip'>('any');
  const [seatSelections, setSeatSelections] = useState<Record<string, string>>({});

  const waitingEntries = waitingList.filter((entry) => entry.status === 'waiting');
  const availableTables = tables.filter((table) => table.status === 'available');

  const handleAdd = () => {
    if (!customerName.trim()) return;

    addWaitingListEntry({
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
  };

  return (
    <TabletPanel className="flex h-full min-h-0 flex-col overflow-hidden">
      <TabletSectionHeader
        icon={Users}
        title="Waiting List"
        subtitle={`${waitingEntries.length} customer menunggu meja.`}
      />

      {showForm && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
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
          <TabletActionButton className="col-span-2 justify-center" onClick={handleAdd}>
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
                      const selectedValue = parseInt(seatSelections[entry.id] ?? '', 10);
                      if (!selectedValue) return;
                      const tableId = seatWaitingListEntry(entry.id, selectedValue);
                      if (tableId) setActiveModalTableId(tableId);
                    }}
                    className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    Seat
                  </button>
                  <button
                    onClick={() => cancelWaitingListEntry(entry.id)}
                    className="rounded-2xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  >
                    Batal
                  </button>
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
              <TabletActionButton className="justify-center" onClick={onOpenCafe} disabled={!canTransact}>
                <UtensilsCrossed className="h-4 w-4" />
                Open Bill Cafe
              </TabletActionButton>
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
      <TabletPanel className="flex min-h-0 flex-col overflow-hidden p-0">
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

function OrdersTab({
  openBills,
  activeCashierShift,
  canTransact,
  onOpenCafe,
  onResumeBill,
}: {
  openBills: OpenBill[];
  activeCashierShift: CashierShift | null;
  canTransact: boolean;
  onOpenCafe: () => void;
  onResumeBill: (billId: string) => void;
}) {
  const activeOpenBills = useMemo(() => openBills.filter((bill) => bill.status === 'open'), [openBills]);

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      <TabletPanel>
        <TabletSectionHeader
          icon={UtensilsCrossed}
          title="Manage Orders F&B"
          subtitle="Fokus ke open bill dine-in/takeaway untuk operasional kasir."
        />
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="rounded-[22px] bg-slate-50/90 px-4 py-3 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Open Bill Aktif</p>
            <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{activeOpenBills.length}</p>
          </div>
          <TabletActionButton className="h-full justify-center px-6" onClick={onOpenCafe} disabled={!canTransact}>
            <Plus className="h-4 w-4" />
            Buka Pesanan Cafe
          </TabletActionButton>
        </div>
      </TabletPanel>

      <TabletPanel className="flex min-h-0 flex-col overflow-hidden">
        <TabletSectionHeader
          icon={Receipt}
          title="Daftar Open Bill F&B"
          subtitle="Lanjutkan bill yang sudah berjalan dari daftar ini."
        />
        {activeOpenBills.length === 0 ? (
          <div className="flex h-full min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            Belum ada open bill F&B aktif.
          </div>
        ) : (
          <TabletScrollArea className="space-y-2">
            {activeOpenBills.map((bill) => {
              const hasDineIn = bill.groups.some((group) => group.fulfillmentType === 'dine-in' && group.items.length > 0);
              const hasTakeaway = bill.groups.some((group) => group.fulfillmentType === 'takeaway' && group.items.length > 0);
              const billType = hasDineIn && hasTakeaway ? 'Mixed' : hasDineIn ? 'Dine-in' : hasTakeaway ? 'Takeaway' : 'Draft';
              const isCarryover = Boolean(
                bill.originCashierShiftId &&
                activeCashierShift &&
                bill.originCashierShiftId !== activeCashierShift.id
              );
              const totalItems = bill.groups.reduce(
                (sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.quantity, 0),
                0
              );
              const runningTotal = bill.groups.reduce(
                (sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.menuItem.price * item.quantity, 0),
                0
              );

              return (
                <div
                  key={bill.id}
                  className="rounded-[20px] border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
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
                      {isCarryover && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                          Transaksi Sebelumnya{bill.originStaffName ? ` • ${bill.originStaffName}` : ''}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">{formatRupiah(runningTotal)}</p>
                  </div>
                  <TabletActionButton
                    tone="secondary"
                    className="mt-3 w-full justify-center"
                    onClick={() => onResumeBill(bill.id)}
                  >
                    Lanjutkan
                  </TabletActionButton>
                </div>
              );
            })}
          </TabletScrollArea>
        )}
      </TabletPanel>
    </div>
  );
}

function HistoryTab() {
  const { orderHistory, refundOrder, settings, canTransact } = usePos();
  const { currentStaff, verifyAdminPin } = useAuth();
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
    });
  };

  const handleVerifyPin = () => {
    if (!refundState) return;
    if (verifyAdminPin(refundState.pin)) {
      setRefundState((current) => (current ? { ...current, step: 'confirm', pinError: '' } : null));
      return;
    }
    setRefundState((current) =>
      current
        ? { ...current, pinError: 'PIN admin salah. Coba lagi atau kirim email.' }
        : null
    );
  };

  const handleRefundNow = () => {
    if (!refundState || !currentStaff || !refundState.reason.trim()) return;
    if (!canTransact) {
      setRefundState((current) =>
        current
          ? { ...current, step: 'pin', pinError: 'Buka shift kasir terlebih dahulu untuk refund.' }
          : null
      );
      return;
    }
    refundOrder(refundState.orderId, refundState.reason, { id: currentStaff.id, name: currentStaff.name });
    setRefundState((current) => (current ? { ...current, step: 'success' } : null));
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
                              {order.orders.map((item) => (
                                <div key={`${order.id}-${item.menuItem.id}`} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {item.menuItem.emoji} {item.menuItem.name} x{item.quantity}
                                  </span>
                                  <span className="font-semibold text-slate-950 dark:text-white">{formatRupiah(item.subtotal)}</span>
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
                                {order.refundReason ? ` • ${order.refundReason}` : ''}
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
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">Alasan Refund</p>
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
                                    <TabletActionButton tone="danger" className="flex-1 justify-center" onClick={handleRefundNow}>
                                      Refund Sekarang
                                    </TabletActionButton>
                                  </div>
                                </div>
                              )}

                              {activeRefund.step === 'success' && (
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Refund berhasil diproses.</p>
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
  onLogout,
}: {
  viewport: TabletViewportState;
  onGoAdmin: () => void;
  onLogout: () => void;
}) {
  const {
    tables,
    openBills,
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
  const [dismissedRequiredShiftKey, setDismissedRequiredShiftKey] = useState<string | null>(null);
  const layoutBoardRef = useRef<HTMLDivElement>(null);

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

  const shellPadding = shellMode === 'wide' ? 'px-6 py-5' : 'px-4 py-4';

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
  };

  const resumeOpenBill = (billId: string) => {
    setActiveOpenBillId(billId);
  };

  const handleUserLogout = useCallback(() => {
    setShowUserMenu(false);
    setShiftModalMode(null);
    onLogout();
  }, [onLogout]);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fbfcfe,_#eef2ff)] p-3 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a)]">
      <ActionModal />
      <CafeOrderModal />
      {resolvedShiftModalMode && (
        <CashierShiftModal
          key={resolvedShiftModalMode}
          isOpen
          mode={resolvedShiftModalMode}
          onRequestLogout={() => {
            handleUserLogout();
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

      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto flex h-full w-full max-w-[1680px] flex-col overflow-hidden rounded-[36px] border border-white/80 bg-white/94 shadow-[0_36px_120px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <header className={cn('border-b border-white/70 dark:border-white/10', shellPadding)}>
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

              {isAdmin && (
                <TabletActionButton tone="secondary" onClick={onGoAdmin}>
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </TabletActionButton>
              )}

              <div className="relative">
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
                            handleUserLogout();
                          }}
                          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className={cn('min-h-0 flex-1 overflow-hidden', shellPadding)}>
          {!canTransact && currentStaff && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <span>
                {activeCashierShift && activeCashierShift.staffId !== currentStaff.id
                  ? `Transaksi dikunci. Shift aktif milik ${activeCashierShift.staffName}. Kasir tersebut harus login dan tutup shift terlebih dahulu.`
                  : 'Transaksi dikunci. Silakan buka shift kasir terlebih dahulu.'}
              </span>
              {activeCashierShift && activeCashierShift.staffId !== currentStaff.id && (
                <button
                  type="button"
                  onClick={handleUserLogout}
                  className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-400/30 dark:text-amber-300 dark:hover:bg-amber-500/20"
                >
                  Keluar
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
              className="h-full"
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
                <OrdersTab
                  openBills={openBills}
                  activeCashierShift={activeCashierShift}
                  canTransact={canTransact}
                  onOpenCafe={openCafeOrder}
                  onResumeBill={resumeOpenBill}
                />
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
  onLogout,
}: {
  viewport: TabletViewportState;
  onBackToPos: () => void;
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
      onLogout={onLogout}
      shellMode={viewport.appShellMode}
    >
      {renderPage()}
    </AdminLayout>
  );
}

type AppView = 'login' | 'pos' | 'admin';

function AppController() {
  const { isAuthenticated, authReady, logout, currentStaff } = useAuth();
  const viewport = useTabletViewport();
  const [view, setView] = useState<AppView>('login');

  const handleLogin = () => {
    setView('pos');
  };

  const handleLogout = () => {
    logout();
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

  const resolvedView: AppView | 'loading' = !authReady
    ? 'loading'
    : !isAuthenticated
      ? 'login'
      : view === 'login'
        ? 'pos'
        : view;

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
    return <PosDashboard viewport={viewport} onGoAdmin={handleGoAdmin} onLogout={handleLogout} />;
  }

  if (resolvedView === 'admin' && isAuthenticated && currentStaff?.role === 'admin') {
    return <AdminPanel viewport={viewport} onBackToPos={handleBackToPos} onLogout={handleLogout} />;
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

export default function PosPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PosProvider>
          <AppController />
        </PosProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
