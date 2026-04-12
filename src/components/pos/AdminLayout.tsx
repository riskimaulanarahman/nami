'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CircleDot,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Settings,
  Square,
  Sun,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { AppShellMode } from '@/hooks/use-tablet-viewport';

export type AdminPage = 'dashboard' | 'tables' | 'menu' | 'inventory' | 'orders' | 'staff' | 'reports' | 'settings';

interface AdminLayoutProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onBackToPos: () => void;
  onLogout: () => void;
  shellMode: AppShellMode;
  children: React.ReactNode;
}

const navGroups: {
  label: string;
  items: { id: AdminPage; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: 'Live',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: History },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { id: 'tables', label: 'Tables', icon: Square },
      { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'staff', label: 'Staff', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', icon: Settings }],
  },
];

export default function AdminLayout({
  currentPage,
  onNavigate,
  onBackToPos,
  onLogout,
  shellMode,
  children,
}: AdminLayoutProps) {
  const { currentStaff } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const shellPadding = shellMode === 'wide' ? 'p-4' : 'p-3';
  const sidebarWidth = shellMode === 'compact' ? 'w-[236px]' : 'w-[258px]';

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      <div className={cn('mx-auto h-full w-full max-w-[1680px]', shellPadding)}>
        <div className="flex h-full min-h-0 gap-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950">
          <aside className={cn('flex min-h-0 flex-col border-r border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950', sidebarWidth)}>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <CircleDot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Control Room</p>
                  <h1 className="text-[16px] font-bold text-slate-950 dark:text-white">Admin Tablet</h1>
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                Master data, laporan, dan pengaturan operasional dalam satu workspace tablet.
              </p>
            </div>

            <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = currentPage === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-semibold transition-colors',
                            active
                              ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-2.5 dark:border-white/10">
              <button
                onClick={onBackToPos}
                className="flex w-full items-center gap-2 rounded-[14px] bg-slate-100 px-3 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke POS
              </button>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-[14px] bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="border-b border-slate-200 px-5 py-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    {navGroups.find((group) => group.items.some((item) => item.id === currentPage))?.label ?? 'Workspace'}
                  </p>
                  <h2 className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
                    {navGroups.flatMap((group) => group.items).find((item) => item.id === currentPage)?.label ?? 'Dashboard'}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                  >
                    {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </motion.button>

                  {currentStaff && (
                    <div className="flex items-center gap-2.5 rounded-[14px] border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-white/10 dark:bg-white/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
                        {currentStaff.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-950 dark:text-white">{currentStaff.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                          {currentStaff.role}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-hidden p-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
