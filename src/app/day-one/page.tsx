import type { Metadata } from "next";
import DayOne from "@/components/day-one/day-one";

export const metadata: Metadata = {
  title: "MOOD · Day One",
  description: "פעם ביום. רגע אחד. שלך.",
};

// Day One is an immersive, local-first experience. It renders as a full-screen
// layer (fixed inset-0, z-90) over the app shell — the whole loop, simplified,
// from first breath to the Day Two hook.
export default function DayOnePage() {
  return <DayOne />;
}
