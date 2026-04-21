'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CircleDot,
  Coffee,
  DollarSign,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { usePos, type CashierShift, type OrderHistory, type TableType } from '@/context/PosContext';
import { cn } from '@/lib/utils';
import {
  TabletChip,
  TabletEmptyState,
  TabletPanel,
} from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDayKey(date: Date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
}

type Period = 'today' | '7days' | '30days' | 'month';
type ReportTab = 'billiard' | 'fnb' | 'shift';

function filterByPeriod<T extends { createdAt: Date }>(orders: T[], period: Period): T[] {
  const now = new Date();

  return orders.filter((order) => {
    const date = new Date(order.createdAt);
    if (period === 'today') {
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (period === '7days') {
      const ago = new Date(now);
      ago.setDate(ago.getDate() - 7);
      return date >= ago;
    }
    if (period === '30days') {
      const ago = new Date(now);
      ago.setDate(ago.getDate() - 30);
      return date >= ago;
    }
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari' },
  { id: '30days', label: '30 Hari' },
  { id: 'month', label: 'Bulan Ini' },
];

export default function AdminReports() {
  const { orderHistory, cashierShifts } = usePos();
  const [tab, setTab] = useState<ReportTab>('billiard');
  const [period, setPeriod] = useState<Period>('today');

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <TabletPanel className="rounded-[24px] border-slate-200/80 bg-white px-6 py-5 shadow-none dark:border-white/10 dark:bg-slate-950/82">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-bold uppercase tracking-[0.34em] text-slate-400 dark:text-slate-500">
              Insights
            </p>
            <h1 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
              Laporan Operasional
            </h1>
            <p className="mt-2 max-w-[680px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">
              Ringkasan pendapatan billiard dan F&B dalam format tablet yang padat.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <TabletChip
              active={tab === 'billiard'}
              onClick={() => setTab('billiard')}
              className="rounded-full px-4 py-2 text-[14px]"
            >
              <CircleDot className="mr-2 inline h-4 w-4" />
              Billiard
            </TabletChip>
            <TabletChip
              active={tab === 'fnb'}
              onClick={() => setTab('fnb')}
              className="rounded-full px-4 py-2 text-[14px]"
            >
              <Coffee className="mr-2 inline h-4 w-4" />
              F&B
            </TabletChip>
            <TabletChip
              active={tab === 'shift'}
              onClick={() => setTab('shift')}
              className="rounded-full px-4 py-2 text-[14px]"
            >
              <Wallet className="mr-2 inline h-4 w-4" />
              Shift
            </TabletChip>
          </div>
        </div>
      </TabletPanel>

      <TabletPanel className="rounded-[22px] border-slate-200/80 bg-white px-4 py-3 shadow-none dark:border-white/10 dark:bg-slate-950/82">
        <div className="flex flex-wrap gap-3">
          {PERIODS.map((item) => (
            <TabletChip
              key={item.id}
              active={period === item.id}
              onClick={() => setPeriod(item.id)}
              className="rounded-full px-4 py-2 text-[14px]"
            >
              {item.label}
            </TabletChip>
          ))}
        </div>
      </TabletPanel>

      {tab === 'billiard' ? (
        <BilliardReport orders={orderHistory} period={period} />
      ) : tab === 'fnb' ? (
        <FnbReport orders={orderHistory} period={period} />
      ) : (
        <ShiftReport shifts={cashierShifts} period={period} />
      )}
    </div>
  );
}

function BilliardReport({
  orders,
  period,
}: {
  orders: OrderHistory[];
  period: Period;
}) {
  const salesOrders = useMemo(
    () =>
      filterByPeriod(
        orders.filter((order) => order.sessionType === 'billiard'),
        period
      ),
    [orders, period]
  );

  const refundedOrders = useMemo(
    () =>
      filterByPeriod(
        orders.filter((order) => order.status === 'refunded' && order.sessionType === 'billiard'),
        period
      ),
    [orders, period]
  );

  const metrics = useMemo(() => {
    const grossRevenue = salesOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const refundTotal = refundedOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const totalRental = salesOrders.reduce((sum, order) => sum + order.rentalCost, 0);
    const totalFnb = salesOrders.reduce((sum, order) => sum + order.orderTotal, 0);
    const totalSessions = salesOrders.length;
    const avgDurationMinutes =
      totalSessions > 0
        ? Math.round(salesOrders.reduce((sum, order) => sum + order.durationMinutes, 0) / totalSessions)
        : 0;

    const hourMap: Record<number, number> = {};
    const dailyMap: Record<
      string,
      { date: Date; revenue: number; sessions: number }
    > = {};
    const tableMap: Record<
      string,
      { type: TableType; sessions: number; revenue: number }
    > = {};

    salesOrders.forEach((order) => {
      const hour = new Date(order.startTime).getHours();
      hourMap[hour] = (hourMap[hour] ?? 0) + 1;

      const dayKey = getDayKey(order.createdAt);
      dailyMap[dayKey] ??= { date: new Date(order.createdAt), revenue: 0, sessions: 0 };
      dailyMap[dayKey].revenue += order.grandTotal;
      dailyMap[dayKey].sessions += 1;

      tableMap[order.tableName] ??= { type: order.tableType, sessions: 0, revenue: 0 };
      tableMap[order.tableName].sessions += 1;
      tableMap[order.tableName].revenue += order.grandTotal;
    });

    const busiestHour = Object.entries(hourMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const dailyRows = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, row]) => ({
        label: getDayLabel(row.date),
        revenue: row.revenue,
        meta: `${row.sessions} sesi`,
      }));

    return {
      grossRevenue,
      refundTotal,
      refundCount: refundedOrders.length,
      netRevenue: grossRevenue - refundTotal,
      totalRental,
      totalFnb,
      totalSessions,
      avgDurationMinutes,
      busiestHour,
      dailyRows,
      tableRows: Object.entries(tableMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 6),
      recentRefunds: refundedOrders
        .slice()
        .sort((a, b) => new Date(b.refundedAt ?? b.createdAt).getTime() - new Date(a.refundedAt ?? a.createdAt).getTime())
        .slice(0, 8),
    };
  }, [salesOrders, refundedOrders]);

  const avgDurationLabel = metrics.avgDurationMinutes > 0 ? formatDuration(metrics.avgDurationMinutes) : '0j 0m';

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.98fr)]">
      <div className="grid min-h-0 gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard
            icon={DollarSign}
            label="Gross Sales"
            value={formatRupiah(metrics.grossRevenue)}
            description="Pendapatan kotor sesi billiard"
            tone="info"
          />
          <ReportMetricCard
            icon={RotateCcw}
            label="Refund Total"
            value={formatRupiah(metrics.refundTotal)}
            description="Akumulasi nominal refund"
            tone="critical"
          />
          <ReportMetricCard
            icon={TrendingUp}
            label="Net Sales"
            value={formatRupiah(metrics.netRevenue)}
            description="Gross sales dikurangi refund"
            tone="success"
          />
          <ReportMetricCard
            icon={ShoppingCart}
            label="Refund Count"
            value={`${metrics.refundCount}`}
            description="Jumlah transaksi refunded"
            tone="warning"
          />
        </div>

        <TabletPanel className="flex min-h-[320px] flex-col">
          <ReportSectionHeader
            icon={BarChart3}
            title="Performa Harian"
            subtitle="Tren gross sales sesi billiard pada periode terpilih."
          />
          <ReportBarChart
            rows={metrics.dailyRows}
            emptyTitle="Belum ada data billiard"
            emptyDescription="Mulai sesi dan selesaikan checkout untuk melihat tren pendapatan di sini."
            barClassName="bg-slate-950 dark:bg-white dark:text-slate-950"
            railClassName="bg-slate-200 dark:bg-white/10"
          />
        </TabletPanel>
      </div>

      <div className="grid min-h-0 gap-3">
        <TabletPanel className="flex min-h-[320px] flex-col">
          <ReportSectionHeader
            icon={Trophy}
            title="Meja Terbaik"
            subtitle="Enam meja dengan gross sales tertinggi."
          />
          {metrics.tableRows.length === 0 ? (
            <TabletEmptyState
              title="Belum ada meja aktif"
              description="Pendapatan per meja akan muncul setelah ada sesi selesai."
              className="min-h-[220px] flex-1"
            />
          ) : (
            <div className="grid gap-3">
              {metrics.tableRows.map(([name, row], index) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                      #{index + 1} {name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {row.type === 'vip' ? 'VIP' : 'Standar'} • {row.sessions} sesi
                    </p>
                  </div>
                  <span className="pl-4 text-right text-[14px] font-bold text-slate-950 dark:text-white">
                    {formatRupiah(row.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabletPanel>

        <ReportRefundAuditPanel
          refunds={metrics.recentRefunds}
          emptyDescription="Refund billiard pada periode aktif akan muncul di sini."
        />

        <TabletPanel className="flex flex-col">
          <ReportSectionHeader
            icon={CircleDot}
            title="Observasi Cepat"
            subtitle="Ringkasan revenue dan pola sesi billiard."
          />
          <div className="grid gap-4">
            <InsightRow label="Total sesi selesai" value={`${metrics.totalSessions}`} />
            <InsightRow label="Pendapatan sewa" value={formatRupiah(metrics.totalRental)} />
            <InsightRow label="Pendapatan F&B" value={formatRupiah(metrics.totalFnb)} />
            <InsightRow
              label="Produktivitas rata-rata"
              value={metrics.avgDurationMinutes > 0 ? avgDurationLabel : '-'}
            />
            <InsightRow
              label="Jam tersibuk"
              value={metrics.busiestHour ? formatHour(Number(metrics.busiestHour[0])) : 'Belum ada data'}
            />
          </div>
        </TabletPanel>
      </div>
    </div>
  );
}

function FnbReport({
  orders,
  period,
}: {
  orders: OrderHistory[];
  period: Period;
}) {
  const salesOrders = useMemo(
    () =>
      filterByPeriod(
        orders.filter((order) => order.orders.length > 0),
        period
      ),
    [orders, period]
  );

  const refundedOrders = useMemo(
    () =>
      filterByPeriod(
        orders.filter((order) => order.status === 'refunded' && order.orders.length > 0),
        period
      ),
    [orders, period]
  );

  const metrics = useMemo(() => {
    const grossRevenue = salesOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const refundTotal = refundedOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const totalItems = salesOrders.reduce(
      (sum, order) => sum + order.orders.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const totalCost = salesOrders.reduce(
      (sum, order) =>
        sum + order.orders.reduce((itemSum, item) => itemSum + item.menuItem.cost * item.quantity, 0),
      0
    );

    const dailyMap: Record<
      string,
      { date: Date; revenue: number; items: number }
    > = {};
    const categoryMap: Record<string, { qty: number; revenue: number }> = {};
    const itemMap: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {};

    salesOrders.forEach((order) => {
      const dayKey = getDayKey(order.createdAt);
      dailyMap[dayKey] ??= { date: new Date(order.createdAt), revenue: 0, items: 0 };
      dailyMap[dayKey].revenue += order.grandTotal;
      dailyMap[dayKey].items += order.orders.reduce((sum, item) => sum + item.quantity, 0);

      order.orders.forEach((item) => {
        categoryMap[item.menuItem.category] ??= { qty: 0, revenue: 0 };
        categoryMap[item.menuItem.category].qty += item.quantity;
        categoryMap[item.menuItem.category].revenue += item.subtotal;

        itemMap[item.menuItem.id] ??= {
          name: item.menuItem.name,
          emoji: item.menuItem.emoji,
          qty: 0,
          revenue: 0,
        };
        itemMap[item.menuItem.id].qty += item.quantity;
        itemMap[item.menuItem.id].revenue += item.subtotal;
      });
    });

    const dailyRows = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, row]) => ({
        label: getDayLabel(row.date),
        revenue: row.revenue,
        meta: `${row.items} item`,
      }));

    return {
      grossRevenue,
      refundTotal,
      refundCount: refundedOrders.length,
      netRevenue: grossRevenue - refundTotal,
      totalItems,
      totalCost,
      margin: grossRevenue - totalCost,
      marginPct: grossRevenue > 0 ? Math.round(((grossRevenue - totalCost) / grossRevenue) * 100) : 0,
      dailyRows,
      categoryRows: Object.entries(categoryMap).sort((a, b) => b[1].revenue - a[1].revenue),
      topItems: Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      recentRefunds: refundedOrders
        .slice()
        .sort((a, b) => new Date(b.refundedAt ?? b.createdAt).getTime() - new Date(a.refundedAt ?? a.createdAt).getTime())
        .slice(0, 8),
    };
  }, [salesOrders, refundedOrders]);

  const totalCategoryRevenue = metrics.categoryRows.reduce((sum, [, row]) => sum + row.revenue, 0) || 1;

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.98fr)]">
      <div className="grid min-h-0 gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard
            icon={DollarSign}
            label="Gross Sales"
            value={formatRupiah(metrics.grossRevenue)}
            description="Pendapatan kotor transaksi F&B"
            tone="info"
          />
          <ReportMetricCard
            icon={RotateCcw}
            label="Refund Total"
            value={formatRupiah(metrics.refundTotal)}
            description="Akumulasi nominal refund"
            tone="critical"
          />
          <ReportMetricCard
            icon={TrendingUp}
            label="Net Sales"
            value={formatRupiah(metrics.netRevenue)}
            description="Gross sales dikurangi refund"
            tone="success"
          />
          <ReportMetricCard
            icon={ShoppingCart}
            label="Refund Count"
            value={`${metrics.refundCount}`}
            description="Jumlah transaksi refunded"
            tone="warning"
          />
        </div>

        <TabletPanel className="flex min-h-[320px] flex-col">
          <ReportSectionHeader
            icon={Coffee}
            title="Tren Penjualan Harian"
            subtitle="Tren gross sales F&B dalam periode aktif."
          />
          <ReportBarChart
            rows={metrics.dailyRows}
            emptyTitle="Belum ada transaksi F&B"
            emptyDescription="Checkout open bill atau pesanan cafe untuk melihat tren penjualan."
            barClassName="bg-amber-500 text-white"
            railClassName="bg-amber-100 dark:bg-amber-500/10"
          />
        </TabletPanel>
      </div>

      <div className="grid min-h-0 gap-3">
        <TabletPanel className="flex min-h-[320px] flex-col">
          <ReportSectionHeader
            icon={UtensilsCrossed}
            title="Kategori Utama"
            subtitle="Kontribusi gross sales per kategori."
          />
          {metrics.categoryRows.length === 0 ? (
            <TabletEmptyState
              title="Kategori belum terisi"
              description="Penjualan kategori akan tampil otomatis setelah ada transaksi."
              className="min-h-[220px] flex-1"
            />
          ) : (
            <div className="grid gap-3">
              {metrics.categoryRows.map(([category, row]) => {
                const percent = Math.round((row.revenue / totalCategoryRevenue) * 100);
                return (
                  <div
                    key={category}
                    className="rounded-[18px] border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-black capitalize tracking-[-0.02em] text-slate-950 dark:text-white">
                          {category}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {row.qty} item
                        </p>
                      </div>
                      <p className="text-right text-[15px] font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                        {formatRupiah(row.revenue)}
                      </p>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className={cn(
                          'h-3 rounded-full',
                          category === 'food'
                            ? 'bg-orange-500'
                            : category === 'drink'
                              ? 'bg-cyan-500'
                              : 'bg-pink-500'
                        )}
                        style={{ width: `${Math.max(percent, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabletPanel>

        <ReportRefundAuditPanel
          refunds={metrics.recentRefunds}
          emptyDescription="Refund F&B pada periode aktif akan muncul di sini."
        />

        <TabletPanel className="flex flex-col">
          <ReportSectionHeader
            icon={Trophy}
            title="Top Menu"
            subtitle="Enam menu dengan omzet tertinggi."
          />
          {metrics.topItems.length === 0 ? (
            <TabletEmptyState
              title="Belum ada menu terlaris"
              description="Daftar menu terbaik akan tampil setelah ada penjualan."
              className="min-h-[220px]"
            />
          ) : (
            <div className="grid gap-3">
              {metrics.topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                      #{index + 1} {item.emoji} {item.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.qty} item</p>
                  </div>
                  <p className="pl-4 text-right text-[14px] font-bold text-slate-950 dark:text-white">
                    {formatRupiah(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabletPanel>

        <TabletPanel className="flex flex-col">
          <ReportSectionHeader
            icon={CircleDot}
            title="Observasi Cepat"
            subtitle="Ikhtisar HPP, margin, dan jumlah item terjual."
          />
          <div className="grid gap-4">
            <InsightRow label="Item terjual" value={`${metrics.totalItems}`} />
            <InsightRow label="HPP total" value={formatRupiah(metrics.totalCost)} />
            <InsightRow label="Margin kotor" value={formatRupiah(metrics.margin)} />
            <InsightRow label="Margin persentase" value={`${metrics.marginPct}%`} />
          </div>
        </TabletPanel>
      </div>
    </div>
  );
}

function ReportRefundAuditPanel({
  refunds,
  emptyDescription,
}: {
  refunds: OrderHistory[];
  emptyDescription: string;
}) {
  return (
    <TabletPanel className="flex min-h-[320px] flex-col">
      <ReportSectionHeader
        icon={RotateCcw}
        title="Audit Refund"
        subtitle="Daftar refund terbaru beserta alasan / remarks yang tersimpan."
      />
      {refunds.length === 0 ? (
        <TabletEmptyState
          title="Belum ada refund"
          description={emptyDescription}
          className="min-h-[220px] flex-1"
        />
      ) : (
        <div className="grid gap-3">
          {refunds.map((order) => (
            <div
              key={order.id}
              className="rounded-[18px] border border-rose-200/80 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                    {order.tableName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {order.sessionType === 'billiard' ? 'Billiard' : 'F&B'} • {order.memberName || 'Non-member'}
                  </p>
                </div>
                <p className="pl-3 text-right text-[14px] font-black text-rose-600 dark:text-rose-300">
                  {formatRupiah(order.grandTotal)}
                </p>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  {order.refundedAt ? formatDateTime(order.refundedAt) : formatDateTime(order.createdAt)}
                  {' • '}
                  {order.refundedBy || order.servedBy}
                </p>
                <p className="font-semibold text-rose-700 dark:text-rose-300">
                  Alasan / Remarks Refund
                </p>
                <p className="text-slate-700 dark:text-slate-200">{order.refundReason?.trim() || '-'}</p>
                <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{order.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </TabletPanel>
  );
}

function ShiftReport({
  shifts,
  period,
}: {
  shifts: CashierShift[];
  period: Period;
}) {
  const filtered = useMemo(
    () => filterByPeriod(shifts.map((shift) => ({ ...shift, createdAt: shift.openedAt })), period),
    [period, shifts]
  );

  const metrics = useMemo(() => {
    const totalShifts = filtered.length;
    const activeShifts = filtered.filter((shift) => shift.status === 'active').length;
    const totalCashSales = filtered.reduce((sum, shift) => sum + shift.cashSales, 0);
    const totalCashRefunds = filtered.reduce((sum, shift) => sum + shift.cashRefunds, 0);
    const totalExpected = filtered.reduce((sum, shift) => sum + shift.expectedCash, 0);
    const totalClosing = filtered.reduce((sum, shift) => sum + (shift.closingCash ?? 0), 0);
    const totalVariance = filtered.reduce((sum, shift) => sum + (shift.varianceCash ?? 0), 0);

    const dailyMap: Record<string, { date: Date; shifts: number; cashSales: number }> = {};
    filtered.forEach((shift) => {
      const dayKey = getDayKey(shift.openedAt);
      dailyMap[dayKey] ??= { date: new Date(shift.openedAt), shifts: 0, cashSales: 0 };
      dailyMap[dayKey].shifts += 1;
      dailyMap[dayKey].cashSales += shift.cashSales;
    });

    const dailyRows = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, row]) => ({
        label: getDayLabel(row.date),
        revenue: row.cashSales,
        meta: `${row.shifts} shift`,
      }));

    return {
      totalShifts,
      activeShifts,
      totalCashSales,
      totalCashRefunds,
      totalExpected,
      totalClosing,
      totalVariance,
      dailyRows,
      rows: [...filtered].sort(
        (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
      ).slice(0, 8),
    };
  }, [filtered]);

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.98fr)]">
      <div className="grid min-h-0 gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard
            icon={Wallet}
            label="Total Shift"
            value={`${metrics.totalShifts}`}
            description={`${metrics.activeShifts} shift aktif`}
            tone="info"
          />
          <ReportMetricCard
            icon={DollarSign}
            label="Cash Sales"
            value={formatRupiah(metrics.totalCashSales)}
            description="Akumulasi transaksi cash"
            tone="success"
          />
          <ReportMetricCard
            icon={RotateCcw}
            label="Cash Refund"
            value={formatRupiah(metrics.totalCashRefunds)}
            description="Refund cash per shift"
            tone="critical"
          />
          <ReportMetricCard
            icon={TrendingUp}
            label="Selisih Kas"
            value={formatRupiah(metrics.totalVariance)}
            description="Total variance seluruh shift"
            tone="warning"
          />
        </div>

        <TabletPanel className="flex min-h-[320px] flex-col">
          <ReportSectionHeader
            icon={BarChart3}
            title="Cash Sales Harian"
            subtitle="Tren pemasukan kas berdasarkan shift yang dibuka."
          />
          <ReportBarChart
            rows={metrics.dailyRows}
            emptyTitle="Belum ada data shift"
            emptyDescription="Buka shift kasir dan proses transaksi untuk melihat tren kas harian."
            barClassName="bg-slate-950 dark:bg-white dark:text-slate-950"
            railClassName="bg-slate-200 dark:bg-white/10"
          />
        </TabletPanel>
      </div>

      <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
        <TabletPanel className="flex min-h-[320px] flex-col overflow-hidden xl:min-h-0">
          <ReportSectionHeader
            icon={CircleDot}
            title="Ringkasan Shift Terbaru"
            subtitle="Detail kas awal, kas teoritis, kas fisik, dan variance."
          />
          {metrics.rows.length === 0 ? (
            <TabletEmptyState
              title="Belum ada shift"
              description="Data shift kasir akan muncul setelah kasir membuka shift."
              className="min-h-[220px] flex-1"
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                {metrics.rows.map((shift) => (
                  <div
                    key={shift.id}
                    className="rounded-[18px] border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                        {shift.staffName}
                      </p>
                      <span className={cn(
                        'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
                        shift.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : shift.status === 'legacy'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                      )}>
                        {shift.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(shift.openedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Kasir terlibat: {shift.involvedStaffNames.join(' -> ')}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white px-2 py-1.5 dark:bg-slate-950">
                        <p className="text-slate-400">Kas Awal</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(shift.openingCash)}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-1.5 dark:bg-slate-950">
                        <p className="text-slate-400">Kas Teoritis</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(shift.expectedCash)}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-1.5 dark:bg-slate-950">
                        <p className="text-slate-400">Kas Fisik</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(shift.closingCash ?? 0)}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-1.5 dark:bg-slate-950">
                        <p className="text-slate-400">Selisih</p>
                        <p className={cn(
                          'font-semibold',
                          (shift.varianceCash ?? 0) === 0
                            ? 'text-slate-900 dark:text-white'
                            : (shift.varianceCash ?? 0) > 0
                              ? 'text-emerald-600 dark:text-emerald-300'
                              : 'text-rose-600 dark:text-rose-300'
                        )}>
                          {formatRupiah(shift.varianceCash ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabletPanel>

        <TabletPanel className="flex flex-col xl:self-start">
          <ReportSectionHeader
            icon={ShoppingCart}
            title="Observasi Kas"
            subtitle="Ikhtisar cepat performa kas seluruh shift pada periode aktif."
          />
          <div className="grid gap-4">
            <InsightRow label="Kas teoritis total" value={formatRupiah(metrics.totalExpected)} />
            <InsightRow label="Kas fisik total" value={formatRupiah(metrics.totalClosing)} />
            <InsightRow label="Refund cash total" value={formatRupiah(metrics.totalCashRefunds)} />
          </div>
        </TabletPanel>
      </div>
    </div>
  );
}

function ReportSectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[16px] font-bold text-slate-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ReportMetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'critical';
}) {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    critical: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  }[tone];

  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white px-4 py-4 shadow-none dark:border-white/10 dark:bg-slate-950/82">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]', toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportBarChart({
  rows,
  emptyTitle,
  emptyDescription,
  barClassName,
  railClassName,
}: {
  rows: { label: string; revenue: number; meta: string }[];
  emptyTitle: string;
  emptyDescription: string;
  barClassName: string;
  railClassName: string;
}) {
  if (rows.length === 0) {
    return (
      <TabletEmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="min-h-[220px] flex-1"
      />
    );
  }

  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);

  return (
    <div className="min-h-0 flex-1 overflow-x-auto pb-1">
      <div className="grid h-full min-h-[220px] grid-flow-col auto-cols-[minmax(92px,1fr)] gap-2.5">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.meta}`}
            className="flex min-w-0 flex-col justify-end rounded-[18px] border border-slate-200/80 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex-1" />
            <div className={cn('mb-3 rounded-full px-1 py-1', railClassName)}>
              <div
                className={cn(
                  'min-w-[34px] rounded-full px-2 py-1 text-right text-[10px] font-bold',
                  barClassName
                )}
                style={{ width: `${Math.max(24, (row.revenue / maxRevenue) * 100)}%` }}
              >
                {Math.round(row.revenue / 1000)}k
              </div>
            </div>
            <p className="text-[13px] font-semibold text-slate-950 dark:text-white">{row.label}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[14px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-[14px] font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
