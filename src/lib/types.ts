// Domain model for the MOOD Procurement Hub.

export type SupplierStatus =
  | "new"
  | "contacted"
  | "awaiting_response"
  | "sample_requested"
  | "sample_received"
  | "quote_received"
  | "negotiation"
  | "approved"
  | "rejected";

export const SUPPLIER_STATUSES: SupplierStatus[] = [
  "new",
  "contacted",
  "awaiting_response",
  "sample_requested",
  "sample_received",
  "quote_received",
  "negotiation",
  "approved",
  "rejected",
];

export type SupplierCategory =
  | "chocolate"
  | "formulas"
  | "packaging"
  | "melanger"
  | "molds";

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  "chocolate",
  "formulas",
  "packaging",
  "melanger",
  "molds",
];

export const CATEGORY_LABELS: Record<SupplierCategory, string> = {
  chocolate: "שוקולד / חומרי גלם",
  formulas: "פורמולות",
  packaging: "מכונות אריזה",
  melanger: "מלנגר",
  molds: "מולדים",
};

// Supplier category — lets suppliers be grouped into separate lists.
export type SupplierCategory =
  | "chocolate"
  | "supplements"
  | "molds"
  | "melanger"
  | "packaging"
  | "other";

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  "chocolate",
  "supplements",
  "molds",
  "melanger",
  "packaging",
  "other",
];

export type MaterialKind =
  | "cocoa_mass"
  | "cocoa_butter"
  | "allulose"
  | "lecithin";

export const MATERIAL_KINDS: MaterialKind[] = [
  "cocoa_mass",
  "cocoa_butter",
  "allulose",
  "lecithin",
];

export type EventType =
  | "call"
  | "email"
  | "meeting"
  | "note"
  | "status"
  | "sample"
  | "quote";

export type FileCategory =
  | "coa"
  | "tds"
  | "quote"
  | "email"
  | "certificate"
  | "photo"
  | "other";

export type Role = "admin" | "manager" | "viewer";

export interface Supplier {
  id: string;
  company: string;
  category?: SupplierCategory;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
  notes?: string;
  status: SupplierStatus;
  category?: SupplierCategory;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  supplierId: string;
  type: EventType;
  text: string;
  date: string; // ISO; the day the event occurred
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  supplierId: string;
  kind: MaterialKind;
  country?: string;
  productCode?: string;
  moq?: string;
  price?: string;
  coa?: boolean;
  score?: number; // 0–10
  notes?: string;
  tasteNotes?: string;
  // cocoa mass
  variety?: string;
  origin?: "single" | "blend";
  // cocoa butter
  deodorized?: boolean;
  // allulose
  purity?: string;
  // lecithin
  source?: "sunflower" | "soy";
  createdAt: string;
  updatedAt: string;
}

export interface Sample {
  id: string;
  supplierId: string;
  materialId?: string;
  date: string;
  material?: string; // free-text material label if not linked
  impression?: string;
  taste?: number; // 0–10
  texture?: number;
  melt?: number;
  aftertaste?: string;
  finalScore?: number;
  suitable?: boolean;
  createdAt: string;
}

export interface Quote {
  id: string;
  supplierId: string;
  material?: string;
  pricePerKg?: number;
  moq?: string;
  leadTime?: string;
  paymentTerms?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  supplierId?: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface FileAsset {
  id: string;
  supplierId?: string;
  name: string;
  category: FileCategory;
  mime?: string;
  size?: number;
  dataUrl?: string; // base64 inline (local mode); object URL/path in cloud mode
  createdAt: string;
}

export interface DataState {
  suppliers: Supplier[];
  events: TimelineEvent[];
  materials: RawMaterial[];
  samples: Sample[];
  quotes: Quote[];
  tasks: Task[];
  files: FileAsset[];
}
