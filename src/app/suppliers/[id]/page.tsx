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
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowRight size={15} className="rtl:rotate-0 ltr:rotate-180" />
        {t("nav.suppliers")}
      </Link>

      {/* Header */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {supplier.company}
              </h1>
              <StatusBadge status={supplier.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {supplier.contact && (
                <span className="flex items-center gap-1.5">
                  <User size={13} /> {supplier.contact}
                </span>
              )}
              {supplier.country && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {supplier.country}
                </span>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 hover:text-fg" dir="ltr">
                  <Phone size={13} /> {supplier.phone}
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 hover:text-fg" dir="ltr">
                  <Mail size={13} /> {supplier.email}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-fg" dir="ltr">
                  <Globe size={13} /> {supplier.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            {supplier.notes && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {supplier.notes}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => setAiOpen(true)}>
              <Sparkles size={16} />
              {t("supplier.analyze")}
            </Button>
            {editable && (
              <>
                <Select
                  value={supplier.status}
                  onChange={(e) => setStatus(supplier.id, e.target.value as SupplierStatus)}
                  className="w-auto"
                >
                  {SUPPLIER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}` as const)}
                    </option>
                  ))}
                </Select>
                <Button onClick={() => setEditOpen(true)}>
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" onClick={() => setDelOpen(true)}>
                  <Trash2 size={15} className="text-danger" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-fg",
              )}
            >
              <Icon size={15} />
              {t(tb.key)}
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
        <Button variant="primary" className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus size={16} />
          {t("timeline.add")}
        </Button>
      )}
      {events.length === 0 ? (
        <EmptyState icon={<MessageSquarePlus size={26} />} title={t("timeline.empty")} />
      ) : (
        <ol className="relative space-y-4 border-s-2 border-border ps-5">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -start-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[11px] ring-2 ring-border">
                {EVENT_ICON[e.type]}
              </span>
              <Card className="group">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-brand">
                    {t(`event.${e.type}` as const)} · {formatDate(e.date, lang)}
                  </span>
                  {editable && (
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{e.text}</p>
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
          className="mb-4 w-full sm:w-auto"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          {t("material.add")}
        </Button>
      )}
      {materials.length === 0 ? (
        <EmptyState icon={<Package size={26} />} title={t("material.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {materials.map((m) => (
            <Card key={m.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="chip border-transparent bg-brand-soft text-brand">
                      {t(`material.${m.kind}` as const)}
                    </span>
                    {m.coa && (
                      <span className="chip border-transparent bg-success/12 text-success">
                        COA
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted">{summary(m)}</p>
                </div>
                <ScoreBadge score={m.score} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                {m.productCode && <span dir="ltr">#{m.productCode}</span>}
                {m.moq && <span>MOQ {m.moq}</span>}
                {m.price && <span className="font-semibold text-fg">{m.price}</span>}
              </div>
              {m.tasteNotes && (
                <p className="mt-2 text-xs italic text-muted">“{m.tasteNotes}”</p>
              )}
              {editable && (
                <div className="mt-3 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => { setEditing(m); setOpen(true); }} className="text-faint hover:text-fg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteMaterial(m.id)} className="text-faint hover:text-danger">
                    <Trash2 size={14} />
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
        <Button variant="primary" className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus size={16} />
          {t("samples.add")}
        </Button>
      )}
      {samples.length === 0 ? (
        <EmptyState icon={<FlaskConical size={26} />} title={t("samples.empty")} />
      ) : (
        <div className="space-y-3">
          {samples.map((s) => (
            <Card key={s.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{s.material || t("common.material")}</div>
                  <div className="text-xs text-muted">{formatDate(s.date, lang)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.suitable != null &&
                    (s.suitable ? (
                      <span className="chip border-transparent bg-success/12 text-success">
                        <CheckCircle2 size={13} /> {t("samples.suitableShort")}
                      </span>
                    ) : (
                      <span className="chip border-transparent bg-danger/12 text-danger">
                        <XCircle size={13} /> {t("common.no")}
                      </span>
                    ))}
                  <ScoreBadge score={s.finalScore} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Metric label={t("samples.taste")} value={s.taste} />
                <Metric label={t("samples.texture")} value={s.texture} />
                <Metric label={t("samples.melt")} value={s.melt} />
              </div>
              {s.impression && <p className="mt-3 text-sm text-muted">{s.impression}</p>}
              {s.aftertaste && (
                <p className="mt-1 text-xs text-muted">{t("samples.aftertaste")}: {s.aftertaste}</p>
              )}
              {editable && (
                <div className="mt-2 flex justify-end opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => deleteSample(s.id)} className="text-faint hover:text-danger">
                    <Trash2 size={14} />
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
    <div className="rounded-lg bg-surface-2 py-2">
      <div className="text-base font-semibold tabular-nums">{value ?? "—"}</div>
      <div className="text-[10px] text-muted">{label}</div>
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
        <Button variant="primary" className="mb-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus size={16} />
          {t("quotes.add")}
        </Button>
      )}
      {quotes.length === 0 ? (
        <EmptyState icon={<Receipt size={26} />} title={t("quotes.empty")} />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{q.material || t("common.material")}</div>
                {q.pricePerKg != null && (
                  <div className="text-lg font-bold text-brand">
                    {q.pricePerKg.toFixed(2)}€<span className="text-xs font-normal text-muted">/kg</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {q.moq && <span>MOQ {q.moq}</span>}
                {q.leadTime && <span>{t("quotes.leadTime")}: {q.leadTime}</span>}
                {q.paymentTerms && <span>{q.paymentTerms}</span>}
                <span className="ms-auto text-faint">{formatDate(q.date, lang)}</span>
              </div>
              {q.notes && <p className="mt-2 text-sm text-muted">{q.notes}</p>}
              {editable && (
                <div className="mt-2 flex justify-end opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => deleteQuote(q.id)} className="text-faint hover:text-danger">
                    <Trash2 size={14} />
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
        <form
          className="mb-4 flex gap-2"
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
          <Button variant="primary" type="submit">
            <Plus size={16} />
          </Button>
        </form>
      )}
      {tasks.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={26} />} title={t("tasks.empty")} />
      ) : (
        <ul className="space-y-2">
          {tasks.map((tk) => (
            <li key={tk.id} className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
              <input
                type="checkbox"
                checked={tk.done}
                disabled={!editable}
                onChange={() => toggleTask(tk.id)}
                className="h-4 w-4 accent-[rgb(var(--brand))]"
              />
              <span className={cn("flex-1 text-sm", tk.done && "text-faint line-through")}>
                {tk.title}
              </span>
              {editable && (
                <button onClick={() => deleteTask(tk.id)} className="text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

