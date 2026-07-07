// MOOD · Moment_002 — "the word you didn't say" (connection courage).
// Added AFTER the refactor to prove the claim: this file + a registry entry +
// one new asset ("message") were the ONLY things needed. The engine (day-one.tsx,
// storage, routing, UI logic) was not touched to add this Moment.

import type { HumanMap, Moment, Recognition } from "../types";

function recognize(map: HumanMap): Recognition {
  const { belonging, energy, initiation } = map;

  if (initiation.value < -0.2) {
    return {
      key: "holds-back",
      lines: [
        "יש דברים חמים שאתה חושב על אנשים",
        "ולא תמיד אומר אותם בקול.",
        "הם שווים יותר כשהם יוצאים החוצה.",
      ],
    };
  }
  if (belonging.value > 0.2 && energy.value < 0) {
    return {
      key: "close-few",
      lines: [
        "יש לך מעט אנשים — אבל עמוקים.",
        "דווקא להם קל לשכוח להגיד",
        "כמה הם חשובים לך.",
      ],
    };
  }
  return {
    key: "warm-open",
    lines: [
      "אתה יודע לחמם אנשים.",
      "היום ננסה משהו קטן:",
      "להגיד את זה, לא רק להרגיש.",
    ],
  };
}

export const moment_002: Moment = {
  id: "moment_002",
  theme: "connection-courage",
  title: "המילה שלא אמרת", // "the word you didn't say"
  heroScene: "message",
  challengeScene: "room",
  challengeHeader: "אין נכון ואין לא-נכון. יש רק לומר.",
  challenges: [
    { level: "easy", label: "רך", text: "שלח למישהו הודעה קצרה: “חשבתי עליך.”", sub: "שתי מילים שעושות הבדל." },
    { level: "medium", label: "אמצע", text: "תגיד למישהו בדיוק למה הוא חשוב לך.", sub: "משפט אחד אמיתי." },
    { level: "brave", label: "אמיץ", text: "התקשר למישהו שהתרחקת ממנו, ותגיד שהתגעגעת.", sub: "לא משנה מה יענו. מה שחשוב זה שהושטת יד." },
  ],
  recognize,
};
