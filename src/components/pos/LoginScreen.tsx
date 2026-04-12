'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot, Lock, User, Eye, EyeOff, Sun, Moon, ShieldCheck, WalletCards } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { TabletActionButton, TabletChip, TabletPanel } from './TabletPrimitives';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { login, staffList } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  const activeStaff = staffList.filter((staff) => staff.isActive);
  const effectiveStaffId = selectedStaffId || activeStaff[0]?.id || '';
  const selectedStaff = activeStaff.find((staff) => staff.id === effectiveStaffId) ?? null;
  const quickAccounts = activeStaff.slice(0, 2).map((staff) => ({
    label: staff.role === 'admin' ? 'Administrator' : 'Kasir',
    value: `${staff.username} / ${staff.pin}`,
    accent: staff.role === 'admin' ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500',
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      pinRef.current?.focus();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStaffId || pin.length !== 4) return;

    setLoading(true);

    setTimeout(() => {
      const success = login(effectiveStaffId, pin);
      if (success) {
        setError(false);
        onLogin();
      } else {
        setError(true);
        setPin('');
        setTimeout(() => pinRef.current?.focus(), 200);
      }
      setLoading(false);
    }, 280);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.22),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,_#f8fafc,_#e2e8f0_55%,_#f8fafc)] px-7 py-7 dark:bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_24%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)]">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex items-center justify-between">
        <TabletChip active>Tablet POS</TabletChip>
        <button
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
      </div>

      <div className="relative z-10 grid flex-1 grid-cols-[1.08fr_0.92fr] gap-5">
        <TabletPanel className="flex flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/10 shadow-inner shadow-white/10">
                <CircleDot className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-white/55">Mobile App Workspace</p>
                <h1 className="mt-1 text-[34px] font-black tracking-[-0.04em]">Rumah Billiard & Cafe</h1>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-sm leading-6 text-white/72">
              POS tablet untuk operasional kasir, billing meja, order cafe, dan monitoring admin dalam satu workspace landscape.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
                <p className="mt-3 text-sm font-bold">Billing Billiard</p>
                <p className="mt-1 text-xs text-white/60">Open bill, paket jam, dan kontrol meja aktif.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <WalletCards className="h-5 w-5 text-emerald-300" />
                <p className="mt-3 text-sm font-bold">Cafe & Member</p>
                <p className="mt-1 text-xs text-white/60">Open bill FnB, member, dan payment flow kasir.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickAccounts.map((account) => (
              <div key={account.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${account.accent}`} />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">{account.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{account.value}</p>
              </div>
            ))}
          </div>
        </TabletPanel>

        <TabletPanel className="flex flex-col justify-center px-7 py-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Secure Access</p>
            <h2 className="mt-2 text-[30px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">Masuk ke workspace</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Gunakan akun staff untuk membuka dashboard kasir atau panel admin.
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key="login-form"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="mt-7 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Pilih Staff
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activeStaff.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaffId(staff.id);
                        if (error) setError(false);
                        setTimeout(() => pinRef.current?.focus(), 120);
                      }}
                      className={`flex items-center justify-between rounded-[18px] border px-3 py-2.5 text-left transition-colors ${
                        effectiveStaffId === staff.id
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-black">
                          {staff.avatar}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{staff.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{staff.role}</p>
                        </div>
                      </div>
                      <User className="h-4 w-4 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  PIN Staff
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={pinRef}
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (error) setError(false);
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    placeholder={selectedStaff ? `PIN ${selectedStaff.name}` : '••••'}
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm font-semibold tracking-[0.32em] text-slate-950 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-950 dark:hover:text-white"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    Staff atau PIN salah.
                  </motion.div>
                )}
              </AnimatePresence>

              <TabletActionButton
                type="submit"
                disabled={loading || !effectiveStaffId || pin.length !== 4}
                className="w-full justify-center rounded-[22px] py-3.5 text-base"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </TabletActionButton>
            </motion.form>
          </AnimatePresence>
        </TabletPanel>
      </div>
    </div>
  );
}
