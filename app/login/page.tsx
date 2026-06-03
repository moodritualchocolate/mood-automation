'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input } from '@app/components/ui/Field';
import { useAuth } from '@app/components/auth/AuthProvider';

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><div /></AuthShell>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const next = params.get('next') ?? '/studio-home';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) { setError('Email or password is incorrect.'); return; }
      if (res.status === 403) { setError('This account is disabled. Contact your operator.'); return; }
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        const retry = j?.retryAt ? new Date(j.retryAt).toLocaleTimeString() : 'shortly';
        setError(`Too many attempts. Try again at ${retry}.`); return;
      }
      if (!res.ok) { setError(`Login failed (${res.status}).`); return; }
      await refresh();
      router.replace(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardEyebrow>Welcome back</CardEyebrow>
        <CardHeadline large>Sign in</CardHeadline>
        <CardMeta>Use the email and password you registered with.</CardMeta>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email" required>
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
          </Field>
          <Field label="Password" required helper="≥ 12 characters">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
          </Field>
          {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
          <Button type="submit" variant="primary" size="lg" block disabled={busy || !email || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-[12px] text-[rgba(247,245,242,0.55)]">
          <span>New here?</span>
          <Link href="/register" className="text-[#F7F5F2] hover:underline">Create an account →</Link>
        </div>
      </Card>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-[#050505] text-[#F7F5F2] flex flex-col">
      <header className="border-b border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 h-14 flex items-center">
          <Link href="/" className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] tracking-tight hover:opacity-80">
            MOOD
            <span className="ml-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.40)] align-middle">
              Creative OS
            </span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
