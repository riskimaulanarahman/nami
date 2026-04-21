'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Plus, Shield, Trash2, UserCog, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { Staff } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TabletActionButton, TabletMetricCard, TabletPage, TabletPagination, TabletPanel, TabletSectionHeader, paginateItems } from './TabletPrimitives';

interface FormData {
  name: string;
  username: string;
  pin: string;
  role: 'admin' | 'kasir';
}

const emptyForm: FormData = { name: '', username: '', pin: '', role: 'kasir' };
const PAGE_SIZE = 6;

export default function AdminStaff() {
  const { staffList, currentStaff, addStaff, updateStaff, deleteStaff } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState('');

  const activeCount = staffList.filter((staff) => staff.isActive).length;
  const adminCount = staffList.filter((staff) => staff.role === 'admin' && staff.isActive).length;
  const kasirCount = staffList.filter((staff) => staff.role === 'kasir' && staff.isActive).length;
  const paged = useMemo(() => paginateItems(staffList, page, PAGE_SIZE), [page, staffList]);

  const validateForm = (requirePin: boolean) => {
    if (!form.name.trim()) return 'Nama staff wajib diisi.';
    if (!form.username.trim()) return 'Username staff wajib diisi.';
    if (requirePin && form.pin.length !== 4) return 'PIN staff harus 4 digit.';
    if (!requirePin && form.pin.length > 0 && form.pin.length !== 4) return 'PIN baru harus 4 digit.';
    return '';
  };

  const handleAdd = async () => {
    const validationError = validateForm(true);
    if (validationError) {
      setFormError(validationError);
      toast({
        title: 'Data staff belum lengkap',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }
    const initials = form.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
    try {
      await addStaff({
        name: form.name.trim(),
        username: form.username.trim(),
        pin: form.pin,
        role: form.role,
        avatar: initials,
        isActive: true,
      });
      setForm(emptyForm);
      setFormError('');
      setShowForm(false);
      toast({
        title: 'Staff ditambahkan',
        description: `${form.name.trim()} berhasil masuk ke daftar staff.`,
      });
    } catch (error) {
      setFormError('Gagal menambahkan staff. Coba lagi.');
      toast({
        title: 'Gagal menambahkan staff',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan staff.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (staff: Staff) => {
    setForm({
      name: staff.name,
      username: staff.username,
      pin: '',
      role: staff.role,
    });
    setEditingId(staff.id);
    setFormError('');
  };

  const handleSaveEdit = async () => {
    const validationError = validateForm(false);
    if (!editingId || validationError) {
      if (validationError) {
        setFormError(validationError);
        toast({
          title: 'Perubahan staff belum valid',
          description: validationError,
          variant: 'destructive',
        });
      }
      return;
    }
    const initials = form.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
    try {
      await updateStaff(editingId, {
        name: form.name.trim(),
        username: form.username.trim(),
        role: form.role,
        avatar: initials,
        ...(form.pin ? { pin: form.pin } : {}),
      });
      setEditingId(null);
      setForm(emptyForm);
      setFormError('');
      toast({
        title: 'Staff diperbarui',
        description: 'Perubahan data staff berhasil disimpan.',
      });
    } catch (error) {
      setFormError('Gagal menyimpan perubahan staff.');
      toast({
        title: 'Gagal memperbarui staff',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan perubahan.',
        variant: 'destructive',
      });
    }
  };

  const canDelete = (id: string) => {
    if (id === currentStaff?.id) return false;
    const target = staffList.find((staff) => staff.id === id);
    if (target?.role === 'admin') {
      return staffList.filter((staff) => staff.role === 'admin' && staff.id !== id).length > 0;
    }
    return true;
  };

  const toggleActive = async (id: string) => {
    if (id === currentStaff?.id) {
      toast({
        title: 'Aksi ditolak',
        description: 'Staff yang sedang login tidak bisa dinonaktifkan.',
        variant: 'destructive',
      });
      return;
    }
    const target = staffList.find((staff) => staff.id === id);
    if (!target) return;
    try {
      await updateStaff(id, { isActive: !target.isActive });
      toast({
        title: target.isActive ? 'Staff dinonaktifkan' : 'Staff diaktifkan',
        description: `${target.name} sekarang ${target.isActive ? 'nonaktif' : 'aktif'}.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal mengubah status staff',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengubah status staff.',
        variant: 'destructive',
      });
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setDeleteConfirm(null);
    setFormError('');
  };

  const handleDelete = async (staff: Staff) => {
    if (!canDelete(staff.id)) {
      toast({
        title: 'Staff tidak bisa dihapus',
        description: staff.id === currentStaff?.id
          ? 'Staff yang sedang login tidak bisa dihapus.'
          : 'Minimal harus ada satu admin aktif yang tersisa.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteStaff(staff.id);
      setDeleteConfirm(null);
      toast({
        title: 'Staff dihapus',
        description: `${staff.name} berhasil dihapus dari daftar staff.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal menghapus staff',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus staff.',
        variant: 'destructive',
      });
    }
  };

  return (
    <TabletPage
      eyebrow="Master Data"
      title="Staff Access"
      subtitle="Kelola admin dan kasir aktif dengan kontrol akses yang tetap muat di layar tablet."
      actions={
        <TabletActionButton onClick={() => { setShowForm(true); setForm(emptyForm); }}>
          <Plus className="h-4 w-4" />
          Tambah Staff
        </TabletActionButton>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <TabletMetricCard icon={Users} label="Active Staff" value={`${activeCount}`} subtext="Sedang aktif" tone="info" />
        <TabletMetricCard icon={Shield} label="Admin" value={`${adminCount}`} subtext="Akses penuh" tone="success" />
        <TabletMetricCard icon={UserCog} label="Kasir" value={`${kasirCount}`} subtext="Operasional harian" tone="warning" />
      </div>

      <TabletPanel className="space-y-3">
        <TabletSectionHeader title="Akun Staff" subtitle="Edit role, PIN, dan status staff secara langsung dari registry." />
        {formError ? (
          <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {formError}
          </div>
        ) : null}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-[1fr_0.95fr_0.7fr_0.7fr_auto] gap-2.5 overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <input type="text" placeholder="Nama" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
              <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
              <input type="text" placeholder="PIN" maxLength={4} value={form.pin} onChange={(e) => setForm((current) => ({ ...current, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
              <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as 'admin' | 'kasir' }))} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60">
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <TabletActionButton onClick={handleAdd}><Check className="h-4 w-4" /></TabletActionButton>
                <TabletActionButton tone="secondary" onClick={cancelForm}><X className="h-4 w-4" /></TabletActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-2">
          {paged.items.map((staff) => {
            const editing = editingId === staff.id;
            const deletable = canDelete(staff.id);
            return (
              <div key={staff.id} className="grid grid-cols-[1fr_0.9fr_0.6fr_0.5fr_auto] items-center gap-2.5 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                {editing ? (
                  <>
                    <input type="text" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
                    <input type="text" value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
                    <input type="text" value={form.pin} maxLength={4} onChange={(e) => setForm((current) => ({ ...current, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60" />
                    <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as 'admin' | 'kasir' }))} className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950/60">
                      <option value="kasir">Kasir</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <TabletActionButton onClick={handleSaveEdit}><Check className="h-4 w-4" /></TabletActionButton>
                      <TabletActionButton tone="secondary" onClick={cancelForm}><X className="h-4 w-4" /></TabletActionButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
                        {staff.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-[-0.02em] text-slate-950 dark:text-white">{staff.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{staff.username}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
                      staff.role === 'admin'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                    )}>
                      {staff.role}
                    </span>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">••••</p>
                    <button
                      onClick={() => toggleActive(staff.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
                        staff.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                      )}
                    >
                      {staff.isActive ? 'aktif' : 'off'}
                    </button>
                    <div className="flex justify-end gap-2">
                      <TabletActionButton tone="secondary" onClick={() => handleEdit(staff)}><Pencil className="h-4 w-4" /></TabletActionButton>
                      {deleteConfirm === staff.id ? (
                        <>
                          <TabletActionButton tone="danger" onClick={() => { void handleDelete(staff); }}>Hapus</TabletActionButton>
                          <TabletActionButton tone="secondary" onClick={() => setDeleteConfirm(null)}>Batal</TabletActionButton>
                        </>
                      ) : (
                        <TabletActionButton
                          tone="secondary"
                          onClick={() => deletable && setDeleteConfirm(staff.id)}
                          disabled={!deletable}
                          className={cn(!deletable && 'opacity-50')}
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
