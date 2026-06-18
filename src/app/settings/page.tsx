"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button, Card } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import type { Lang } from "@/lib/i18n/dictionary";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cloud, Database, Languages, Moon, Shield, Sun } from "lucide-react";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const reseed = useStore((s) => s.reseed);
  const clearAll = useStore((s) => s.clearAll);

  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="grid max-w-3xl grid-cols-1 gap-4">
        {/* Language */}
        <Card>
          <Row icon={<Languages size={16} />} title={t("settings.language")} />
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            options={[
              { value: "he", label: t("settings.hebrew") },
              { value: "en", label: t("settings.english") },
            ]}
          />
        </Card>

        {/* Theme */}
        <Card>
          <Row icon={theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} title={t("settings.theme")} />
          <Segmented
            value={theme}
            onChange={(v) => setTheme(v as "light" | "dark")}
            options={[
              { value: "light", label: t("settings.light") },
              { value: "dark", label: t("settings.dark") },
            ]}
          />
        </Card>

        {/* Role */}
        <Card>
          <Row icon={<Shield size={16} />} title={t("settings.role")} hint={t("settings.roleNote")} />
          <Segmented<Role>
            value={role}
            onChange={setRole}
            options={(["admin", "manager", "viewer"] as Role[]).map((r) => ({
              value: r,
              label: t(`settings.role.${r}` as DictKey),
            }))}
          />
        </Card>

        {/* Backend */}
        <Card>
          <Row icon={<Cloud size={16} />} title={t("settings.backend")} />
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              isSupabaseConfigured ? "bg-success/12 text-success" : "bg-surface-2 text-muted",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", isSupabaseConfigured ? "bg-success" : "bg-warning")} />
            {isSupabaseConfigured ? t("settings.cloud") : t("settings.local")}
          </div>
        </Card>

        {/* Data */}
        <Card>
          <Row icon={<Database size={16} />} title={t("settings.data")} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={reseed}>{t("settings.reseed")}</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(t("settings.clear") + "?")) clearAll();
              }}
            >
              {t("settings.clear")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted">{icon}</span>
        {title}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
            value === o.value ? "bg-brand text-brand-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
