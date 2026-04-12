'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TabletPage({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/82">
        <div>
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="grid min-h-0 flex-1 gap-3">{children}</div>
    </div>
  );
}

export function TabletPanel({
  className,
  tone = 'default',
  children,
}: {
  className?: string;
  tone?: 'default' | 'accent' | 'muted' | 'critical';
  children: React.ReactNode;
}) {
  const toneClass = {
    default: 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/82',
    accent: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10',
    muted: 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900/65',
    critical: 'border-red-200 bg-red-50/75 dark:border-red-500/20 dark:bg-red-500/10',
  }[tone];

  return (
    <section
      className={cn(
        'rounded-[20px] border px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]',
        toneClass,
        className
      )}
    >
      {children}
    </section>
  );
}

export function TabletScrollArea({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto pr-1', className)}>{children}</div>;
}

export function TabletSectionHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">{title}</h3>
          {subtitle && <p className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TabletMetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
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
    <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.03)] dark:border-white/10 dark:bg-slate-950/82">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-[12px]', toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-0.5 text-[18px] font-bold tracking-[-0.02em] text-slate-950 dark:text-white">{value}</p>
          {subtext && <p className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export function TabletChip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
        active
          ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
          : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabletActionButton({
  children,
  className,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'danger';
}) {
  const toneClass = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
    secondary: 'bg-white text-slate-950 border border-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
  }[tone];

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] font-semibold transition-colors',
        toneClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabletEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-[140px] flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-5 text-center dark:border-white/10 dark:bg-white/5', className)}>
      <p className="text-[14px] font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function TabletPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-950 disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev
      </button>
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-950 disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

export function TabletDialogShell({
  className,
  children,
  width = 'regular',
}: {
  className?: string;
  children: React.ReactNode;
  width?: 'narrow' | 'regular' | 'wide';
}) {
  const widthClass = {
    narrow: 'max-w-[520px]',
    regular: 'max-w-[840px]',
    wide: 'max-w-[1120px]',
  }[width];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-950',
        widthClass,
        className
      )}
    >
      {children}
    </div>
  );
}
