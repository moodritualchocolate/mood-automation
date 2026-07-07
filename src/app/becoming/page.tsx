import type { Metadata } from "next";
import Becoming from "@/components/becoming/becoming";
import { loadBundle } from "@/lib/becoming/load";

export const metadata: Metadata = { title: "MOOD · Becoming", description: "מי שאתה נעשה." };

// The real multi-day Becoming wedge, wired to the frozen content library.
// Server loads the content (single source of truth); the client runs the loop.
export default function BecomingPage() {
  const bundle = loadBundle();
  return <Becoming bundle={bundle} />;
}
