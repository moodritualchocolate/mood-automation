"use client";

import type { DataState } from "@/lib/types";
import { createClient } from "./client";

// ──────────────────────────────────────────────────────────────
// Cloud sync layer (Supabase). Stores every entity as a JSON row in the
// `records` table and uses Realtime so all phones/devices stay in sync.
// All functions no-op gracefully when Supabase isn't configured.
// ──────────────────────────────────────────────────────────────

type Kind = "supplier" | "event" | "material" | "sample" | "quote" | "task" | "file";

const KIND_TO_KEY: Record<Kind, keyof DataState> = {
  supplier: "suppliers",
  event: "events",
  material: "materials",
  sample: "samples",
  quote: "quotes",
  task: "tasks",
  file: "files",
};

// Singleton browser client.
let _client: ReturnType<typeof createClient> = null;
let _resolved = false;
function client() {
  if (!_resolved) {
    _client = createClient();
    _resolved = true;
  }
  return _client;
}

export function isCloud(): boolean {
  return client() != null;
}

interface AnyEntity {
  id: string;
  supplierId?: string;
}

function row(kind: Kind, entity: AnyEntity) {
  return {
    id: entity.id,
    kind,
    supplier_id: entity.supplierId ?? (kind === "supplier" ? entity.id : null),
    data: entity,
  };
}

/** Load the full dataset from Supabase. Returns null when not configured / on error. */
export async function loadAll(): Promise<DataState | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("records").select("kind,data");
  if (error || !data) return null;
  const state: DataState = {
    suppliers: [],
    events: [],
    materials: [],
    samples: [],
    quotes: [],
    tasks: [],
    files: [],
  };
  for (const r of data as { kind: Kind; data: unknown }[]) {
    const key = KIND_TO_KEY[r.kind];
    if (key) (state[key] as unknown[]).push(r.data);
  }
  return state;
}

export async function upsert(kind: Kind, entity: AnyEntity) {
  const c = client();
  if (!c) return;
  await c.from("records").upsert(row(kind, entity));
}

export async function remove(id: string) {
  const c = client();
  if (!c) return;
  await c.from("records").delete().eq("id", id);
}

/** Delete a supplier and every record that belongs to it. */
export async function removeSupplierCascade(supplierId: string) {
  const c = client();
  if (!c) return;
  await c.from("records").delete().eq("supplier_id", supplierId);
  await c.from("records").delete().eq("id", supplierId);
}

/** Replace the entire dataset (used by reset-to-demo). */
export async function replaceAll(state: DataState) {
  const c = client();
  if (!c) return;
  await clearAll();
  const rows: ReturnType<typeof row>[] = [];
  (Object.keys(KIND_TO_KEY) as Kind[]).forEach((kind) => {
    const arr = state[KIND_TO_KEY[kind]] as AnyEntity[];
    arr.forEach((e) => rows.push(row(kind, e)));
  });
  if (rows.length) await c.from("records").upsert(rows);
}

export async function clearAll() {
  const c = client();
  if (!c) return;
  // delete everything (filter that matches all real ids)
  await c.from("records").delete().neq("id", "");
}

/** Subscribe to realtime changes. Calls `onChange` on any insert/update/delete. */
export function subscribe(onChange: () => void): () => void {
  const c = client();
  if (!c) return () => {};
  const channel = c
    .channel("records-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "records" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
