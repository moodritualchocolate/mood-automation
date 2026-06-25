"use client";

import { FileList } from "@/components/file-list";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";

export default function FilesPage() {
  const { t } = useI18n();
  const role = useStore((s) => s.role);
  return (
    <>
      <PageHeader
        eyebrow={t("nav.section.decide")}
        title={t("files.title")}
        subtitle={t("files.subtitle")}
      />
      <FileList editable={canEdit(role)} />
    </>
  );
}
