import type { Metadata } from "next";
import Raw from "@/components/day-one/raw";

export const metadata: Metadata = {
  title: "MOOD",
  description: "פעם ביום. רגע אחד. שלך.",
};

// The ugly test: Day One with the beauty removed, to observe whether the substance
// is wanted. Same Moment content + registry, deliberately unstyled skin.
export default function OnePage() {
  return <Raw />;
}
