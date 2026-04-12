'use client';

import { motion } from 'framer-motion';
import { Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react';
import type { TabletViewportState } from '@/hooks/use-tablet-viewport';

interface TabletAccessGateProps {
  viewport: TabletViewportState;
}

export default function TabletAccessGate({ viewport }: TabletAccessGateProps) {
  const isRotatePrompt = viewport.isPortraitTablet;
  const Icon = isRotatePrompt ? RotateCw : Smartphone;
  const heading = isRotatePrompt ? 'Putar tablet ke mode landscape' : 'Aplikasi ini khusus tampilan tablet';
  const description = isRotatePrompt
    ? 'POS dirancang untuk orientasi horizontal agar area meja, billing, dan admin panel tetap terbaca penuh.'
    : 'Gunakan tablet landscape dengan lebar minimal 768px. Browser desktop tetap bisa dipakai sebagai fallback dalam frame tablet.';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(15,23,42,1))]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-2xl rounded-[32px] border border-gray-200/80 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/80"
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Tablet className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Tablet Experience</p>
                <h1 className="text-xl font-black text-foreground">Rumah Billiard & Cafe</h1>
              </div>
            </div>
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground dark:border-white/10 dark:bg-white/5">
              POS System
            </div>
          </div>

          <div className="grid gap-6 rounded-[28px] border border-gray-200/80 bg-gray-50/80 p-6 dark:border-white/10 dark:bg-white/5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-xl shadow-slate-950/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.28),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),_transparent_32%)]" />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  Access Gate
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">
                      {isRotatePrompt ? 'Orientation mismatch' : 'Viewport too small'}
                    </p>
                    <p className="text-xs text-white/60">
                      {viewport.width > 0 ? `${viewport.width}px × ${viewport.height}px` : 'Mendeteksi viewport'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-white/75">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    Billing meja, order cafe, dan panel admin memakai grid landscape tetap.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    Desktop fallback tetap didukung, tetapi dikunci ke frame tablet untuk menjaga proporsi.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">{heading}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                  <RotateCw className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mode terbaik</p>
                    <p className="text-xs text-muted-foreground">Tablet landscape minimal 768px.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                  <Monitor className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Fallback desktop</p>
                    <p className="text-xs text-muted-foreground">Tetap dapat masuk, tetapi tampil di frame selebar tablet.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                  <Smartphone className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mobile</p>
                    <p className="text-xs text-muted-foreground">Tampilan ponsel diblok untuk menghindari layout terpotong.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
