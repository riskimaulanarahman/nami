'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CircleDot, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { TabletMetricCard, TabletPanel, TabletSectionHeader } from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const { orderHistory, tables } = usePos();

  const today = new Date();
  const todayOrders = orderHistory.filter((order) => {
    const date = new Date(order.createdAt);
    return date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear();
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
  const avgTransaction = todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;
  const occupiedNow = tables.filter((table) => table.status === 'occupied').length;
  const recentOrders = orderHistory.slice(0, 6);

  const hourlyRevenue: Record<number, number> = {};
  for (let hour = 0; hour < 24; hour += 1) hourlyRevenue[hour] = 0;
  todayOrders.forEach((order) => {
    hourlyRevenue[new Date(order.createdAt).getHours()] += order.grandTotal;
  });
  const maxHourly = Math.max(...Object.values(hourlyRevenue), 1);

  return (
    <div className="grid h-full gap-3">
      <div className="grid grid-cols-4 gap-3">
        <TabletMetricCard icon={DollarSign} label="Revenue" value={formatRupiah(todayRevenue)} subtext="Hari ini" tone="success" />
        <TabletMetricCard icon={ShoppingCart} label="Orders" value={`${todayOrders.length}`} subtext="Transaksi aktif" tone="info" />
        <TabletMetricCard icon={TrendingUp} label="Average" value={formatRupiah(avgTransaction)} subtext="Per transaksi" tone="warning" />
        <TabletMetricCard icon={CircleDot} label="Tables Live" value={`${occupiedNow}`} subtext="Meja sedang dipakai" tone="critical" />
      </div>

      <div className="grid flex-1 grid-cols-[0.96fr_1.04fr] gap-3">
        <TabletPanel className="flex flex-col">
          <TabletSectionHeader
            icon={TrendingUp}
            title="Revenue Tempo"
            subtitle="Distribusi pendapatan per jam untuk memantau puncak operasional."
          />
          <div className="mt-2 flex flex-1 items-end gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
            {Object.entries(hourlyRevenue).map(([hour, revenue]) => {
              const height = revenue > 0 ? Math.max(10, (revenue / maxHourly) * 100) : 8;
              return (
                <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                    {revenue > 0 ? `${Math.round(revenue / 1000)}k` : ''}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="w-full rounded-t-full bg-gradient-to-t from-amber-500 to-orange-400"
                  />
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                    {String(Number(hour)).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </TabletPanel>

        <TabletPanel className="flex flex-col">
          <TabletSectionHeader
            icon={ShoppingCart}
            title="Recent Transactions"
            subtitle="Enam transaksi terbaru untuk pengecekan cepat tanpa membuka laporan penuh."
          />
          <div className="grid gap-2">
            {recentOrders.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Belum ada transaksi hari ini.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[90px_1fr_88px] items-center rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.durationMinutes} menit</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{order.tableName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{order.servedBy}</p>
                  </div>
                  <p className="text-right font-black tracking-[-0.02em] text-emerald-600 dark:text-emerald-300">
                    {formatRupiah(order.grandTotal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </TabletPanel>
      </div>
    </div>
  );
}
