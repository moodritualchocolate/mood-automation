"use client";

import { AiAnalysis } from "@/components/ai-analysis";
import { FileList } from "@/components/file-list";
import { LogConversation } from "@/components/log-conversation";
import { MaterialForm } from "@/components/material-form";
import { QuoteForm } from "@/components/quote-form";
import { SampleForm } from "@/components/sample-form";
import { StatusBadge } from "@/components/status";
import { SupplierForm } from "@/components/supplier-form";
import { Modal } from "@/components/ui/modal";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ScoreBadge,
  Select,
} from "@/components/ui/primitives";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import {
  SUPPLIER_STATUSES,
  type EventType,
  type RawMaterial,
  type SupplierStatus,
} from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FlaskConical,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Package,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Tab = "timeline" | "materials" | "samples" | "quotes" | "files" | "tasks";
const TABS: { id: Tab; key: DictKey; icon: typeof Package }[] = [
  { id: "timeline", key: "supplier.timeline", icon: MessageSquarePlus },
  { id: "materials", key: "supplier.materials", icon: Package },
  { id: "samples", key: "supplier.samples", icon: FlaskConical },
  { id: "quotes", key: "supplier.quotes", icon: Receipt },
  { id: "files", key: "supplier.files", icon: FileText },
  { id: "tasks", key: "supplier.tasks", icon: CheckCircle2 },
];

export default function SupplierDetailPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const role = useStore((s) => s.role);
  const editable = canEdit(role);

  const supplier = useStore((s) => s.suppliers.find((x) => x.id === params.id));
  const setStatus = useStore((s) => s.setStatus);
  const deleteSupplier = useStore((s) => s.deleteSupplier);

  const initialTab = (search.get("tab") as Tab) || "timeline";
  const [tab, setTab] = useState<Tab>(
    TABS.some((x) => x.id === initialTab) ? initialTab : "timeline",
  );
  const [editOpen, setEditOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  if (!supplier) {
    return (
      <EmptyState
        title={t("common.empty")}
        action={
          <Link href="/suppliers">
            <Button>{t("action.back")}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Link
        href="/suppliers"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition hover:text-fg"
      >
        <ArrowRight size={13} className="rtl:rotate-0 ltr:rotate-180" />
        {t("nav.suppliers")}
      </Link>

      {/* ─── Hero header ──────────────────────────────────────────── */}
      <div className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-surface bg-warm">
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-fg shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, rgb(var(--brand-2)) 0%, rgb(var(--brand)) 100%)",
                    boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.10)",
                  }}
                >
                  <span className="text-[16px] font-bold">
                    {supplier.company.slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                    {supplier.company}
                  </h1>
                  <div className="mt-1">
                    <StatusBadge status={supplier.status} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-fg-2">
                {supplier.contact && (
                  <span className="flex items-center gap-1.5">
                    <User size={12} className="text-faint" />
                    {supplier.contact}
                  </span>
                )}
                {supplier.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-faint" />
                    {supplier.country}
                  </span>
                )}
                {supplier.phone && (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="mono flex items-center gap-1.5 transition hover:text-fg"
                    dir="ltr"
                  >
                    <Phone size={12} className="text-faint" />
                    {supplier.phone}
                  </a>
                )}
                {supplier.email && (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="flex items-center gap-1.5 transition hover:text-fg"
                    dir="ltr"
                  >
                    <Mail size={12} className="text-faint" />
                    {supplier.email}
                  </a>
                )}
                {supplier.website && (
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 transition hover:text-fg"
                    dir="ltr"
                  >
                    <Globe size={12} className="text-faint" />
                    {supplier.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>

              {supplier.notes && (
                <p className="max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  {supplier.notes}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" leadingIcon={Sparkles} onClick={() => setAiOpen(true)}>
                {t("supplier.analyze")}
              </Button>
              {editable && (
                <>
                  <Select
                    value={supplier.status}
                    onChange={(e) => setStatus(supplier.id, e.target.value as SupplierStatus)}
                    className="w-auto min-w-[140px]"
                  >
                    {SUPPLIER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}` as const)}
                      </option>
                    ))}
                  </Select>
                  <Button leadingIcon={Pencil} onClick={() => setEditOpen(true)} aria-label={t("action.edit")}>
                    <span className="sr-only">{t("action.edit")}</span>
                  </Button>
                  <Button variant="ghost" onClick={() => setDelOpen(true)} aria-label={t("action.delete")}>
                    <Trash2 size={15} className="text-danger" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Soft top-right glow */}
        <div
          className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.40), transparent)" }}
          aria-hidden
        />
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <div className="mb-5 -mx-1 flex gap-0.5 overflow-x-auto border-b border-border px-1">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors",
                active ? "text-brand" : "text-muted hover:text-fg-2",
              )}
            >
              <Icon size={14} strokeWidth={active ? 2.4 : 2} />
              {t(tb.key)}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-brand" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {tab === "timeline" && <TimelineTab supplierId={supplier.id} editable={editable} />}
      {tab === "materials" && <MaterialsTab supplierId={supplier.id} editable={editable} />}
      {tab === "samples" && <SamplesTab supplierId={supplier.id} editable={editable} />}
      {tab === "quotes" && <QuotesTab supplierId={supplier.id} editable={editable} />}
      {tab === "files" && <FilesTab supplierId={supplier.id} editable={editable} />}
      {tab === "tasks" && <TasksTab supplierId={supplier.id} editable={editable} />}

      <SupplierForm open={editOpen} onClose={() => setEditOpen(false)} existing={supplier} />
      <AiAnalysis open={aiOpen} onClose={() => setAiOpen(false)} supplier={supplier} />
      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title={t("action.delete")}
        footer={
          <>
            <Button onClick={() => setDelOpen(false)}>{t("action.cancel")}</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteSupplier(supplier.id);
                router.push("/suppliers");
              }}
            >
              {t("action.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{supplier.company}</p>
      </Modal>
    </>
  );
}

const EVENT_ICON: Record<EventType, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  note: "📝",
  status: "🔄",
  sample: "🧪",
  quote: "💶",
};

function TimelineTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  const { t, lang } = useI18n();
  const allEvents = useStore((s) => s.events);
  const events = useMemo(
    () =>
      allEvents
        .filter((e) => e.supplierId === supplierId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allEvents, supplierId],
  );
  const deleteEvent = useStore((s) => s.deleteEvent);
  const [open, setOpen] = useState(false);

  return (
    <>
      {editable && (
        <Button variant="primary" leadingIcon={Plus} className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          {t("timeline.add")}
        </Button>
      )}
      {events.length === 0 ? (
        <EmptyState icon={MessageSquarePlus} title={t("timeline.empty")} />
      ) : (
        <ol className="relative space-y-3 ps-7">
          <span className="absolute inset-y-1 start-[10px] w-px bg-border-soft" aria-hidden />
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -start-7 top-3 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-bg bg-surface text-[11px] shadow-sm ring-1 ring-border">
                {EVENT_ICON[e.type]}
              </span>
              <Card className="group !p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Chip tone="brand" size="sm">
                      {t(`event.${e.type}` as const)}
                    </Chip>
                    <span className="mono text-[11px] text-faint">{formatDate(e.date, lang)}</span>
                  </div>
                  {editable && (
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                      aria-label={t("action.delete")}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg-2">{e.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      )}
      <LogConversation open={open} onClose={() => setOpen(false)} supplierId={supplierId} />
    </>
  );
}

function MaterialsTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  const { t } = useI18n();
  const allMaterials = useStore((s) => s.materials);
  const materials = useMemo(
    () => allMaterials.filter((m) => m.supplierId === supplierId),
    [allMaterials, supplierId],
  );
  const deleteMaterial = useStore((s) => s.deleteMaterial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | undefined>();

  const summary = (m: RawMaterial): string => {
    const parts: string[] = [];
    if (m.variety) parts.push(m.variety);
    if (m.origin) parts.push(t(`material.${m.origin}` as const));
    if (m.deodorized != null)
      parts.push(t(m.deodorized ? "material.deodorized" : "material.notDeodorized"));
    if (m.purity) parts.push(`${t("material.purity")} ${m.purity}`);
    if (m.source) parts.push(t(`material.${m.source}` as const));
    if (m.country) parts.push(m.country);
    return parts.filter(Boolean).join(" · ");
  };

  return (
    <>
      {editable && (
        <Button
          variant="primary"
          leadingIcon={Plus}
          className="mb-4 w-full sm:w-auto"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          {t("material.add")}
        </Button>
      )}
      {materials.length === 0 ? (
        <EmptyState icon={Package} title={t("material.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
          {materials.map((m) => (
            <Card key={m.id} interactive className="group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip tone="brand" size="sm">
                      {t(`material.${m.kind}` as const)}
                    </Chip>
                    {m.coa && (
                      <Chip tone="success" size="sm">COA</Chip>
                    )}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-fg-2">{summary(m)}</p>
                </div>
                <ScoreBadge score={m.score} size="lg" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                {m.productCode && <span className="mono text-muted" dir="ltr">#{m.productCode}</span>}
                {m.moq && <span className="mono text-fg-2">MOQ <b>{m.moq}</b></span>}
                {m.price && <span className="mono font-semibold text-fg">{m.price}</span>}
              </div>
              {m.tasteNotes && (
                <p className="mt-2 text-[12.5px] italic leading-relaxed text-muted">“{m.tasteNotes}”</p>
              )}
              {editable && (
                <div className="mt-3 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => { setEditing(m); setOpen(true); }} className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-surface-2 hover:text-fg">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteMaterial(m.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-danger-soft hover:text-danger">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <MaterialForm open={open} onClose={() => setOpen(false)} supplierId={supplierId} existing={editing} />
    </>
  );
}

function SamplesTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  const { t, lang } = useI18n();
  const allSamples = useStore((s) => s.samples);
  const samples = useMemo(
    () =>
      allSamples
        .filter((x) => x.supplierId === supplierId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allSamples, supplierId],
  );
  const deleteSample = useStore((s) => s.deleteSample);
  const [open, setOpen] = useState(false);

  return (
    <>
      {editable && (
        <Button variant="primary" leadingIcon={Plus} className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          {t("samples.add")}
        </Button>
      )}
      {samples.length === 0 ? (
        <EmptyState icon={FlaskConical} title={t("samples.empty")} />
      ) : (
        <div className="space-y-3">
          {samples.map((s) => (
            <Card key={s.id} interactive className="group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg">{s.material || t("common.material")}</div>
                  <div className="mono mt-0.5 text-[11.5px] text-faint">{formatDate(s.date, lang)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.suitable != null &&
                    (s.suitable ? (
                      <Chip tone="success" size="sm" icon={CheckCircle2}>
                        {t("samples.suitableShort")}
                      </Chip>
                    ) : (
                      <Chip tone="danger" size="sm" icon={XCircle}>
                        {t("common.no")}
                      </Chip>
                    ))}
                  <ScoreBadge score={s.finalScore} size="lg" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label={t("samples.taste")} value={s.taste} />
                <Metric label={t("samples.texture")} value={s.texture} />
                <Metric label={t("samples.melt")} value={s.melt} />
              </div>
              {s.impression && (
                <p className="mt-3 text-[13px] leading-relaxed text-fg-2">{s.impression}</p>
              )}
              {s.aftertaste && (
                <p className="mt-1 text-[12px] text-muted">
                  <span className="font-medium text-fg-2">{t("samples.aftertaste")}:</span> {s.aftertaste}
                </p>
              )}
              {editable && (
                <div className="mt-2 flex justify-end opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => deleteSample(s.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <SampleForm open={open} onClose={() => setOpen(false)} supplierId={supplierId} />
    </>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-2/50 py-2 text-center">
      <div className="mono tabular text-[15px] font-semibold text-fg">{value ?? "—"}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function QuotesTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  const { t, lang } = useI18n();
  const allQuotes = useStore((s) => s.quotes);
  const quotes = useMemo(
    () =>
      allQuotes
        .filter((q) => q.supplierId === supplierId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allQuotes, supplierId],
  );
  const deleteQuote = useStore((s) => s.deleteQuote);
  const [open, setOpen] = useState(false);

  return (
    <>
      {editable && (
        <Button variant="primary" leadingIcon={Plus} className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          {t("quotes.add")}
        </Button>
      )}
      {quotes.length === 0 ? (
        <EmptyState icon={Receipt} title={t("quotes.empty")} />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} interactive className="group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg">{q.material || t("common.material")}</div>
                  <div className="mono mt-0.5 text-[11.5px] text-faint">{formatDate(q.date, lang)}</div>
                </div>
                {q.pricePerKg != null && (
                  <div className="text-end">
                    <div className="mono text-[22px] font-bold leading-none tabular text-brand">
                      €{q.pricePerKg.toFixed(2)}
                    </div>
                    <div className="text-[10.5px] uppercase tracking-wider text-muted">/ kg</div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
                {q.moq && (
                  <span className="mono text-fg-2">
                    <span className="text-faint">MOQ</span> <b>{q.moq}</b>
                  </span>
                )}
                {q.leadTime && (
                  <span className="text-fg-2">
                    <span className="text-faint">{t("quotes.leadTime")}:</span> <b>{q.leadTime}</b>
                  </span>
                )}
                {q.paymentTerms && (
                  <span className="text-fg-2">{q.paymentTerms}</span>
                )}
              </div>
              {q.notes && (
                <p className="mt-3 text-[13px] leading-relaxed text-fg-2">{q.notes}</p>
              )}
              {editable && (
                <div className="mt-2 flex justify-end opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => deleteQuote(q.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <QuoteForm open={open} onClose={() => setOpen(false)} supplierId={supplierId} />
    </>
  );
}

function FilesTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  return <FileList supplierId={supplierId} editable={editable} />;
}

function TasksTab({ supplierId, editable }: { supplierId: string; editable: boolean }) {
  const { t } = useI18n();
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(
    () => allTasks.filter((x) => x.supplierId === supplierId),
    [allTasks, supplierId],
  );
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addTask = useStore((s) => s.addTask);
  const [title, setTitle] = useState("");

  return (
    <>
      {editable && (
        <Card className="mb-4 !p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              addTask({ supplierId, title: title.trim() });
              setTitle("");
            }}
          >
            <input
              className="input-base flex-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tasks.placeholder")}
            />
            <Button variant="primary" leadingIcon={Plus} type="submit">
              {t("action.add")}
            </Button>
          </form>
        </Card>
      )}
      {tasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t("tasks.empty")} />
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((tk) => (
            <li
              key={tk.id}
              className="group flex items-center gap-3 rounded-xl border border-border-soft bg-surface px-4 py-3 transition-all duration-150 hover:border-border-strong hover:shadow-sm"
            >
              <label className="flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={tk.done}
                  disabled={!editable}
                  onChange={() => toggleTask(tk.id)}
                  className="peer sr-only"
                />
                <span className={cn(
                  "flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition-all",
                  tk.done
                    ? "border-success bg-success text-white"
                    : "border-border-strong bg-surface hover:border-brand",
                )}>
                  {tk.done && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="m5 12 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </label>
              <span className={cn(
                "flex-1 text-[13.5px] font-medium",
                tk.done ? "text-faint line-through" : "text-fg",
              )}>
                {tk.title}
              </span>
              {editable && (
                <button
                  onClick={() => deleteTask(tk.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                  aria-label={t("action.delete")}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

