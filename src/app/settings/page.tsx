"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, Chip } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useStore } from "@/lib/store";
import { useOsStore } from "@/lib/os/osStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import type { Lang } from "@/lib/i18n/dictionary";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Bot,
  Cloud,
  CloudOff,
  Database,
  Languages,
  type LucideIcon,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const reseed = useStore((s) => s.reseed);
  const clearAll = useStore((s) => s.clearAll);
  const autonomyEnabled = useOsStore((s) => s.autonomyEnabled);
  const setAutonomy = useOsStore((s) => s.setAutonomy);

  return (
    <>
      <PageHeader
        eyebrow={t("app.full")}
        title={t("settings.title")}
        subtitle="Preferences & data · saved locally on this device."
      />

      <div className="grid max-w-3xl grid-cols-1 gap-3">
        {/* Autonomy master switch */}
        <SettingsRow
          icon={Bot}
          title={t("os.autonomy")}
          hint={t("os.autonomy.note")}
        >
          <Segmented
            value={autonomyEnabled ? "on" : "off"}
            onChange={(v) => setAutonomy(v === "on")}
            options={[
              { value: "on", label: t("os.autonomy.on") },
              { value: "off", label: t("os.autonomy.off") },
            ]}
          />
        </SettingsRow>

        {/* Language */}
        <SettingsRow
          icon={Languages}
          title={t("settings.language")}
        >
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            options={[
              { value: "he", label: t("settings.hebrew") },
              { value: "en", label: t("settings.english") },
            ]}
          />
        </SettingsRow>

        {/* Theme */}
        <SettingsRow
          icon={theme === "dark" ? Moon : Sun}
          title={t("settings.theme")}
        >
          <Segmented
            value={theme}
            onChange={(v) => setTheme(v as "light" | "dark")}
            options={[
              { value: "light", label: t("settings.light") },
              { value: "dark", label: t("settings.dark") },
            ]}
          />
        </SettingsRow>

        {/* Role */}
        <SettingsRow
          icon={Shield}
          title={t("settings.role")}
          hint={t("settings.roleNote")}
        >
          <Segmented<Role>
            value={role}
            onChange={setRole}
            options={(["admin", "manager", "viewer"] as Role[]).map((r) => ({
              value: r,
              label: t(`settings.role.${r}` as DictKey),
            }))}
          />
        </SettingsRow>

        {/* Backend */}
        <SettingsRow
          icon={isSupabaseConfigured ? Cloud : CloudOff}
          title={t("settings.backend")}
        >
          <Chip tone={isSupabaseConfigured ? "success" : "neutral"}>
            <span className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              isSupabaseConfigured ? "bg-success" : "bg-faint",
            )} />
            {isSupabaseConfigured ? t("settings.cloud") : t("settings.local")}
          </Chip>
        </SettingsRow>

        {/* Data */}
        <SettingsRow
          icon={Database}
          title={t("settings.data")}
          hint="Reseed loads demo content · Clear removes all local data."
        >
          <div className="flex flex-wrap gap-2">
            <Button leadingIcon={RefreshCw} onClick={reseed}>
              {t("settings.reseed")}
            </Button>
            <Button
              variant="danger"
              leadingIcon={Trash2}
              onClick={() => {
                if (confirm(t("settings.clear") + "?")) clearAll();
              }}
            >
              {t("settings.clear")}
            </Button>
          </div>
        </SettingsRow>
      </div>
    </>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="!p-0">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <Icon size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-fg">{title}</div>
            {hint && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{hint}</p>
            )}
          </div>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </Card>
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
    <div className="inline-flex gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
            value === o.value
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
