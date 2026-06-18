"use client";

import { create } from "zustand";
import { seedData } from "./seed";
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
// Persistence + cross-device-on-same-machine realtime.
//
// In local mode the entire dataset lives in localStorage and is mirrored
// to every open tab/window via BroadcastChannel + the `storage` event,
// which gives the app its realtime, multi-user "feel" with zero backend.
// The Supabase data layer (see lib/supabase) is a drop-in replacement that
// swaps localStorage for Postgres + Realtime channels.
// ──────────────────────────────────────────────────────────────

let channel: BroadcastChannel | null = null;
let applyingRemote = false;

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

function loadData(): DataState {
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
  role: Role;
  saving: boolean;
  lastSavedAt: string | null;

  hydrate: () => void;
  setRole: (r: Role) => void;
  reseed: () => void;
  clearAll: () => void;

  // suppliers
  addSupplier: (s: Partial<Supplier> & { company: string }) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  setStatus: (id: string, status: SupplierStatus) => void;
  deleteSupplier: (id: string) => void;

  // timeline
  addEvent: (e: Omit<TimelineEvent, "id" | "createdAt">) => TimelineEvent;
  deleteEvent: (id: string) => void;

  // materials
  addMaterial: (m: Omit<RawMaterial, "id" | "createdAt" | "updatedAt">) => RawMaterial;
  updateMaterial: (id: string, patch: Partial<RawMaterial>) => void;
  deleteMaterial: (id: string) => void;

  // samples
  addSample: (s: Omit<Sample, "id" | "createdAt">) => Sample;
  updateSample: (id: string, patch: Partial<Sample>) => void;
  deleteSample: (id: string) => void;

  // quotes
  addQuote: (q: Omit<Quote, "id" | "createdAt">) => Quote;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  // tasks
  addTask: (t: Omit<Task, "id" | "createdAt" | "done"> & { done?: boolean }) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // files
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
  // Persist current data to localStorage + broadcast to other tabs.
  const persist = () => {
    if (typeof window === "undefined") return;
    const data = snapshot(get());
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
      if (channel && !applyingRemote) channel.postMessage(data);
    } catch {
      /* ignore quota errors */
    }
    set({ saving: true });
    window.clearTimeout((persist as any)._t);
    (persist as any)._t = window.setTimeout(
      () => set({ saving: false, lastSavedAt: nowISO() }),
      450,
    );
  };

  // commit applies a state patch and then persists.
  const commit = (patch: Partial<StoreState>) => {
    set(patch);
    persist();
  };

  return {
    ...emptyData(),
    hydrated: false,
    role: "admin",
    saving: false,
    lastSavedAt: null,

    hydrate: () => {
      if (get().hydrated) return;
      const data = loadData();
      set({ ...data, role: loadRole(), hydrated: true });

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

    reseed: () => commit({ ...seedData() }),
    clearAll: () => commit({ ...emptyData() }),

    addSupplier: (s) => {
      const sup: Supplier = {
        id: uid("sup"),
        company: s.company,
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
      return sup;
    },
    updateSupplier: (id, patch) =>
      commit({
        suppliers: get().suppliers.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: nowISO() } : s,
        ),
      }),
    setStatus: (id, status) => get().updateSupplier(id, { status }),
    deleteSupplier: (id) =>
      commit({
        suppliers: get().suppliers.filter((s) => s.id !== id),
        events: get().events.filter((e) => e.supplierId !== id),
        materials: get().materials.filter((m) => m.supplierId !== id),
        samples: get().samples.filter((s) => s.supplierId !== id),
        quotes: get().quotes.filter((q) => q.supplierId !== id),
        tasks: get().tasks.filter((t) => t.supplierId !== id),
        files: get().files.filter((f) => f.supplierId !== id),
      }),

    addEvent: (e) => {
      const ev: TimelineEvent = { ...e, id: uid("ev"), createdAt: nowISO() };
      commit({ events: [ev, ...get().events] });
      return ev;
    },
    deleteEvent: (id) =>
      commit({ events: get().events.filter((e) => e.id !== id) }),

    addMaterial: (m) => {
      const mat: RawMaterial = {
        ...m,
        id: uid("mat"),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      commit({ materials: [mat, ...get().materials] });
      return mat;
    },
    updateMaterial: (id, patch) =>
      commit({
        materials: get().materials.map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: nowISO() } : m,
        ),
      }),
    deleteMaterial: (id) =>
      commit({ materials: get().materials.filter((m) => m.id !== id) }),

    addSample: (s) => {
      const smp: Sample = { ...s, id: uid("smp"), createdAt: nowISO() };
      commit({ samples: [smp, ...get().samples] });
      return smp;
    },
    updateSample: (id, patch) =>
      commit({
        samples: get().samples.map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      }),
    deleteSample: (id) =>
      commit({ samples: get().samples.filter((s) => s.id !== id) }),

    addQuote: (q) => {
      const quote: Quote = { ...q, id: uid("q"), createdAt: nowISO() };
      commit({ quotes: [quote, ...get().quotes] });
      return quote;
    },
    updateQuote: (id, patch) =>
      commit({
        quotes: get().quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      }),
    deleteQuote: (id) =>
      commit({ quotes: get().quotes.filter((q) => q.id !== id) }),

    addTask: (t) => {
      const task: Task = {
        ...t,
        done: t.done ?? false,
        id: uid("tk"),
        createdAt: nowISO(),
      };
      commit({ tasks: [task, ...get().tasks] });
      return task;
    },
    toggleTask: (id) =>
      commit({
        tasks: get().tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        ),
      }),
    deleteTask: (id) =>
      commit({ tasks: get().tasks.filter((t) => t.id !== id) }),

    addFile: (f) => {
      const file: FileAsset = { ...f, id: uid("f"), createdAt: nowISO() };
      commit({ files: [file, ...get().files] });
      return file;
    },
    deleteFile: (id) =>
      commit({ files: get().files.filter((f) => f.id !== id) }),
  };
});

export function canEdit(role: Role): boolean {
  return role === "admin" || role === "manager";
}
