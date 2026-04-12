'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Minus, Plus, Receipt, Timer, Trash2, UtensilsCrossed } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import type { Table } from '@/context/PosContext';
import { TabletPanel, TabletSectionHeader } from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderSummary({ table }: { table: Table }) {
  const { updateOrderItemQuantity, calculateTableBill, formatElapsed } = usePos();
  const bill = calculateTableBill(table);

  return (
    <div className="space-y-2 pb-2">
      <TabletPanel tone="accent" className="rounded-2xl px-3 py-2.5">
        <TabletSectionHeader
          icon={Clock}
          title="Sewa Meja"
          subtitle={
            bill.isFlatRate
              ? `${bill.selectedPackageName ?? 'Paket Jam'}${bill.sessionDurationHours > 0 ? ` • ${bill.sessionDurationHours} jam` : ''}`
              : `Open Bill / Prorata • ${table.hourlyRate.toLocaleString('id-ID')}/jam`
          }
        />
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[30px] font-black tracking-[-0.03em] leading-none text-slate-950 dark:text-white">
              {formatElapsed(table.id)}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Timer className="h-3 w-3" />
              Billing aktif
            </p>
          </div>
          <p className="text-xl font-black tracking-[-0.02em] text-slate-950 dark:text-white">
            {formatRupiah(bill.rentalCost)}
          </p>
        </div>
      </TabletPanel>

      <TabletPanel className="rounded-2xl px-3 py-2.5">
        <TabletSectionHeader
          icon={UtensilsCrossed}
          title="Pesanan Cafe"
          subtitle={table.orders.length > 0 ? `${table.orders.length} baris pesanan aktif` : 'Belum ada item'}
        />

        {table.orders.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/90 px-4 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            Belum ada pesanan untuk meja ini.
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {table.orders.map((order) => (
                <motion.div
                  key={order.menuItem.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="grid grid-cols-[minmax(0,1fr)_auto_88px] items-center gap-2 rounded-xl bg-slate-50/90 px-2.5 py-2 dark:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                      {order.menuItem.emoji} {order.menuItem.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRupiah(order.menuItem.price)} / item
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateOrderItemQuantity(table.id, order.menuItem.id, order.quantity - 1)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300"
                    >
                      {order.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    </button>
                    <span className="w-6 text-center text-sm font-black text-slate-950 dark:text-white">
                      {order.quantity}
                    </span>
                    <button
                      onClick={() => updateOrderItemQuantity(table.id, order.menuItem.id, order.quantity + 1)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-slate-950 text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-right text-sm font-black text-slate-950 dark:text-white">
                    {formatRupiah(order.menuItem.price * order.quantity)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabletPanel>

      <TabletPanel tone="muted" className="rounded-2xl px-3 py-2.5">
        <TabletSectionHeader icon={Receipt} title="Ringkasan Tagihan" subtitle="Total aktif untuk checkout." />
        <div className="space-y-1.5">
          <SummaryRow label="Subtotal sewa meja" value={formatRupiah(bill.rentalCost)} />
          <SummaryRow label="Subtotal pesanan" value={formatRupiah(bill.orderTotal)} />
          <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 dark:border-white/10">
            <span className="text-sm font-bold text-slate-950 dark:text-white">Total akhir</span>
            <motion.span
              key={bill.grandTotal}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              className="text-xl font-black tracking-[-0.02em] text-slate-950 dark:text-white"
            >
              {formatRupiah(bill.grandTotal)}
            </motion.span>
          </div>
        </div>
      </TabletPanel>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}
