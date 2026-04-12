'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import type { TableType } from '@/context/PosContext';
import { TabletActionButton, TabletMetricCard, TabletPage, TabletPagination, TabletPanel, TabletSectionHeader, paginateItems } from './TabletPrimitives';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface FormData {
  name: string;
  type: TableType;
  hourlyRate: number;
  sessionDurationHours: number;
}

const emptyForm: FormData = { name: '', type: 'standard', hourlyRate: 25000, sessionDurationHours: 0 };
const PAGE_SIZE = 8;

export default function AdminTables() {
  const { tables, addTable, updateTable, deleteTable } = usePos();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const availableCount = tables.filter((table) => table.status === 'available').length;
  const vipCount = tables.filter((table) => table.type === 'vip').length;
  const paged = useMemo(() => paginateItems(tables, page, PAGE_SIZE), [page, tables]);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addTable(form);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (id: number) => {
    const table = tables.find((entry) => entry.id === id);
    if (!table) return;
    setForm({ name: table.name, type: table.type, hourlyRate: table.hourlyRate, sessionDurationHours: table.sessionDurationHours });
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name.trim()) return;
    updateTable(editingId, { name: form.name, type: form.type, hourlyRate: form.hourlyRate, sessionDurationHours: form.sessionDurationHours });
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: number) => {
    const table = tables.find((entry) => entry.id === id);
    if (!table || table.status === 'occupied') return;
    deleteTable(id);
    setDeleteConfirm(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <TabletPage
      eyebrow="Master Data"
      title="Table Registry"
      subtitle="Kelola kapasitas meja, tarif per jam, dan status operasional dalam layout tablet yang padat."
      actions={
        <TabletActionButton onClick={() => { setShowForm(true); setForm(emptyForm); }}>
          <Plus className="h-4 w-4" />
          Tambah Meja
        </TabletActionButton>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <TabletMetricCard icon={Plus} label="Total" value={`${tables.length}`} subtext="Meja terdaftar" />
        <TabletMetricCard icon={Check} label="Available" value={`${availableCount}`} subtext="Siap pakai" tone="success" />
        <TabletMetricCard icon={Crown} label="VIP" value={`${vipCount}`} subtext="Room premium" tone="warning" />
      </div>

      <TabletPanel className="space-y-3">
        <TabletSectionHeader
          title="Konfigurasi Meja"
          subtitle="Tambah atau edit meja aktif tanpa meninggalkan workspace."
        />

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-[1.1fr_0.8fr_0.8fr_auto] gap-2.5 overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <input
                type="text"
                placeholder="Nama meja"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none dark:border-white/10 dark:bg-slate-950/60"
              />
              <select
                value={form.type}
                onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as TableType }))}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none dark:border-white/10 dark:bg-slate-950/60"
              >
                <option value="standard">Standar</option>
                <option value="vip">VIP</option>
              </select>
              <input
                type="number"
                placeholder="Tarif/jam"
                value={form.hourlyRate}
                onChange={(e) => setForm((current) => ({ ...current, hourlyRate: parseInt(e.target.value, 10) || 0 }))}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none dark:border-white/10 dark:bg-slate-950/60"
              />
              <div className="flex gap-2">
                <TabletActionButton onClick={handleAdd}><Check className="h-4 w-4" /> Simpan</TabletActionButton>
                <TabletActionButton tone="secondary" onClick={cancelForm}><X className="h-4 w-4" /> Batal</TabletActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-2">
          {paged.items.map((table) => {
            const isEditing = editingId === table.id;
            return (
              <div
                key={table.id}
                className="grid grid-cols-[1.05fr_0.7fr_0.7fr_0.7fr_auto] items-center gap-2.5 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                      className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60"
                    />
                    <select
                      value={form.type}
                      onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as TableType }))}
                      className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <option value="standard">Standar</option>
                      <option value="vip">VIP</option>
                    </select>
                    <input
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) => setForm((current) => ({ ...current, hourlyRate: parseInt(e.target.value, 10) || 0 }))}
                      className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60"
                    />
                    <div />
                    <div className="flex justify-end gap-2">
                      <TabletActionButton onClick={handleSaveEdit}><Check className="h-4 w-4" /> Simpan</TabletActionButton>
                      <TabletActionButton tone="secondary" onClick={cancelForm}><X className="h-4 w-4" /> Batal</TabletActionButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-black tracking-[-0.02em] text-slate-950 dark:text-white">{table.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatRupiah(table.hourlyRate)} / jam</p>
                    </div>
                    <span className={cn(
                      'inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
                      table.type === 'vip'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                    )}>
                      {table.type === 'vip' ? 'VIP' : 'Standar'}
                    </span>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{formatRupiah(table.hourlyRate)}</p>
                    <span className={cn(
                      'inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
                      table.status === 'available'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : table.status === 'occupied'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    )}>
                      {table.status}
                    </span>
                    <div className="flex justify-end gap-2">
                      <TabletActionButton tone="secondary" onClick={() => handleEdit(table.id)}>
                        <Pencil className="h-4 w-4" />
                      </TabletActionButton>
                      {deleteConfirm === table.id ? (
                        <>
                          <TabletActionButton tone="danger" onClick={() => handleDelete(table.id)}>Hapus</TabletActionButton>
                          <TabletActionButton tone="secondary" onClick={() => setDeleteConfirm(null)}>Batal</TabletActionButton>
                        </>
                      ) : (
                        <TabletActionButton
                          tone="secondary"
                          onClick={() => table.status !== 'occupied' && setDeleteConfirm(table.id)}
                          disabled={table.status === 'occupied'}
                          className={cn(table.status === 'occupied' && 'opacity-50')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </TabletActionButton>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <TabletPagination page={paged.page} totalPages={paged.totalPages} onPageChange={setPage} />
      </TabletPanel>
    </TabletPage>
  );
}
