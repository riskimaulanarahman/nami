'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TabletActionButton, TabletPanel } from './TabletPrimitives';

interface LoginScreenProps {
  onLogin: () => void;
}

type LoginStep = 'tenant' | 'staff';

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { tenantLogin, staffPinLogin, staffList, tenantAuthenticated, logout } = useAuth();

  const [step, setStep] = useState<LoginStep>('tenant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeStaff = useMemo(
    () => staffList.filter((staff) => staff.isActive),
    [staffList]
  );
  const activeStep: LoginStep = tenantAuthenticated ? 'staff' : step;
  const activeSelectedStaffId = selectedStaffId || activeStaff[0]?.id || '';

  const handleTenantSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    const ok = await tenantLogin(email.trim(), password);
    if (ok) {
      setStep('staff');
      setPassword('');
    } else {
      setError('Email atau password tenant salah.');
    }

    setLoading(false);
  };

  const handleStaffSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSelectedStaffId || pin.length < 4) return;
    setLoading(true);
    setError('');

    const ok = await staffPinLogin(activeSelectedStaffId, pin);
    if (ok) {
      onLogin();
    } else {
      setError('PIN staff tidak valid.');
      setPin('');
    }

    setLoading(false);
  };

  return (
    <div className="flex h-full items-center justify-center bg-slate-100 p-6 dark:bg-slate-950">
      <TabletPanel className="w-full max-w-2xl space-y-6 p-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Single Domain Login
          </p>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Masuk ke TOGA POS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeStep === 'tenant'
              ? 'Langkah 1: Login akun tenant'
              : 'Langkah 2: Pilih staff dan masukkan PIN'}
          </p>
        </div>

        {activeStep === 'tenant' ? (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            onSubmit={handleTenantSubmit}
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Email Tenant
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  placeholder="owner@tenant.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Password Tenant
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <TabletActionButton type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? 'Memproses...' : 'Lanjut ke Pilih Staff'}
            </TabletActionButton>
          </motion.form>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            onSubmit={handleStaffSubmit}
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Staff Tenant
              </label>
              <div className="grid grid-cols-1 gap-2">
                {activeStaff.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left ${
                      activeSelectedStaffId === staff.id
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-black">
                        {staff.avatar || 'ST'}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{staff.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{staff.role}</p>
                      </div>
                    </div>
                    <User className="h-4 w-4 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                PIN Staff
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  placeholder="Masukkan PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <TabletActionButton
                type="button"
                tone="secondary"
                className="flex-1 justify-center"
                onClick={() => {
                  void logout();
                  setStep('tenant');
                  setSelectedStaffId('');
                  setPin('');
                  setError('');
                }}
                disabled={loading}
              >
                Ganti Tenant
              </TabletActionButton>
              <TabletActionButton type="submit" className="flex-1 justify-center" disabled={loading}>
                {loading ? 'Memproses...' : 'Masuk'}
              </TabletActionButton>
            </div>
          </motion.form>
        )}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        ) : null}
      </TabletPanel>
    </div>
  );
}
