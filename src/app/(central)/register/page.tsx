'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Zap,
  Store,
  User,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCentralApiBaseUrl } from '@/lib/tenant';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama toko minimal 2 karakter').max(255, 'Nama toko maksimal 255 karakter'),
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(72, 'Password terlalu panjang'),
  adminName: z.string().trim().min(2, 'Nama admin minimal 2 karakter').max(255, 'Nama admin maksimal 255 karakter'),
  adminPin: z.string().regex(/^\d{4,12}$/, 'PIN admin 4-12 digit angka'),
});

type RegisterValues = z.infer<typeof registerSchema>;

type RegisterApiError = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

type RegisterApiSuccess = {
  message?: string;
};

function parseValidationErrors(errors: Record<string, string[] | string> = {}): string[] {
  return Object.values(errors)
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function buildErrorMessage(payload: RegisterApiError, status: number): string {
  const validationMessages = parseValidationErrors(payload.errors);
  if (validationMessages.length) {
    return validationMessages.slice(0, 3).join(' ');
  }

  if (payload.message) return payload.message;
  if (status >= 500) return 'Server sedang bermasalah. Silakan coba lagi beberapa saat.';
  if (status === 422) return 'Data pendaftaran belum valid. Mohon cek kembali form Anda.';
  return 'Gagal mendaftarkan toko.';
}

async function parseResponseBody(response: Response): Promise<RegisterApiError | RegisterApiSuccess> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = (await response.text()).trim();
  return text ? { message: text } : {};
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStoreUrl] = useState('/app');

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      adminName: '',
      adminPin: '',
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setIsLoading(true);
    setError(null);

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      admin_name: values.adminName.trim(),
      admin_pin: values.adminPin.trim(),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${getCentralApiBaseUrl()}/tenants/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(buildErrorMessage(responseBody as RegisterApiError, response.status));
      }

      setIsSuccess(true);
      form.reset();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Permintaan timeout. Periksa koneksi Anda lalu coba lagi.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak diketahui.');
      }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-xl">
          <CardContent className="pt-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Toko Berhasil Dibuat</h2>
            <p className="mt-4 text-slate-600">Tenant berhasil dibuat. Login melalui:</p>
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 font-mono font-bold text-orange-600">{createdStoreUrl}</div>
            <Button
              className="mt-8 w-full bg-orange-600 hover:bg-orange-500"
              onClick={() => window.location.assign(createdStoreUrl)}
            >
              Buka Toko Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg border-slate-200 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-200">
              <Zap className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Daftar TOGA POS</CardTitle>
          <CardDescription>Mulai kelola bisnis biliar dan kafe Anda dalam hitungan menit.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nama Toko</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Toko Biliar Jaya"
                          className="h-11 rounded-xl pl-10"
                          autoComplete="organization"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Email Tenant</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="owner@toko.com"
                          className="h-11 rounded-xl pl-10"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Password Tenant</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-11 rounded-xl pl-10"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nama Staff Admin</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Admin Toko"
                          className="h-11 rounded-xl pl-10"
                          autoComplete="name"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">PIN Staff Admin</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          type="password"
                          inputMode="numeric"
                          placeholder="1234"
                          className="h-11 rounded-xl pl-10"
                          autoComplete="off"
                          disabled={isLoading}
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, 12))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-orange-600 text-lg font-bold shadow-lg shadow-orange-100 hover:bg-orange-500"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  'Buat Toko Sekarang'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 bg-slate-50/50 py-6">
          <p className="text-sm text-slate-500">
            Sudah punya toko?{' '}
            <Link href="/app" className="font-bold text-orange-600 hover:underline">
              Masuk di halaman login utama
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
