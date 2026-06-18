import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rnd}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Localized date — DD/MM/YYYY for Hebrew, locale-aware otherwise. */
export function formatDate(iso: string, lang: "he" | "en" = "he"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, lang: "he" | "en" = "he"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === "he" ? "he-IL" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string, lang: "he" | "en" = "he"): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  const hr = Math.round(diff / 3600000);
  const day = Math.round(diff / 86400000);
  const he = lang === "he";
  if (min < 1) return he ? "עכשיו" : "now";
  if (min < 60) return he ? `לפני ${min} ד׳` : `${min}m ago`;
  if (hr < 24) return he ? `לפני ${hr} ש׳` : `${hr}h ago`;
  if (day < 30) return he ? `לפני ${day} ימים` : `${day}d ago`;
  return formatDate(iso, lang);
}

export function humanFileSize(bytes?: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(10, n));
}
