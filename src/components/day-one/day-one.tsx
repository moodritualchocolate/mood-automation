"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scene } from "./scenes";
import {
  CHALLENGES,
  CHALLENGE_HEADER,
  DISCOVERY,
  FEELINGS,
  MOMENT_TITLE,
  buildMap,
  pickRecognition,
  type ChoiceOption,
  type Level,
  type Recognition,
} from "./content";

type Phase =
  | "intro"
  | "discovery"
  | "weaving"
  | "recognition"
  | "challenge"
  | "live"
  | "evening"
  | "library"
  | "dayTwo"
  | "returning";

const STORE_KEY = "mood_day_one_v1";

type Saved = {
  date: string; // YYYY-MM-DD (local)
  level: Level | null;
  tried: boolean | null;
  feelings: string[];
  note: string;
  recognitionKey: string;
  remind: boolean;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export default function DayOne() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<ChoiceOption[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [tried, setTried] = useState<boolean | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [remind, setRemind] = useState(true);
  const [saved, setSaved] = useState<Saved | null>(null);

  // Local-first: if this person already met today's moment, greet the return.
  useEffect(() => {
    const s = load();
    if (s && s.date === today()) {
      setSaved(s);
      setLevel(s.level);
      setTried(s.tried);
      setFeelings(s.feelings);
      setRemind(s.remind);
      setPhase("returning");
    }
    setReady(true);
  }, []);

  const map = useMemo(() => buildMap(chosen), [chosen]);
  const recognition: Recognition = useMemo(() => pickRecognition(map), [map]);

  const persist = useCallback(
    (extra: Partial<Saved>) => {
      const rec: Saved = {
        date: today(),
        level,
        tried,
        feelings,
        note,
        recognitionKey: recognition.key,
        remind,
        ...extra,
      };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(rec));
      } catch {
        /* local-first best effort */
      }
      setSaved(rec);
    },
    [level, tried, feelings, note, recognition.key, remind],
  );

  function choose(opt: ChoiceOption) {
    const next = [...chosen, opt];
    setChosen(next);
    if (step < DISCOVERY.length - 1) {
      setStep(step + 1);
    } else {
      setPhase("weaving");
    }
  }

  if (!ready) return <div className="d1-root d1-grain" />;

  return (
    <div className="d1-root d1-grain">
      {phase === "intro" && <Intro onBegin={() => setPhase("discovery")} />}
      {phase === "discovery" && (
        <Discovery step={step} onChoose={choose} />
      )}
      {phase === "weaving" && <Weaving onDone={() => setPhase("recognition")} />}
      {phase === "recognition" && (
        <RecognitionScreen recognition={recognition} onNext={() => setPhase("challenge")} />
      )}
      {phase === "challenge" && (
        <ChallengeScreen
          onPick={(l) => {
            setLevel(l);
            setPhase("live");
          }}
        />
      )}
      {phase === "live" && <Live onEvening={() => setPhase("evening")} />}
      {phase === "evening" && (
        <Evening
          tried={tried}
          setTried={setTried}
          feelings={feelings}
          setFeelings={setFeelings}
          note={note}
          setNote={setNote}
          onSave={() => {
            persist({ tried, feelings, note, level });
            setPhase("library");
          }}
        />
      )}
      {phase === "library" && (
        <Library level={level} tried={tried} feeling={feelings[0]} onNext={() => setPhase("dayTwo")} />
      )}
      {phase === "dayTwo" && (
        <DayTwo remind={remind} setRemind={(v) => { setRemind(v); persist({ remind: v }); }} />
      )}
      {phase === "returning" && (
        <Returning saved={saved} onReset={() => { localStorage.removeItem(STORE_KEY); location.reload(); }} />
      )}
    </div>
  );
}

/* ── shared layout bits ─────────────────────────────────────── */

function TextLayer({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      className="pb-safe"
      style={{
        position: "absolute",
        insetInline: 0,
        bottom: 0,
        zIndex: 10,
        padding: "0 28px 40px",
        textAlign: center ? "center" : "start",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display: "flex", gap: 7, justifyContent: "center", paddingTop: 20 }} className="pt-safe">
      {Array.from({ length: n }).map((_, k) => (
        <span
          key={k}
          style={{
            width: 6, height: 6, borderRadius: 99,
            background: k <= i ? "rgba(244,214,168,0.9)" : "rgba(244,214,168,0.22)",
            transition: "background 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 30, lineHeight: 1.35, fontWeight: 300, letterSpacing: "-0.01em",
};
const bodyStyle: React.CSSProperties = {
  fontSize: 19, lineHeight: 1.6, fontWeight: 300, color: "rgba(245,232,214,0.86)",
};

/* ── screens ────────────────────────────────────────────────── */

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      onClick={onBegin}
      className="d1-fade"
      style={{
        position: "absolute", inset: 0, zIndex: 10, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 22, background: "radial-gradient(120% 90% at 50% 42%, #2a1a0e, #140d08 72%)",
        color: "inherit", border: "none", cursor: "pointer", textAlign: "center",
      }}
    >
      <div className="d1-breathe" style={{ position: "absolute", top: "34%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,196,132,0.55), transparent 68%)" }} />
      <div style={{ zIndex: 2, letterSpacing: "0.42em", fontSize: 15, paddingInlineStart: "0.42em", color: "rgba(245,224,190,0.9)" }}>
        MOOD
      </div>
      <div className="d1-rise" style={{ zIndex: 2, ...bodyStyle, fontSize: 21, animationDelay: "0.5s" }}>
        פעם ביום. רגע אחד. שלך.
      </div>
      <div className="d1-rise" style={{ zIndex: 2, fontSize: 14, color: "rgba(245,224,190,0.5)", marginTop: 26, animationDelay: "1.4s" }}>
        גע כדי להתחיל
      </div>
    </button>
  );
}

function Discovery({ step, onChoose }: { step: number; onChoose: (o: ChoiceOption) => void }) {
  const s = DISCOVERY[step];
  return (
    <div key={step} className="d1-fade" style={{ position: "absolute", inset: 0 }}>
      <Dots n={DISCOVERY.length} i={step} />
      {step === 0 && (
        <div style={{ position: "absolute", top: 48, insetInline: 0, textAlign: "center", zIndex: 10, fontSize: 15, color: "rgba(245,224,190,0.72)" }}>
          מה מרגיש לך יותר?
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {[s.left, s.right].map((opt, k) => (
          <button
            key={opt.id}
            onClick={() => onChoose(opt)}
            className="d1-tap"
            style={{
              position: "relative", flex: 1, width: "100%", border: "none",
              background: "transparent", cursor: "pointer", padding: 0, overflow: "hidden",
              borderTop: k === 1 ? "1px solid rgba(20,12,8,0.9)" : "none",
            }}
            aria-label={k === 0 ? "האפשרות הראשונה" : "האפשרות השנייה"}
          >
            <Scene scene={opt.scene} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Weaving({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#120c08" }}>
      <div className="d1-breathe" style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,196,132,0.5), transparent 68%)" }} />
      <div className="d1-fade" style={{ zIndex: 2, ...bodyStyle, fontSize: 20 }}>רגע אחד…</div>
    </div>
  );
}

function RecognitionScreen({ recognition, onNext }: { recognition: Recognition; onNext: () => void }) {
  const [showCta, setShowCta] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowCta(true), 900 + recognition.lines.length * 1400);
    return () => clearTimeout(t);
  }, [recognition]);
  return (
    <>
      <Scene scene="twoPeople" />
      <TextLayer>
        <div className="d1-reveal" style={{ fontSize: 14, letterSpacing: "0.06em", color: "rgba(244,214,168,0.8)", marginBottom: 14 }}>
          {MOMENT_TITLE}
        </div>
        {recognition.lines.map((line, i) => (
          <div
            key={i}
            className="d1-reveal"
            style={{ ...titleStyle, animationDelay: `${0.5 + i * 1.4}s` }}
          >
            {line}
          </div>
        ))}
        <button
          onClick={onNext}
          className="d1-tap"
          style={{
            marginTop: 30, opacity: showCta ? 1 : 0, transition: "opacity 1s ease",
            pointerEvents: showCta ? "auto" : "none",
            background: "rgba(244,214,168,0.12)", color: "rgba(245,232,214,0.95)",
            border: "1px solid rgba(244,214,168,0.3)", borderRadius: 99,
            padding: "13px 24px", fontSize: 16, cursor: "pointer",
          }}
        >
          יש לזה גם הזמנה קטנה →
        </button>
      </TextLayer>
    </>
  );
}

function ChallengeScreen({ onPick }: { onPick: (l: Level) => void }) {
  return (
    <>
      <Scene scene="reach" dim />
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 22px 40px" }} className="pb-safe">
        <div className="d1-rise" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div style={{ ...bodyStyle, fontSize: 17, textAlign: "center", marginBottom: 22, color: "rgba(244,214,168,0.9)" }}>
            {CHALLENGE_HEADER}
          </div>
          {CHALLENGES.map((c, i) => (
            <button
              key={c.level}
              onClick={() => onPick(c.level)}
              className="d1-tap d1-rise"
              style={{
                display: "block", width: "100%", textAlign: "start", marginBottom: 12,
                background: "rgba(28,18,11,0.66)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(244,214,168,0.18)", borderRadius: 18,
                padding: "17px 20px", cursor: "pointer", color: "inherit",
                animationDelay: `${0.1 + i * 0.12}s`,
              }}
            >
              <div style={{ fontSize: 12.5, letterSpacing: "0.14em", color: "rgba(244,214,168,0.7)", marginBottom: 7 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.45 }}>{c.text}</div>
              <div style={{ fontSize: 14, color: "rgba(245,232,214,0.55)", marginTop: 5 }}>{c.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Live({ onEvening }: { onEvening: () => void }) {
  return (
    <>
      <Scene scene="dusk" />
      <TextLayer center>
        <div className="d1-reveal" style={{ ...titleStyle, marginBottom: 14 }}>עכשיו החלק האמיתי.</div>
        <div className="d1-reveal" style={{ ...bodyStyle, animationDelay: "0.6s" }}>
          צא לחיות את זה. הרגע יחכה לך כאן, בערב.
        </div>
        <button
          onClick={onEvening}
          className="d1-tap d1-fade"
          style={{
            marginTop: 30, animationDelay: "1.6s",
            background: "rgba(244,214,168,0.12)", color: "rgba(245,232,214,0.95)",
            border: "1px solid rgba(244,214,168,0.3)", borderRadius: 99,
            padding: "13px 26px", fontSize: 16, cursor: "pointer",
          }}
        >
          בערב, כשאחזור →
        </button>
      </TextLayer>
    </>
  );
}

function Evening({
  tried, setTried, feelings, setFeelings, note, setNote, onSave,
}: {
  tried: boolean | null;
  setTried: (b: boolean) => void;
  feelings: string[];
  setFeelings: (f: string[]) => void;
  note: string;
  setNote: (s: string) => void;
  onSave: () => void;
}) {
  function toggleFeeling(f: string) {
    setFeelings(feelings.includes(f) ? feelings.filter((x) => x !== f) : [...feelings, f]);
  }
  return (
    <>
      <Scene scene="dusk" dim />
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 38px", overflowY: "auto" }} className="pb-safe pt-safe">
        <div className="d1-rise" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div style={{ ...titleStyle, fontSize: 25, marginBottom: 20 }}>איך היה?</div>

          <div style={{ fontSize: 16, color: "rgba(245,232,214,0.75)", marginBottom: 10 }}>ניסית?</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <Pill active={tried === true} onClick={() => setTried(true)}>ניסיתי</Pill>
            <Pill active={tried === false} onClick={() => setTried(false)}>לא הפעם</Pill>
          </div>

          {tried === false && (
            <div className="d1-fade" style={{ ...bodyStyle, fontSize: 16, marginBottom: 18, color: "rgba(244,214,168,0.9)" }}>
              גם זה בסדר גמור. הרגע נשאר שלך.
            </div>
          )}
          {tried === true && (
            <div className="d1-fade" style={{ ...bodyStyle, fontSize: 16, marginBottom: 18, color: "rgba(244,214,168,0.9)" }}>
              יופי שניסית. זה כל העניין.
            </div>
          )}

          {tried !== null && (
            <div className="d1-fade">
              <div style={{ fontSize: 16, color: "rgba(245,232,214,0.75)", marginBottom: 10 }}>איך הרגשת?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {FEELINGS.map((f) => (
                  <Pill key={f} small active={feelings.includes(f)} onClick={() => toggleFeeling(f)}>
                    {f}
                  </Pill>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="משהו שקרה? (לא חובה)"
                rows={2}
                style={{
                  width: "100%", resize: "none", borderRadius: 14, padding: "12px 14px",
                  background: "rgba(28,18,11,0.6)", border: "1px solid rgba(244,214,168,0.18)",
                  color: "inherit", fontSize: 16, fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={onSave}
                className="d1-tap"
                style={{
                  marginTop: 18, width: "100%", background: "rgba(244,214,168,0.16)",
                  color: "rgba(245,232,214,0.98)", border: "1px solid rgba(244,214,168,0.34)",
                  borderRadius: 99, padding: "15px", fontSize: 17, cursor: "pointer",
                }}
              >
                שמור את הרגע
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Pill({ children, active, onClick, small }: { children: React.ReactNode; active?: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="d1-tap"
      style={{
        padding: small ? "9px 14px" : "12px 20px", borderRadius: 99, cursor: "pointer",
        fontSize: small ? 15 : 16,
        background: active ? "rgba(244,214,168,0.9)" : "rgba(28,18,11,0.6)",
        color: active ? "#241608" : "rgba(245,232,214,0.9)",
        border: `1px solid ${active ? "transparent" : "rgba(244,214,168,0.22)"}`,
        transition: "all 0.35s ease", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function Library({ level, tried, feeling, onNext }: { level: Level | null; tried: boolean | null; feeling?: string; onNext: () => void }) {
  const levelLabel = CHALLENGES.find((c) => c.level === level)?.label ?? "";
  return (
    <>
      <Scene scene="paper" />
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 40px" }} className="pb-safe">
        <div className="d1-rise" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div style={{ ...bodyStyle, fontSize: 17, marginBottom: 16, color: "rgba(244,214,168,0.9)" }}>
            זה הרגע הראשון בספרייה שלך.
          </div>
          {/* the one entry — visibly #1, space around it implies growth */}
          <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(244,214,168,0.2)", background: "rgba(28,18,11,0.5)" }}>
            <div style={{ position: "relative", height: 150 }}>
              <Scene scene="twoPeople" />
              <div style={{ position: "absolute", bottom: 12, insetInlineStart: 16, zIndex: 10, fontSize: 15, color: "rgba(245,232,214,0.95)" }}>
                {MOMENT_TITLE}
              </div>
            </div>
            <div style={{ padding: "14px 16px", fontSize: 14.5, color: "rgba(245,232,214,0.7)", lineHeight: 1.6 }}>
              {tried ? "ניסית" : "רגע שלך"}{levelLabel ? ` · ${levelLabel}` : ""}{feeling ? ` · ${feeling}` : ""}
            </div>
          </div>
          <button
            onClick={onNext}
            className="d1-tap"
            style={{
              marginTop: 20, width: "100%", background: "rgba(244,214,168,0.14)",
              color: "rgba(245,232,214,0.96)", border: "1px solid rgba(244,214,168,0.3)",
              borderRadius: 99, padding: "14px", fontSize: 16, cursor: "pointer",
            }}
          >
            סיימנו להיום
          </button>
        </div>
      </div>
    </>
  );
}

function DayTwo({ remind, setRemind }: { remind: boolean; setRemind: (v: boolean) => void }) {
  const lines = [
    "הרגע הזה עכשיו שלך.",
    "מחר מחכה לך רגע חדש —",
    "הוא עוד לא יודע מה יגלה עליך.",
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 100% at 50% 40%, #241708, #100a06 74%)" }}>
      <div className="d1-breathe" style={{ position: "absolute", top: "26%", insetInline: 0, margin: "0 auto", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,196,132,0.5), transparent 68%)" }} />
      <TextLayer center>
        {lines.map((l, i) => (
          <div key={i} className="d1-reveal" style={{ ...titleStyle, fontSize: 24, animationDelay: `${0.4 + i * 1.5}s` }}>
            {l}
          </div>
        ))}
        <div className="d1-fade" style={{ marginTop: 34, animationDelay: `${0.4 + lines.length * 1.5}s` }}>
          <div style={{ fontSize: 26, fontWeight: 300, letterSpacing: "0.02em" }}>נתראה מחר.</div>
          <button
            onClick={() => setRemind(!remind)}
            className="d1-tap"
            style={{
              marginTop: 26, background: "transparent", cursor: "pointer",
              color: remind ? "rgba(244,214,168,0.95)" : "rgba(245,232,214,0.5)",
              border: `1px solid ${remind ? "rgba(244,214,168,0.4)" : "rgba(244,214,168,0.18)"}`,
              borderRadius: 99, padding: "11px 20px", fontSize: 14.5, transition: "all 0.4s ease",
            }}
          >
            {remind ? "✓ אזכיר לך מחר בערב · פעם אחת, בעדינות" : "הזכר לי מחר בערב"}
          </button>
        </div>
      </TextLayer>
    </div>
  );
}

function Returning({ saved, onReset }: { saved: Saved | null; onReset: () => void }) {
  return (
    <>
      <Scene scene="dusk" />
      <TextLayer center>
        <div className="d1-reveal" style={{ ...titleStyle, fontSize: 24, marginBottom: 12 }}>
          היית כאן היום.
        </div>
        <div className="d1-reveal" style={{ ...bodyStyle, animationDelay: "0.6s" }}>
          מחר יבוא רגע חדש — הוא עוד לא יודע מה יגלה עליך.
        </div>
        {saved?.tried === false && (
          <div className="d1-fade" style={{ ...bodyStyle, fontSize: 15, marginTop: 12, color: "rgba(244,214,168,0.8)" }}>
            והרגע של היום נשאר שלך.
          </div>
        )}
        <button
          onClick={onReset}
          style={{
            marginTop: 40, background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(245,232,214,0.32)", fontSize: 13,
          }}
        >
          התחל מחדש (התנסות)
        </button>
      </TextLayer>
    </>
  );
}
