"use client";

import { Chip, EmptyState } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import type { FileCategory } from "@/lib/types";
import { cn, formatDate, humanFileSize } from "@/lib/utils";
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Mail,
  Paperclip,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

function categorize(name: string, type: string): FileCategory {
  const n = name.toLowerCase();
  if (n.includes("coa")) return "coa";
  if (n.includes("tds") || n.includes("technical")) return "tds";
  if (n.includes("quote") || n.includes("price")) return "quote";
  if (type.startsWith("image/")) return "photo";
  if (n.endsWith(".eml") || n.includes("mail")) return "email";
  if (n.includes("cert")) return "certificate";
  return "other";
}

const CAT_ICON: Record<FileCategory, LucideIcon> = {
  coa: ShieldCheck,
  tds: FileSpreadsheet,
  quote: Receipt,
  photo: FileImage,
  email: Mail,
  certificate: ShieldCheck,
  other: Paperclip,
};

const CAT_TONE: Record<FileCategory, "brand" | "success" | "info" | "warning" | "accent" | "neutral"> = {
  coa: "success",
  tds: "info",
  quote: "warning",
  photo: "accent",
  email: "info",
  certificate: "success",
  other: "neutral",
};

export function FileList({
  supplierId,
  editable,
}: {
  supplierId?: string;
  editable: boolean;
}) {
  const { t, lang } = useI18n();
  const allFiles = useStore((s) => s.files);
  const files = useMemo(
    () => allFiles.filter((f) => (supplierId ? f.supplierId === supplierId : true)),
    [allFiles, supplierId],
  );
  const addFile = useStore((s) => s.addFile);
  const deleteFile = useStore((s) => s.deleteFile);

  const onPick = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addFile({
          supplierId,
          name: file.name,
          category: categorize(file.name, file.type),
          mime: file.type,
          size: file.size,
          dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      {editable && (
        <label className="btn-primary mb-4 inline-flex w-full cursor-pointer sm:w-auto">
          <Plus size={14} strokeWidth={2.4} />
          {t("files.add")}
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
      )}
      {files.length === 0 ? (
        <EmptyState icon={FileText} title={t("files.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => {
            const Icon = CAT_ICON[f.category] ?? Paperclip;
            return (
              <div
                key={f.id}
                className="card-interactive group flex items-center gap-3 !p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Icon size={17} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={f.dataUrl}
                    download={f.dataUrl ? f.name : undefined}
                    target={f.dataUrl ? "_blank" : undefined}
                    rel="noreferrer"
                    className={cn(
                      "block truncate text-[13.5px] font-semibold text-fg",
                      f.dataUrl && "hover:text-brand",
                    )}
                    dir="ltr"
                  >
                    {f.name}
                  </a>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <Chip tone={CAT_TONE[f.category]} size="sm">
                      {t(`files.cat.${f.category}` as const)}
                    </Chip>
                    <span className="mono text-faint">{humanFileSize(f.size)}</span>
                    <span className="mono text-faint">·</span>
                    <span className="mono text-faint">{formatDate(f.createdAt, lang)}</span>
                  </div>
                </div>
                {editable && (
                  <button
                    onClick={() => deleteFile(f.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                    aria-label={t("action.delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
