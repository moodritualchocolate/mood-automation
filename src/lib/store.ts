"use client";

import { create } from "zustand";
import { seedData } from "./seed";
import * as cloud from "./supabase/sync";
import { nowISO, uid } from "./utils";
import type {
  DataState,
  FileAsset,
  Quote,
  RawMaterial,
  Role,
  Sample,
  Supplier,
  SupplierStatus,
  Task,
  TimelineEvent,
} from "./types";

const DATA_KEY = "mood.data.v1";
const ROLE_KEY = "mood.role";
const CHANNEL = "mood-realtime";

// ──────────────────────────────────────────────────────────────
// Data layer with two interchangeable modes:
//
//  • CLOUD  (Supabase configured) — the source of truth is Postgres. Writes
//    are optimistic locally and pushed to Supabase; Realtime keeps every
//    phone/device in sync live. This is what enables multi-device saving.
//
//  • LOCAL  (no backend) — data lives in localStorage and is mirrored across
//    tabs/windows on the same machine via BroadcastChannel.
//
// The UI is identical in both; only persistence differs.
// ──────────────────────────────────────────────────────────────

let channel: BroadcastChannel | null = null;
let applyingRemote = false;
let cloudUnsub: (() => void) | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function emptyData(): DataState {
  return {
    suppliers: [],
    events: [],
    materials: [],
    samples: [],
    quotes: [],
    tasks: [],
    files: [],
  };
}

function loadLocal(): DataState {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) {
      const seeded = seedData();
      window.localStorage.setItem(DATA_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return { ...emptyData(), ...(JSON.parse(raw) as DataState) };
  } catch {
    return seedData();
  }
}

function loadRole(): Role {
  if (typeof window === "undefined") return "admin";
  return (window.localStorage.getItem(ROLE_KEY) as Role) || "admin";
}

interface StoreState extends DataState {
  hydrated: boolean;
  cloud: boolean;
  role: Role;
  saving: boolean;
  lastSavedAt: string | null;

  hydrate: () => void;
  setRole: (r: Role) => void;
  reseed: () => void;
  clearAll: () => void;

  addSupplier: (s: Partial<Supplier> & { company: string }) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  setStatus: (id: string, status: SupplierStatus) => void;
  deleteSupplier: (id: string) => void;

  addEvent: (e: Omit<TimelineEvent, "id" | "createdAt">) => TimelineEvent;
  deleteEvent: (id: string) => void;

  addMaterial: (m: Omit<RawMaterial, "id" | "createdAt" | "updatedAt">) => RawMaterial;
  updateMaterial: (id: string, patch: Partial<RawMaterial>) => void;
  deleteMaterial: (id: string) => void;

  addSample: (s: Omit<Sample, "id" | "createdAt">) => Sample;
  updateSample: (id: string, patch: Partial<Sample>) => void;
  deleteSample: (id: string) => void;

  addQuote: (q: Omit<Quote, "id" | "createdAt">) => Quote;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  addTask: (t: Omit<Task, "id" | "createdAt" | "done"> & { done?: boolean }) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addFile: (f: Omit<FileAsset, "id" | "createdAt">) => FileAsset;
  deleteFile: (id: string) => void;
}

function snapshot(s: StoreState): DataState {
  return {
    suppliers: s.suppliers,
    events: s.events,
    materials: s.materials,
    samples: s.samples,
    quotes: s.quotes,
    tasks: s.tasks,
    files: s.files,
  };
}

export const useStore = create<StoreState>((set, get) => {
  // Transient "Saving… / Saved" indicator.
  const touchSaving = () => {
    if (typeof window === "undefined") return;
    set({ saving: true });
    window.clearTimeout((touchSaving as any)._t);
    (touchSaving as any)._t = window.setTimeout(
      () => set({ saving: false, lastSavedAt: nowISO() }),
      450,
    );
  };

  const persistLocal = () => {
    if (typeof window === "undefined") return;
    const data = snapshot(get());
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
      if (channel && !applyingRemote) channel.postMessage(data);
    } catch {
      /* ignore quota errors */
    }
  };

  // Apply a local state patch and persist (cloud writes are issued per-action).
  const commit = (patch: Partial<StoreState>) => {
    set(patch);
    if (!get().cloud) persistLocal();
    touchSaving();
  };

  // Fire-and-forget cloud write (no-op in local mode).
  const c = <T,>(p: Promise<T> | void) => {
    if (p && typeof (p as Promise<T>).catch === "function") {
      (p as Promise<T>).catch(() => {});
    }
  };

  return {
    ...emptyData(),
    hydrated: false,
    cloud: false,
    role: "admin",
    saving: false,
    lastSavedAt: null,

    hydrate: () => {
      if (get().hydrated) return;
      const isCloud = cloud.isCloud();
      set({ role: loadRole(), cloud: isCloud });

      if (isCloud) {
        // Cloud mode — load from Supabase, then subscribe to realtime.
        cloud
          .loadAll()
          .then((data) => set({ ...(data ?? emptyData()), hydrated: true }))
          .catch(() => set({ hydrated: true }));

        cloudUnsub?.();
        cloudUnsub = cloud.subscribe(() => {
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => {
            cloud.loadAll().then((data) => data && set({ ...data }));
          }, 150);
        });
        return;
      }

      // Local mode — localStorage + cross-tab BroadcastChannel.
      const data = loadLocal();
      set({ ...data, hydrated: true });
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = (ev: MessageEvent<DataState>) => {
          applyingRemote = true;
          set({ ...ev.data });
          applyingRemote = false;
        };
        window.addEventListener("storage", (e) => {
          if (e.key === DATA_KEY && e.newValue) {
            try {
              applyingRemote = true;
              set({ ...(JSON.parse(e.newValue) as DataState) });
              applyingRemote = false;
            } catch {
              /* ignore */
            }
          }
        });
      }
    },

    setRole: (r) => {
      set({ role: r });
      try {
        window.localStorage.setItem(ROLE_KEY, r);
      } catch {
        /* ignore */
      }
    },

    reseed: () => {
      const data = seedData();
      commit({ ...data });
      if (get().cloud) c(cloud.replaceAll(data));
    },
    clearAll: () => {
      commit({ ...emptyData() });
      if (get().cloud) c(cloud.clearAll());
    },

    addSupplier: (s) => {
      const sup: Supplier = {
        id: uid("sup"),
        company: s.company,
        category: s.category ?? "chocolate",
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        website: s.website,
        country: s.country,
        notes: s.notes,
        status: s.status ?? "new",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      commit({ suppliers: [sup, ...get().suppliers] });
      c(cloud.upsert("supplier", sup));
      return sup;
    },
    updateSupplier: (id, patch) => {
      const existing = get().suppliers.find((s) => s.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch, updatedAt: nowISO() };
      commit({ suppliers: get().suppliers.map((s) => (s.id === id ? updated : s)) });
      c(cloud.upsert("supplier", updated));
    },
    setStatus: (id, status) => get().updateSupplier(id, { status }),
    deleteSupplier: (id) => {
      commit({
        suppliers: get().suppliers.filter((s) => s.id !== id),
        events: get().events.filter((e) => e.supplierId !== id),
        materials: get().materials.filter((m) => m.supplierId !== id),
        samples: get().samples.filter((s) => s.supplierId !== id),
        quotes: get().quotes.filter((q) => q.supplierId !== id),
        tasks: get().tasks.filter((t) => t.supplierId !== id),
        files: get().files.filter((f) => f.supplierId !== id),
      });
      c(cloud.removeSupplierCascade(id));
    },

    addEvent: (e) => {
      const ev: TimelineEvent = { ...e, id: uid("ev"), createdAt: nowISO() };
      commit({ events: [ev, ...get().events] });
      c(cloud.upsert("event", ev));
      return ev;
    },
    deleteEvent: (id) => {
      commit({ events: get().events.filter((e) => e.id !== id) });
      c(cloud.remove(id));
    },

    addMaterial: (m) => {
      const mat: RawMaterial = {
        ...m,
        id: uid("mat"),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      commit({ materials: [mat, ...get().materials] });
      c(cloud.upsert("material", mat));
      return mat;
    },
    updateMaterial: (id, patch) => {
      const existing = get().materials.find((m) => m.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch, updatedAt: nowISO() };
      commit({ materials: get().materials.map((m) => (m.id === id ? updated : m)) });
      c(cloud.upsert("material", updated));
    },
    deleteMaterial: (id) => {
      commit({ materials: get().materials.filter((m) => m.id !== id) });
      c(cloud.remove(id));
    },

    addSample: (s) => {
      const smp: Sample = { ...s, id: uid("smp"), createdAt: nowISO() };
      commit({ samples: [smp, ...get().samples] });
      c(cloud.upsert("sample", smp));
      return smp;
    },
    updateSample: (id, patch) => {
      const existing = get().samples.find((s) => s.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };
      commit({ samples: get().samples.map((s) => (s.id === id ? updated : s)) });
      c(cloud.upsert("sample", updated));
    },
    deleteSample: (id) => {
      commit({ samples: get().samples.filter((s) => s.id !== id) });
      c(cloud.remove(id));
    },

    addQuote: (q) => {
      const quote: Quote = { ...q, id: uid("q"), createdAt: nowISO() };
      commit({ quotes: [quote, ...get().quotes] });
      c(cloud.upsert("quote", quote));
      return quote;
    },
    updateQuote: (id, patch) => {
      const existing = get().quotes.find((q) => q.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };
      commit({ quotes: get().quotes.map((q) => (q.id === id ? updated : q)) });
      c(cloud.upsert("quote", updated));
    },
    deleteQuote: (id) => {
      commit({ quotes: get().quotes.filter((q) => q.id !== id) });
      c(cloud.remove(id));
    },

    addTask: (t) => {
      const task: Task = {
        ...t,
        done: t.done ?? false,
        id: uid("tk"),
        createdAt: nowISO(),
      };
      commit({ tasks: [task, ...get().tasks] });
      c(cloud.upsert("task", task));
      return task;
    },
    toggleTask: (id) => {
      const existing = get().tasks.find((t) => t.id === id);
      if (!existing) return;
      const updated = { ...existing, done: !existing.done };
      commit({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
      c(cloud.upsert("task", updated));
    },
    deleteTask: (id) => {
      commit({ tasks: get().tasks.filter((t) => t.id !== id) });
      c(cloud.remove(id));
    },

    addFile: (f) => {
      const file: FileAsset = { ...f, id: uid("f"), createdAt: nowISO() };
      commit({ files: [file, ...get().files] });
      c(cloud.upsert("file", file));
      return file;
    },
    deleteFile: (id) => {
      commit({ files: get().files.filter((f) => f.id !== id) });
      c(cloud.remove(id));
    },
  };
});

export function canEdit(role: Role): boolean {
  return role === "admin" || role === "manager";
}
