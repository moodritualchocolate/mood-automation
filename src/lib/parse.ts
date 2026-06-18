import type { EventType, Supplier, SupplierStatus } from "./types";

export interface ParsedConversation {
  eventType: EventType;
  suggestedStatus?: SupplierStatus;
  suggestedTasks: string[];
  supplierId?: string;
  matchedSupplierName?: string;
}

// Lightweight bilingual (he/en) heuristic parser. It reads a free-text note
// pasted into "Add conversation" and infers the event type, a likely status
// transition, follow-up tasks, and which known supplier is referenced.
export function parseConversation(
  text: string,
  suppliers: Supplier[],
): ParsedConversation {
  const t = text.toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => t.includes(n));

  // ── Event type ──
  let eventType: EventType = "note";
  if (has("שוחחתי", "דיברתי", "טלפנתי", "spoke", "called", "call", "phone"))
    eventType = "call";
  else if (has("מייל", "אימייל", "email", "mail", "wrote")) eventType = "email";
  else if (has("פגישה", "נפגשנו", "meeting", "met ")) eventType = "meeting";
  else if (has("דוגמ", "sample")) eventType = "sample";
  else if (has("הצעת מחיר", "הצעה", "quote", "quotation")) eventType = "quote";

  // ── Status inference (most advanced match wins) ──
  let suggestedStatus: SupplierStatus | undefined;
  if (has("נפסל", "לא מתאים", "reject", "declin")) suggestedStatus = "rejected";
  else if (has("מאושר", "אישרנו", "approved", "approve"))
    suggestedStatus = "approved";
  else if (has("משא ומתן", "מו\"מ", "negotiat", "bargain"))
    suggestedStatus = "negotiation";
  else if (has("הצעת מחיר", "התקבלה הצעה", "quote received", "quoted"))
    suggestedStatus = "quote_received";
  else if (has("התקבלו דוגמ", "קיבלנו דוגמ", "samples received", "received sample"))
    suggestedStatus = "sample_received";
  else if (has("ישלח דוגמ", "נשלחה בקשת", "request sample", "send sample", "בקשת דוגמ"))
    suggestedStatus = "sample_requested";
  else if (has("ממתין", "מחכה", "awaiting", "waiting"))
    suggestedStatus = "awaiting_response";
  else if (eventType === "call" || eventType === "email" || eventType === "meeting")
    suggestedStatus = "contacted";

  // ── Follow-up tasks ──
  const suggestedTasks: string[] = [];
  const pushTask = (he: string) => {
    if (!suggestedTasks.includes(he)) suggestedTasks.push(he);
  };
  if (has("coa")) pushTask("לבקש COA");
  if (has("tds", "technical data", "דף טכני")) pushTask("לבקש Technical Data Sheet");
  if (has("דוגמ", "sample")) pushTask("לעקוב אחר דוגמה");
  if (has("הצעת מחיר", "מחיר", "quote", "price")) pushTask("לבקש/להשוות הצעת מחיר");
  if (has("מעקב", "follow up", "follow-up", "לחזור", "תזכורת"))
    pushTask("מעקב המשך");
  if (has("ביום שני", "monday")) pushTask("מעקב ביום שני");
  if (has("להתקשר", "call back", "תתקשר")) pushTask("להתקשר חזרה");

  // ── Supplier matching ──
  let supplierId: string | undefined;
  let matchedSupplierName: string | undefined;
  for (const s of suppliers) {
    const name = s.company.toLowerCase();
    if (name && t.includes(name)) {
      supplierId = s.id;
      matchedSupplierName = s.company;
      break;
    }
    // also try contact first name
    const contact = (s.contact ?? "").toLowerCase().split(/\s+/)[0];
    if (contact && contact.length > 1 && t.includes(contact)) {
      supplierId = s.id;
      matchedSupplierName = s.company;
    }
  }

  return {
    eventType,
    suggestedStatus,
    suggestedTasks,
    supplierId,
    matchedSupplierName,
  };
}
