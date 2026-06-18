"use client";

import { GlobalSearch } from "@/components/global-search";
import { IconButton } from "@/components/ui/primitives";
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
  Cloud,
  FileText,
  FlaskConical,
  Languages,
  LayoutDashboard,
  Loader2,
  Moon,
  type LucideIcon,
  Receipt,
  Search,
  Settings,
  Sun,
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

const NAV: NavItem[] = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/suppliers", key: "nav.suppliers", icon: Building2 },
  { href: "/samples", key: "nav.samples", icon: FlaskConical },
  { href: "/quotes", key: "nav.quotes", icon: Receipt },
  { href: "/compare", key: "nav.compare", icon: BarChart3 },
  { href: "/tasks", key: "nav.tasks", icon: CheckSquare },
  { href: "/files", key: "nav.files", icon: FileText },
];

const MOBILE_NAV = NAV.slice(0, 5);

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
    <div className="flex min-h-dvh">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-border bg-surface lg:flex">
        <Brand />
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon size={18} className={active ? "text-brand" : ""} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <SidebarFooter />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onSearch={() => setSearchOpen(true)} />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <Icon size={20} />
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      className="flex items-center gap-3 border-b border-border px-5 py-4"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-fg font-bold">
        M
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight">
          {t("app.name")}
        </span>
        <span className="block text-[11px] text-muted">{t("app.tagline")}</span>
      </span>
    </Link>
  );
}

function Topbar({ onSearch }: { onSearch: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(pathname, n.href));

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <div className="lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
          M
        </span>
      </div>
      <h1 className="hidden text-sm font-semibold sm:block lg:text-base">
        {current ? t(current.key) : t("app.full")}
      </h1>

      <button
        onClick={onSearch}
        className="ms-auto flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm text-faint transition hover:border-border-strong sm:max-w-xs"
      >
        <Search size={16} />
        <span className="truncate">{t("search.placeholder")}</span>
        <kbd className="ms-auto hidden rounded border border-border px-1.5 text-[10px] text-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <SaveIndicator />
      <LangToggle />
      <ThemeToggle />
    </header>
  );
}

function SaveIndicator() {
  const saving = useStore((s) => s.saving);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const { t } = useI18n();
  if (!saving && !lastSavedAt) return null;
  return (
    <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
      {saving ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          {t("action.saving")}
        </>
      ) : (
        <>
          <Check size={13} className="text-success" />
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
      <Languages size={18} />
      <span className="sr-only">{lang}</span>
    </IconButton>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton onClick={toggle} aria-label="theme">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}

function SidebarFooter() {
  const { t } = useI18n();
  const role = useStore((s) => s.role);
  return (
    <div className="space-y-2 border-t border-border p-3">
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
      >
        <Settings size={18} />
        {t("nav.settings")}
      </Link>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <Cloud size={13} />
          {isSupabaseConfigured ? t("settings.cloud") : t("settings.local")}
        </span>
        <span
          className={cn(
            "chip border-transparent px-2 py-0.5 text-[10px] font-semibold",
            canEdit(role) ? "bg-brand-soft text-brand" : "bg-warning/15 text-warning",
          )}
        >
          {t(`settings.role.${role}` as DictKey)}
        </span>
      </div>
    </div>
  );
}
