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

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthShell><div /></AuthShell>}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [step, setStep] = React.useState<'account' | 'workspace'>('account');
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [orgName, setOrgName] = React.useState('');
  const [wspName, setWspName] = React.useState('Default Workspace');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const next = params.get('next') ?? '/studio-home';

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, displayName, password, operatorReason: 'self-register' }),
      });
      if (res.status === 409) { setError('That email is already registered. Try signing in.'); return; }
      if (res.status === 400) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? 'Check the form and try again.');
        return;
      }
      if (!res.ok) { setError(`Registration failed (${res.status}).`); return; }
      // Registered + session set; now ask for org info.
      await refresh();
      setStep('workspace');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/create-first-workspace', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName, workspaceName: wspName, operatorReason: 'self-register first workspace' }),
      });
      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? 'You already have a workspace — taking you in.');
        await refresh();
        router.replace(next);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? `Workspace creation failed (${res.status}).`);
        return;
      }
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
      {step === 'account' ? (
        <Card>
          <CardEyebrow>Step 1 of 2</CardEyebrow>
          <CardHeadline large>Create your account</CardHeadline>
          <CardMeta>You'll set up your first workspace right after. No credit card required.</CardMeta>
          <form onSubmit={submitAccount} className="mt-6 space-y-4">
            <Field label="Email" required>
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
            </Field>
            <Field label="Display name" required helper="What teammates will see">
              <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Password" required helper="Minimum 12 characters">
              <Input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
            </Field>
            {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
            <Button type="submit" variant="primary" size="lg" block disabled={busy || !email || !displayName || password.length < 12}>
              {busy ? 'Creating…' : 'Continue'}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-between text-[12px] text-[rgba(247,245,242,0.55)]">
            <span>Already registered?</span>
            <Link href="/login" className="text-[#F7F5F2] hover:underline">Sign in →</Link>
          </div>
        </Card>
      ) : (
        <Card>
          <CardEyebrow>Step 2 of 2</CardEyebrow>
          <CardHeadline large>Name your workspace</CardHeadline>
          <CardMeta>This is where your brands, briefs, and assets live. You can rename it later.</CardMeta>
          <form onSubmit={submitWorkspace} className="mt-6 space-y-4">
            <Field label="Organization name" required helper="Usually your company">
              <Input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="MOOD" />
            </Field>
            <Field label="Workspace name" helper="One workspace is enough to start">
              <Input value={wspName} onChange={(e) => setWspName(e.target.value)} placeholder="Default Workspace" />
            </Field>
            {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
            <Button type="submit" variant="primary" size="lg" block disabled={busy || !orgName}>
              {busy ? 'Setting up…' : 'Enter Studio'}
            </Button>
          </form>
        </Card>
      )}
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
