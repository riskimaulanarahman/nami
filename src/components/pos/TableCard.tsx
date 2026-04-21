'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CircleDot, Clock3, Crown, Receipt, Timer, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import type { Table } from '@/context/PosContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusTone = {
  available: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    glow: 'from-emerald-500/18 to-teal-500/12',
    label: 'Siap Pakai',
  },
  reserved: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-500/20',
    glow: 'from-sky-500/18 to-cyan-500/12',
    label: 'Reserved',
  },
  occupied: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-500/20',
    glow: 'from-amber-500/18 to-orange-500/12',
    label: 'Live Session',
  },
};

interface TableCardProps {
  table: Table;
  compact?: boolean;
}

export default function TableCard({ table, compact = false }: TableCardProps) {
  const { setActiveModalTableId, formatElapsed, calculateTableBill, activeCashierShift, openBills } = usePos();
  const config = statusTone[table.status];
  const bill = table.status === 'occupied' ? calculateTableBill(table) : null;
  const isCarryover = Boolean(
    table.status === 'occupied' &&
    table.originCashierShiftId &&
    activeCashierShift &&
    table.originCashierShiftId !== activeCashierShift.id
  );
  const carryoverLabel = table.originStaffName
    ? `Lanjutan dari ${table.originStaffName}`
    : 'Transaksi shift sebelumnya';

  const totalOrderItems = React.useMemo(() => {
    const billiardCount = table.orders.length;
    let openBillCount = 0;
    if (table.activeOpenBillId) {
      const linkedBill = openBills.find((b) => b.id === table.activeOpenBillId);
      const linkedGroup = linkedBill?.groups.find((g) => g.tableId === table.id);
      if (linkedGroup) {
        openBillCount = linkedGroup.items.length;
      }
    }
    return billiardCount + openBillCount;
  }, [table, openBills]);

  if (compact) {
    return (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setActiveModalTableId(table.id)}
        className={cn(
          'relative h-28 overflow-hidden rounded-[16px] border bg-white/92 p-2.5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-transform dark:bg-slate-950/78',
          config.border
        )}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40', config.glow)} />
        <div className="relative flex h-full min-w-0 flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate whitespace-nowrap text-[11px] font-black tracking-[-0.01em] text-slate-950 dark:text-white">
                {table.name}
              </p>
              <p className="truncate whitespace-nowrap text-[9px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {table.type === 'vip' ? 'VIP Room' : 'Standard'}
              </p>
              {isCarryover && (
                <p className="mt-1 truncate whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                  Transaksi Sebelumnya
                </p>
              )}
            </div>
            <span className={cn(
              'inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[8px] font-bold uppercase tracking-[0.12em]',
              config.badge
            )}>
              {table.status === 'occupied' ? 'Live' : config.label}
            </span>
          </div>

          {table.status === 'occupied' && bill ? (
            <div className="flex items-end justify-between gap-2 border-t border-white/70 pt-1.5 text-[11px] dark:border-white/10">
              <p className="min-w-0 truncate whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                {formatRupiah(bill.grandTotal)}
              </p>
              <p className="shrink-0 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatElapsed(table.id)}
              </p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 border-t border-white/70 pt-1.5 text-[10px] dark:border-white/10">
              <p className="min-w-0 truncate whitespace-nowrap text-slate-600 dark:text-slate-300">
                {formatRupiah(table.hourlyRate)}/jam
              </p>
              <p className="shrink-0 whitespace-nowrap text-slate-500 dark:text-slate-400">
                {table.status === 'reserved' ? 'Reserved' : 'Available'}
              </p>
            </div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveModalTableId(table.id)}
      className={cn(
        'relative overflow-hidden rounded-[26px] border bg-white/92 p-4 text-left shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-transform dark:bg-slate-950/78',
        config.border
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', config.glow)} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
              {table.type === 'vip' ? 'VIP Room' : 'Table Station'}
            </p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{table.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            {table.type === 'vip' && (
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-amber-100 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Crown className="h-3 w-3" />
                VIP
              </span>
            )}
            <span className={cn('inline-flex h-8 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.24em]', config.badge)}>
              {config.label}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
          <div className="rounded-[22px] border border-white/70 bg-white/78 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CircleDot className="h-3.5 w-3.5" />
              Tarif {table.type === 'vip' ? 'VIP' : 'Standar'}
            </div>
            <p className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
              {formatRupiah(table.hourlyRate)}
              <span className="ml-1 text-sm font-bold text-slate-500 dark:text-slate-400">/jam</span>
            </p>
          </div>

          {table.status === 'occupied' && (
            <div className="rounded-[22px] border border-white/70 bg-slate-950 px-4 py-3 text-white dark:border-white/10">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                <Clock3 className="h-3.5 w-3.5" />
                Live
              </div>
              <p className="mt-2 text-lg font-black tracking-[0.08em]">{formatElapsed(table.id)}</p>
            </div>
          )}
        </div>

        {table.status === 'occupied' && bill ? (
          <div className="mt-4 rounded-[22px] border border-white/70 bg-white/78 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Receipt className="h-3.5 w-3.5" />
                  Total berjalan
                </div>
                <p className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                  {formatRupiah(bill.grandTotal)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  {totalOrderItems} pesanan
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" />
                  {table.billingMode === 'package'
                    ? `${table.selectedPackageName ?? 'Paket Jam'}`
                    : 'Open Bill'}
                </div>
              </div>
            </div>
            {isCarryover && (
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300">
                {carryoverLabel}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/85 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {table.status === 'reserved'
              ? 'Meja sudah di-assign dari waiting list.'
              : 'Siap dibuka untuk sesi billiard baru.'}
          </div>
        )}
      </div>
    </motion.button>
  );
}
