// MOOD · Day One — content + human-map logic (Product/Psychology owns this file).
// All user-facing copy is Hebrew. No streaks, no scores, no diagnosis, no "cards".
// Success is always the attempt, never the outcome.

export type Axis = "belonging" | "initiation" | "energy" | "risk";

// A single discovery choice: two wordless scenes; tapping one nudges soft signals.
export type ChoiceOption = {
  id: string;
  scene: SceneKey;
  // soft signal deltas in [-1..1] applied to the Human Map
  signals: Partial<Record<Axis, number>>;
};

export type DiscoveryStep = {
  axis: Axis;
  left: ChoiceOption;
  right: ChoiceOption;
};

export type SceneKey =
  | "window"
  | "room"
  | "reach"
  | "wait"
  | "street"
  | "bench"
  | "door-half"
  | "door-wide"
  | "twoPeople"
  | "dusk"
  | "paper";

// The four choices. No labels are ever shown — the person just feels which is them.
export const DISCOVERY: DiscoveryStep[] = [
  {
    axis: "belonging",
    left: { id: "outside", scene: "window", signals: { belonging: -0.4 } },
    right: { id: "inside", scene: "room", signals: { belonging: 0.5 } },
  },
  {
    axis: "initiation",
    left: { id: "reach", scene: "reach", signals: { initiation: 0.6, risk: 0.2 } },
    right: { id: "wait", scene: "wait", signals: { initiation: -0.5 } },
  },
  {
    axis: "energy",
    left: { id: "crowd", scene: "street", signals: { energy: 0.6 } },
    right: { id: "quiet", scene: "bench", signals: { energy: -0.6 } },
  },
  {
    axis: "risk",
    left: { id: "half", scene: "door-half", signals: { risk: -0.4 } },
    right: { id: "wide", scene: "door-wide", signals: { risk: 0.6 } },
  },
];

export type HumanMap = Record<Axis, { value: number; confidence: number }>;

export function emptyMap(): HumanMap {
  return {
    belonging: { value: 0, confidence: 0.3 },
    initiation: { value: 0, confidence: 0.3 },
    energy: { value: 0, confidence: 0.3 },
    risk: { value: 0, confidence: 0.3 },
  };
}

// Fold the chosen options into soft floats. Confidence rises a little per signal.
export function buildMap(chosen: ChoiceOption[]): HumanMap {
  const map = emptyMap();
  for (const opt of chosen) {
    for (const [axis, delta] of Object.entries(opt.signals) as [Axis, number][]) {
      const t = map[axis];
      t.value = clamp(t.value + delta, -1, 1);
      t.confidence = clamp(t.confidence + 0.2, 0, 0.9);
    }
  }
  return map;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// The Moment title never changes for Day One (theme: small social courage).
export const MOMENT_TITLE = "רגע קטן של אומץ"; // "a small moment of courage"

// Recognition = the line that reflects the person's own choices back to them.
// Never a verdict ("you are X"). Always: reflect, then name a strength inside it.
export type Recognition = {
  key: string;
  lines: string[]; // revealed one at a time
};

export function pickRecognition(map: HumanMap): Recognition {
  const { initiation, energy, belonging, risk } = map;

  // The attentive one — waits, quiet, notices first.
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

  // The opener — reaches first, doors wide.
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

  // The deep one — belonging + quiet: depth over breadth.
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

  // The warm-crowd one — energy + belonging.
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

  // Gentle universal-but-specific fallback (still feels seen, never generic).
  return {
    key: "curious",
    lines: [
      "יש בך סקרנות שקטה כלפי אנשים.",
      "לא תמיד אתה ניגש —",
      "אבל אתה כמעט תמיד שם לב.",
    ],
  };
}

// One challenge ladder for the theme. Success = trying. Nothing is locked or scored.
export type Level = "easy" | "medium" | "brave";
export const CHALLENGES: { level: Level; label: string; text: string; sub: string }[] = [
  {
    level: "easy",
    label: "רך",
    text: "תגיד שלום לאדם אחד שאתה לא מכיר.",
    sub: "מילה אחת מספיקה.",
  },
  {
    level: "medium",
    label: "אמצע",
    text: "פתח שיחה קצרה עם מישהו היום.",
    sub: "שאלה קטנה, חיוך, וזהו.",
  },
  {
    level: "brave",
    label: "אמיץ",
    text: "ניגש למישהו שסקרן אותך, והתחל שיחה אמיתית.",
    sub: "לא משנה איך זה ייגמר. מה שחשוב זה שניגשת.",
  },
];

export const CHALLENGE_HEADER = "אין נכון ואין לא-נכון. יש רק לנסות.";

// Evening journal — soft feeling taps (never mandatory, never scored).
export const FEELINGS = [
  "פתוח יותר",
  "קצת גאה",
  "נבוך אבל שמח",
  "רגוע",
  "מופתע מעצמי",
  "עוד מעכל",
];
