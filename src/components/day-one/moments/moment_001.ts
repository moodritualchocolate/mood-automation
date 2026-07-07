// MOOD · Moment_001 — "a small moment of courage" (social courage).
// Pure content. No UI, state, storage, or routing here.

import type { HumanMap, Moment, Recognition } from "../types";

// Recognition = the line that reflects the person's own choices back to them.
// Never a verdict ("you are X"). Always: reflect, then name a strength inside it.
function recognize(map: HumanMap): Recognition {
  const { initiation, energy, belonging, risk } = map;

  if (initiation.value < -0.2 && energy.value < 0) {
    return {
      key: "attentive",
      lines: [
        "נראה שאתה שם לב לאנשים",
        "עוד לפני שאתה ניגש אליהם.",
        "זו לא ביישנות — זו תשומת לב.",
      ],
    };
  }
  if (initiation.value > 0.2 && risk.value > 0.1) {
    return {
      key: "opener",
      lines: [
        "אתה נוטה לעשות את הצעד הראשון.",
        "חום בין אנשים צריך מישהו שיתחיל —",
        "ולרוב זה אתה.",
      ],
    };
  }
  if (belonging.value > 0.2 && energy.value < 0) {
    return {
      key: "deep",
      lines: [
        "אתה לא מחפש הרבה אנשים.",
        "אתה מחפש אדם אחד, באמת.",
        "זו לא הסתגרות — זו עומק.",
      ],
    };
  }
  if (energy.value > 0.2 && belonging.value >= 0) {
    return {
      key: "warm",
      lines: [
        "יש בך משהו שנפתח ליד אנשים.",
        "חדר מלא לא מלחיץ אותך —",
        "הוא קצת מדליק אותך.",
      ],
    };
  }
  return {
    key: "curious",
    lines: [
      "יש בך סקרנות שקטה כלפי אנשים.",
      "לא תמיד אתה ניגש —",
      "אבל אתה כמעט תמיד שם לב.",
    ],
  };
}

export const moment_001: Moment = {
  id: "moment_001",
  theme: "social-courage",
  title: "רגע קטן של אומץ", // "a small moment of courage"
  heroScene: "twoPeople",
  challengeScene: "reach",
  challengeHeader: "אין נכון ואין לא-נכון. יש רק לנסות.",
  challenges: [
    { level: "easy", label: "רך", text: "תגיד שלום לאדם אחד שאתה לא מכיר.", sub: "מילה אחת מספיקה." },
    { level: "medium", label: "אמצע", text: "פתח שיחה קצרה עם מישהו היום.", sub: "שאלה קטנה, חיוך, וזהו." },
    { level: "brave", label: "אמיץ", text: "ניגש למישהו שסקרן אותך, והתחל שיחה אמיתית.", sub: "לא משנה איך זה ייגמר. מה שחשוב זה שניגשת." },
  ],
  recognize,
};
