"use client";

import { EmptyState } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import type { FileCategory } from "@/lib/types";
import { cn, formatDate, humanFileSize } from "@/lib/utils";
import { FileText, Plus, Trash2 } from "lucide-react";
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

// Shared file list + uploader (used in the supplier Files tab and the global Files page).
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
          <Plus size={16} />
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
        <EmptyState icon={<FileText size={26} />} title={t("files.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-muted">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={f.dataUrl}
                  download={f.dataUrl ? f.name : undefined}
                  target={f.dataUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  className={cn(
                    "block truncate text-sm font-medium",
                    f.dataUrl && "hover:text-brand",
                  )}
                >
                  {f.name}
                </a>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="chip border-transparent bg-surface-2 px-1.5 py-0 text-[10px]">
                    {t(`files.cat.${f.category}` as const)}
                  </span>
                  <span>{humanFileSize(f.size)}</span>
                  <span className="text-faint">{formatDate(f.createdAt, lang)}</span>
                </div>
              </div>
              {editable && (
                <button
                  onClick={() => deleteFile(f.id)}
                  className="text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
