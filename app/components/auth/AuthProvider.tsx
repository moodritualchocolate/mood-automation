'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/** Membership shape returned by /api/auth/me. */
export interface MembershipRow {
  membershipId: string;
  organizationId: string;
  memberId: string;
  displayName: string;
  roles: string[];
  createdAt: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  createdAt: number;
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'member';   user: AuthUser; memberships: MembershipRow[]; current: { organizationId: string; workspaceId: string } }
  | { status: 'no-org';   user: AuthUser; memberships: MembershipRow[] };

interface AuthContextValue {
  state: AuthState;
  /** Refresh /api/auth/me from the server. */
  refresh: () => Promise<void>;
  /** Switch the active organization (must be in the user's memberships). */
  switchOrganization: (organizationId: string) => void;
  /** Sign out: revoke + redirect to /login. */
  signOut: (redirectTo?: string) => Promise<void>;
}

const Ctx = React.createContext<AuthContextValue | null>(null);

/** Workspace inferred from organization. For the alpha we use the
 *  "default workspace" pattern: the first workspace the user has in
 *  the org, with a fallback to `${organizationId}-default`. */
function inferDefaultWorkspaceId(organizationId: string): string {
  if (organizationId === 'org-mood') return 'wsp-mood-default';
  // Best-effort: the bootstrap convention is `${orgId}-default` for
  // self-served orgs. The asset-registry / brand routes will 403 if
  // this guess is wrong and the operator will see "no membership".
  return `${organizationId}-default`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: 'loading' });

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) { setState({ status: 'guest' }); return; }
      if (!res.ok) { setState({ status: 'guest' }); return; }
      const json = await res.json() as { user: AuthUser | null; memberships?: MembershipRow[] };
      if (!json.user) { setState({ status: 'guest' }); return; }
      const memberships = json.memberships ?? [];
      if (memberships.length === 0) {
        setState({ status: 'no-org', user: json.user, memberships });
        return;
      }
      // Restore last-active organization from localStorage if available.
      let preferred: string | undefined;
      try {
        const stored = window.localStorage.getItem('mood:activeOrg');
        if (stored && memberships.some((m) => m.organizationId === stored)) preferred = stored;
      } catch {/* localStorage may throw in private mode */}
      const orgId = preferred ?? memberships[0].organizationId;
      const wspId = inferDefaultWorkspaceId(orgId);
      setState({ status: 'member', user: json.user, memberships, current: { organizationId: orgId, workspaceId: wspId } });
    } catch {
      setState({ status: 'guest' });
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const switchOrganization = React.useCallback((organizationId: string) => {
    setState((cur) => {
      if (cur.status !== 'member') return cur;
      if (!cur.memberships.some((m) => m.organizationId === organizationId)) return cur;
      try { window.localStorage.setItem('mood:activeOrg', organizationId); } catch {/* silent */}
      return {
        ...cur,
        current: { organizationId, workspaceId: inferDefaultWorkspaceId(organizationId) },
      };
    });
  }, []);

  const signOut = React.useCallback(async (redirectTo = '/login') => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operatorReason: 'operator logout' }),
      });
    } catch {/* silent */}
    try { window.localStorage.removeItem('mood:activeOrg'); } catch {/* silent */}
    setState({ status: 'guest' });
    window.location.href = redirectTo;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ state, refresh, switchOrganization, signOut }),
    [state, refresh, switchOrganization, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Convenience hook: returns the active tenant context. Throws when
 *  the user is not a member of any organization — pages that need
 *  tenant context should redirect to /onboarding-org first via
 *  useRequireTenant(). */
export function useTenantContext(): { organizationId: string; workspaceId: string } {
  const { state } = useAuth();
  if (state.status !== 'member') {
    throw new Error('useTenantContext requires a member session');
  }
  return state.current;
}

/** Guards a page: redirects guests to /login and no-org users to
 *  /account?onboard=1. Returns the tenant context once available. */
export function useRequireTenant(): { organizationId: string; workspaceId: string } | null {
  const { state } = useAuth();
  const router = useRouter();
  React.useEffect(() => {
    if (state.status === 'guest') router.replace('/login');
    if (state.status === 'no-org') router.replace('/account?onboard=1');
  }, [state.status, router]);
  if (state.status === 'member') return state.current;
  return null;
}
