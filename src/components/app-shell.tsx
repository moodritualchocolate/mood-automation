"use client";

import { GlobalSearch } from "@/components/global-search";
import { IconButton, Kbd } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { canEdit, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
  Cloud,
  CloudOff,
  FileText,
  FlaskConical,
  Languages,
  LayoutDashboard,
  Loader2,
  type LucideIcon,
  Moon,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionary";

interface NavItem {
  href: string;
  key: DictKey;
  icon: LucideIcon;
}

interface NavGroup {
  label?: DictKey;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/",      key: "nav.dashboard", icon: LayoutDashboard },
      { href: "/goals", key: "nav.goals",     icon: Target },
    ],
  },
  {
    label: "nav.section.sourcing" as DictKey,
    items: [
      { href: "/suppliers", key: "nav.suppliers", icon: Building2 },
      { href: "/samples",   key: "nav.samples",   icon: FlaskConical },
      { href: "/quotes",    key: "nav.quotes",    icon: Receipt },
    ],
  },
  {
    label: "nav.section.decide" as DictKey,
    items: [
      { href: "/compare", key: "nav.compare", icon: BarChart3 },
      { href: "/tasks",   key: "nav.tasks",   icon: CheckSquare },
      { href: "/files",   key: "nav.files",   icon: FileText },
    ],
  },
];

const FLAT_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
const MOBILE_NAV: NavItem[] = FLAT_NAV.slice(0, 5);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* ─── Sidebar · desktop ────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-e border-border bg-surface lg:flex">
        <Brand />
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && (
                <div className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                  {t(group.label)}
                </div>
              )}
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-fg-2 hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {/* Active accent bar */}
                    {active && (
                      <span
                        className="absolute inset-y-1.5 -start-px w-[3px] rounded-full bg-brand"
                        aria-hidden
                      />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.4 : 2}
                      className={active ? "text-brand" : "text-muted group-hover:text-fg-2"}
                    />
                    <span className="truncate">{t(item.key)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <SidebarFooter />
      </aside>

      {/* ─── Main column ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onSearch={() => setSearchOpen(true)} />
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1240px] animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Mobile bottom nav ────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active ? "text-brand" : "text-muted",
                )}
              >
                {active && (
                  <span className="absolute inset-x-7 top-0 h-[2px] rounded-full bg-brand" aria-hidden />
                )}
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                <span className="truncate">{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

/* ─── Brand lockup · top of sidebar ─────────────────────────── */
function Brand() {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-surface-2/60"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-fg shadow-sm transition-transform group-hover:scale-105"
        style={{
          background: "linear-gradient(135deg, rgb(var(--brand-2)) 0%, rgb(var(--brand)) 100%)",
          boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.15)",
        }}
      >
        <Sparkles size={16} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[14px] font-bold tracking-tight">{t("app.name")}</span>
        <span className="block truncate text-[11px] text-muted">{t("app.tagline")}</span>
      </span>
    </Link>
  );
}

/* ─── Topbar · sticky · breadcrumb + command palette ────────── */
function Topbar({ onSearch }: { onSearch: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const current = FLAT_NAV.find((n) => isActive(pathname, n.href));

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile brand */}
      <Link
        href="/"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-fg lg:hidden"
        style={{
          background: "linear-gradient(135deg, rgb(var(--brand-2)) 0%, rgb(var(--brand)) 100%)",
        }}
      >
        <Sparkles size={14} strokeWidth={2.4} />
      </Link>

      {/* Breadcrumb · the current section name */}
      <div className="hidden items-center gap-2 sm:flex">
        {current?.icon && <current.icon size={15} className="text-muted" />}
        <span className="text-[13.5px] font-semibold text-fg">
          {current ? t(current.key) : t("app.full")}
        </span>
      </div>

      {/* Command palette trigger · the most-used affordance */}
      <button
        onClick={onSearch}
        className={cn(
          "ms-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-[13px] text-muted",
          "transition-all duration-150 hover:border-border-strong hover:bg-surface hover:text-fg-2",
          "w-full max-w-[320px]",
        )}
      >
        <Search size={14} strokeWidth={2.2} />
        <span className="truncate">{t("search.placeholder")}</span>
        <span className="ms-auto hidden items-center gap-0.5 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <SaveIndicator />
      <div className="hidden h-5 w-px bg-border sm:block" aria-hidden />
      <LangToggle />
      <ThemeToggle />
    </header>
  );
}

/* ─── Save indicator · subtle, never shouts ─────────────────── */
function SaveIndicator() {
  const saving = useStore((s) => s.saving);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const { t } = useI18n();
  if (!saving && !lastSavedAt) return null;
  return (
    <span className="hidden items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11.5px] font-medium text-muted sm:flex">
      {saving ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          {t("action.saving")}
        </>
      ) : (
        <>
          <Check size={12} className="text-success" strokeWidth={2.6} />
          {t("action.saved")}
        </>
      )}
    </span>
  );
}

function LangToggle() {
  const { lang, toggle } = useI18n();
  return (
    <IconButton onClick={toggle} aria-label="language" title={lang === "he" ? "English" : "עברית"}>
      <Languages size={16} strokeWidth={2.2} />
      <span className="sr-only">{lang}</span>
    </IconButton>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton onClick={toggle} aria-label="theme">
      {theme === "dark" ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
    </IconButton>
  );
}

/* ─── Sidebar footer · settings + workspace meta ────────────── */
function SidebarFooter() {
  const { t } = useI18n();
  const role = useStore((s) => s.role);
  const settingsActive = usePathname() === "/settings";

  return (
    <div className="space-y-2 border-t border-border p-3">
      <Link
        href="/settings"
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition",
          settingsActive
            ? "bg-surface-2 text-fg"
            : "text-fg-2 hover:bg-surface-2 hover:text-fg",
        )}
      >
        <Settings size={16} strokeWidth={2} className="text-muted" />
        {t("nav.settings")}
      </Link>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
          {isSupabaseConfigured ? (
            <Cloud size={12} className="text-success" />
          ) : (
            <CloudOff size={12} className="text-faint" />
          )}
          {isSupabaseConfigured ? t("settings.cloud") : t("settings.local")}
        </span>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          canEdit(role) ? "bg-brand-soft text-brand" : "bg-warning-soft text-warning",
        )}>
          {t(`settings.role.${role}` as DictKey)}
        </span>
      </div>
    </div>
  );
}
