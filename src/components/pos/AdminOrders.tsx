'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, DollarSign, Printer, ShoppingCart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import type { OrderHistory } from '@/context/PosContext';
import { printReceiptDirect } from './PrintReceipt';
import { TabletChip, TabletMetricCard, TabletPage, TabletPagination, TabletPanel, TabletSectionHeader, paginateItems } from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours} jam${mins > 0 ? ` ${mins} menit` : ''}`;
  return `${mins} menit`;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';
const PAGE_SIZE = 6;

function filterOrders(orders: OrderHistory[], filter: DateFilter): OrderHistory[] {
  if (filter === 'all') return orders;
  const now = new Date();
  return orders.filter((order) => {
    const date = new Date(order.createdAt);
    if (filter === 'today') {
      return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (filter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}

export default function AdminOrders() {
  const { orderHistory, settings } = usePos();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => filterOrders(orderHistory, dateFilter), [dateFilter, orderHistory]);
  const paged = useMemo(() => paginateItems(filtered, page, PAGE_SIZE), [filtered, page]);
  const totalRevenue = filtered.reduce((sum, order) => sum + order.grandTotal, 0);
  const totalCount = filtered.length;
  const avgOrder = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

  return (
    <TabletPage
      eyebrow="Live"
      title="Order Ledger"
      subtitle="Ringkasan transaksi dengan detail instan, tetap padat dan terbaca di mode tablet."
    >
      <div className="grid grid-cols-3 gap-3">
        <TabletMetricCard icon={DollarSign} label="Revenue" value={formatRupiah(totalRevenue)} subtext="Sesuai filter" tone="success" />
        <TabletMetricCard icon={ShoppingCart} label="Orders" value={`${totalCount}`} subtext="Transaksi tercatat" tone="info" />
        <TabletMetricCard icon={TrendingUp} label="Average" value={formatRupiah(avgOrder)} subtext="Per order" tone="warning" />
      </div>

      <TabletPanel className="space-y-3">
        <TabletSectionHeader
          title="Transaksi"
          subtitle="Gunakan filter cepat untuk mengubah rentang data tanpa meninggalkan layar."
          actions={<span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{filtered.length} item</span>}
        />

        <div className="flex flex-wrap gap-2">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
          ] as { id: DateFilter; label: string }[]).map((filter) => (
            <TabletChip
              key={filter.id}
              active={dateFilter === filter.id}
              onClick={() => {
                setDateFilter(filter.id);
                setPage(1);
              }}
            >
              {filter.label}
            </TabletChip>
          ))}
        </div>

        <div className="grid gap-2">
          {paged.items.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <div
                key={order.id}
                className={cn(
                  'rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5',
                  expanded && 'bg-slate-50 dark:bg-white/7'
                )}
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="grid w-full grid-cols-[82px_1fr_82px_90px_auto] items-center gap-2.5 text-left"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{order.tableName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.servedBy} • {order.sessionType}
                    </p>
                    {order.isContinuedFromPreviousShift && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-300">
                        Transaksi Sebelumnya{order.originStaffName ? ` • ${order.originStaffName}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{formatDuration(order.durationMinutes)}</p>
                  <p className="text-right text-sm font-black tracking-[-0.02em] text-emerald-600 dark:text-emerald-300">
                    {formatRupiah(order.grandTotal)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        printReceiptDirect(order, settings, settings.paperSize);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
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
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-3 dark:border-white/10">
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Items</p>
                          {order.orders.length > 0 ? (
                            <div className="mt-2 space-y-1.5 text-sm">
                              {order.orders.slice(0, 4).map((item, index) => (
                                <div key={`${order.id}-${index}`} className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-300">{item.menuItem.emoji} {item.menuItem.name} x{item.quantity}</span>
                                  <span className="font-semibold text-slate-950 dark:text-white">{formatRupiah(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tidak ada item FnB.</p>
                          )}
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Summary</p>
                          <div className="mt-2 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between">
                              <span>Kasir terlibat</span>
                              <span className="font-semibold text-slate-950 dark:text-white">{order.involvedStaffNames.join(' -> ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Subtotal Sewa</span>
                              <span className="font-semibold text-slate-950 dark:text-white">{formatRupiah(order.rentalCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Subtotal Pesanan</span>
                              <span className="font-semibold text-slate-950 dark:text-white">{formatRupiah(order.orderTotal)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-950 dark:border-white/10 dark:text-white">
                              <span>Total</span>
                              <span>{formatRupiah(order.grandTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <TabletPagination page={paged.page} totalPages={paged.totalPages} onPageChange={setPage} />
      </TabletPanel>
    </TabletPage>
  );
}
