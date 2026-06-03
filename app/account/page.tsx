'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input } from '@app/components/ui/Field';
import { Tag } from '@app/components/ui/Tag';
import { useAuth } from '@app/components/auth/AuthProvider';

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const { state, refresh, signOut, switchOrganization } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const onboard = params.get('onboard') === '1';

  React.useEffect(() => {
    if (state.status === 'guest') router.replace('/login');
  }, [state.status, router]);

  if (state.status === 'loading' || state.status === 'guest') {
    return (
      <AppShell section="Account">
        <div className="aspect-[3/1] rounded-2xl bg-[#0A0A0A] pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell section="Account">
      <PageHead
        eyebrow={state.status === 'no-org' ? 'Welcome — last step' : 'Your account'}
        title={state.status === 'no-org' ? 'Create your first workspace' : state.user.displayName}
        subtitle={state.status === 'no-org'
          ? 'Before you can compose assets, give your workspace a name. You can rename it later.'
          : state.user.email}
        actions={
          state.status === 'member'
            ? <Button variant="secondary" size="md" onClick={() => void signOut()}>Sign out</Button>
            : null
        }
      />

      {state.status === 'no-org' || onboard ? (
        <FirstWorkspaceCard onCreated={async () => { await refresh(); router.replace('/studio-home'); }} />
      ) : null}

      {state.status === 'member' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardEyebrow>Profile</CardEyebrow>
            <CardHeadline>{state.user.displayName}</CardHeadline>
            <CardMeta>{state.user.email}</CardMeta>
            <div className="mt-4 text-[12px] text-[rgba(247,245,242,0.55)]">
              Joined {new Date(state.user.createdAt).toLocaleDateString()}
            </div>
          </Card>
          <Card>
            <CardEyebrow>Active workspace</CardEyebrow>
            <CardHeadline>{state.current.organizationId}</CardHeadline>
            <CardMeta>{state.current.workspaceId}</CardMeta>
            {state.memberships.length > 1 ? (
              <div className="mt-4 space-y-2">
                <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Switch organization</div>
                {state.memberships.map((m) => (
                  <button
                    key={m.membershipId}
                    onClick={() => switchOrganization(m.organizationId)}
                    className={[
                      'w-full text-left rounded-lg border px-3 py-2 text-[13px] transition-colors duration-150',
                      m.organizationId === state.current.organizationId
                        ? 'bg-[#111111] border-[#F7F5F2]'
                        : 'bg-transparent border-[rgba(247,245,242,0.18)] hover:border-[rgba(247,245,242,0.40)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span>{m.organizationId}</span>
                      <Tag>{m.roles[0] ?? 'member'}</Tag>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-[12px] text-[rgba(247,245,242,0.55)]">
                Single-organization account. Memberships are managed by your platform owner.
              </div>
            )}
          </Card>
        </div>
      ) : null}

      <div className="mt-8 text-[12px] text-[rgba(247,245,242,0.45)]">
        Need a different organization? Contact your platform owner.
        <span className="mx-2">·</span>
        <Link href="/studio-home" className="underline hover:text-[#F7F5F2]">Back to Studio</Link>
      </div>
    </AppShell>
  );
}

function FirstWorkspaceCard({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [orgName, setOrgName] = React.useState('');
  const [wspName, setWspName] = React.useState('Default Workspace');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/create-first-workspace', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName, workspaceName: wspName, operatorReason: 'first workspace from /account' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? `Failed (${res.status}).`);
        if (res.status === 409) await onCreated(); // already has one
        return;
      }
      await onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card raised>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Organization name" required>
          <Input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., MOOD" />
        </Field>
        <Field label="Workspace name" helper="One workspace is enough to start">
          <Input value={wspName} onChange={(e) => setWspName(e.target.value)} />
        </Field>
        {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
        <Button type="submit" variant="primary" size="lg" disabled={busy || !orgName}>
          {busy ? 'Setting up…' : 'Create workspace'}
        </Button>
      </form>
    </Card>
  );
}
