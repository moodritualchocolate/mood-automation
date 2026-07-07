// MOOD · Day One — ENGINE CONTRACT (types only).
// The engine (day-one.tsx, storage, routing) depends ONLY on these types and on
// the Moment registry. Adding a new Moment must never require editing the engine —
// only a new content module + a registry entry + (optionally) new assets.

export type Axis = "belonging" | "initiation" | "energy" | "risk";

// Keys into the visual asset registry (scenes.tsx). Adding a new asset = adding a
// new key here + its renderer in the registry. This is the allowed "assets" step.
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

export type ChoiceOption = {
  id: string;
  scene: SceneKey;
  signals: Partial<Record<Axis, number>>;
};

export type DiscoveryStep = {
  axis: Axis;
  left: ChoiceOption;
  right: ChoiceOption;
};

export type HumanMap = Record<Axis, { value: number; confidence: number }>;

export type Recognition = {
  key: string;
  lines: string[]; // revealed one at a time
};

export type Level = "easy" | "medium" | "brave";

export type ChallengeItem = {
  level: Level;
  label: string; // tiny tier label (Hebrew)
  text: string; // the invitation (Hebrew)
  sub: string; // soft subtitle (Hebrew)
};

// A Moment is a fully self-contained unit of content. The engine renders ANY object
// matching this shape without knowing which Moment it is.
export type Moment = {
  id: string; // e.g. "moment_001"
  theme: string; // internal note, not user-facing
  title: string; // tiny Hebrew title shown over the hero art
  heroScene: SceneKey; // hero artwork (recognition + library thumbnail)
  challengeScene: SceneKey; // backdrop for the challenge screen
  challengeHeader: string; // the "no right/wrong, only trying" line (Hebrew)
  challenges: ChallengeItem[]; // the Easy/Medium/Brave ladder for this theme
  // Per-Moment reflection: maps the soft Human Map to a recognition. Content, not engine.
  recognize: (map: HumanMap) => Recognition;
};
