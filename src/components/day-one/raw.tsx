"use client";

// MOOD · THE UGLY TEST.
// Intentionally unstyled: system serif, black on white, no art, no animation.
// Purpose: test whether the SUBSTANCE of Day One is wanted, with the beauty removed.
// Same Moment content + registry as the real app — only the skin is ugly.

import { useEffect, useMemo, useState } from "react";
import { DISCOVERY, FEELINGS, buildMap, type ChoiceOption, type Level } from "./content";
import { selectMoment } from "./moments";

type Phase = "intro" | "discovery" | "recognition" | "challenge" | "live" | "evening" | "done" | "returning";
const KEY = "mood_raw_v1";

// Test-only text for the discovery options (the real app uses images).
const LABEL: Record<string, string> = {
  outside: "מבחוץ, מסתכל פנימה",
  inside: "מבפנים, בתוך חדר חמים",
  reach: "היד שמושטת ראשונה",
  wait: "היד שמחכה, פתוחה",
  crowd: "רחוב שוקק אנשים",
  quiet: "אדם אחד על ספסל",
  half: "דלת שפתוחה בחצי",
  wide: "דלת פתוחה לרווחה",
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
type Saved = { dates: string[]; lastDate: string };
function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") as Saved;
  } catch {
    return { dates: [], lastDate: "" };
  }
}

const wrap: React.CSSProperties = { maxWidth: 520, margin: "0 auto", padding: "28px 20px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 19, lineHeight: 1.6, color: "#111" };
const btn: React.CSSProperties = { display: "block", width: "100%", textAlign: "start", margin: "8px 0", padding: "12px 14px", fontSize: 18, fontFamily: "inherit", background: "#fff", border: "1px solid #333", borderRadius: 4, cursor: "pointer", color: "#111" };

export default function Raw() {
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [dayIndex, setDayIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<ChoiceOption[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [tried, setTried] = useState<boolean | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    // Optional override for observing Day 2 without waiting (?day=2).
    let ov: number | null = null;
    try {
      const p = new URLSearchParams(location.search).get("day");
      if (p) ov = Number(p) - 1;
    } catch {}
    const s = load();
    if (ov != null) {
      setDayIndex(ov);
    } else if (s.lastDate === today()) {
      setPhase("returning"); // already met today's moment
    } else {
      setDayIndex(s.dates.length); // Day N = number of prior days
    }
    setReady(true);
  }, []);

  const map = useMemo(() => buildMap(chosen), [chosen]);
  const moment = useMemo(() => selectMoment(dayIndex), [dayIndex]);
  const recognition = useMemo(() => moment.recognize(map), [moment, map]);

  function choose(o: ChoiceOption) {
    const next = [...chosen, o];
    setChosen(next);
    if (step < DISCOVERY.length - 1) setStep(step + 1);
    else setPhase("recognition");
  }
  function finish() {
    try {
      const s = load();
      const dates = s.dates.includes(today()) ? s.dates : [...s.dates, today()];
      localStorage.setItem(KEY, JSON.stringify({ dates, lastDate: today() }));
    } catch {}
    setPhase("done");
  }

  if (!ready) return <div style={wrap} />;

  return (
    <div style={wrap} dir="rtl">
      <div style={{ fontSize: 12, letterSpacing: 3, color: "#999", marginBottom: 24 }}>MOOD · יום {dayIndex + 1}</div>

      {phase === "intro" && (
        <>
          <p>פעם ביום. רגע אחד. שלך.</p>
          <button style={btn} onClick={() => setPhase("discovery")}>להתחיל</button>
        </>
      )}

      {phase === "discovery" && (
        <>
          <p>{step === 0 ? "מה מרגיש לך יותר?" : " "}</p>
          {[DISCOVERY[step].left, DISCOVERY[step].right].map((o) => (
            <button key={o.id} style={btn} onClick={() => choose(o)}>{LABEL[o.id] ?? o.id}</button>
          ))}
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 10 }}>{step + 1} / {DISCOVERY.length}</div>
        </>
      )}

      {phase === "recognition" && (
        <>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>{moment.title}</div>
          {recognition.lines.map((l, i) => (
            <p key={i} style={{ margin: "4px 0" }}>{l}</p>
          ))}
          <button style={btn} onClick={() => setPhase("challenge")}>יש לזה גם הזמנה קטנה</button>
        </>
      )}

      {phase === "challenge" && (
        <>
          <p>{moment.challengeHeader}</p>
          {moment.challenges.map((c) => (
            <button key={c.level} style={btn} onClick={() => { setLevel(c.level); setPhase("live"); }}>
              <b>{c.label}:</b> {c.text}
              <div style={{ fontSize: 14, color: "#666" }}>{c.sub}</div>
            </button>
          ))}
        </>
      )}

      {phase === "live" && (
        <>
          <p>עכשיו החלק האמיתי. צא לחיות את זה. הרגע יחכה לך כאן, בערב.</p>
          <button style={btn} onClick={() => setPhase("evening")}>בערב, כשאחזור</button>
        </>
      )}

      {phase === "evening" && (
        <>
          <p>איך היה? ניסית?</p>
          <button style={btn} onClick={() => setTried(true)}>{tried === true ? "✓ " : ""}ניסיתי</button>
          <button style={btn} onClick={() => setTried(false)}>{tried === false ? "✓ " : ""}לא הפעם</button>
          {tried != null && (
            <>
              <p style={{ marginTop: 16 }}>{tried ? "יופי שניסית." : "גם זה בסדר גמור. הרגע נשאר שלך."}</p>
              <p>איך הרגשת?</p>
              <div>
                {FEELINGS.map((f) => (
                  <button
                    key={f}
                    style={{ ...btn, display: "inline-block", width: "auto", margin: "4px", background: feelings.includes(f) ? "#111" : "#fff", color: feelings.includes(f) ? "#fff" : "#111" }}
                    onClick={() => setFeelings(feelings.includes(f) ? feelings.filter((x) => x !== f) : [...feelings, f])}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="משהו שקרה? (לא חובה)" rows={2} style={{ width: "100%", marginTop: 12, fontFamily: "inherit", fontSize: 17, padding: 10 }} />
              <button style={btn} onClick={finish}>שמור את הרגע</button>
            </>
          )}
        </>
      )}

      {phase === "done" && (
        <>
          <p>הרגע הזה עכשיו שלך.</p>
          <p>מחר מחכה לך רגע חדש — הוא עוד לא יודע מה יגלה עליך.</p>
          <p style={{ marginTop: 20, fontSize: 22 }}>נתראה מחר.</p>
        </>
      )}

      {phase === "returning" && (
        <>
          <p>היית כאן היום.</p>
          <p>מחר יבוא רגע חדש — הוא עוד לא יודע מה יגלה עליך.</p>
          <button style={{ ...btn, marginTop: 24, color: "#999", borderColor: "#ccc" }} onClick={() => { localStorage.removeItem(KEY); location.reload(); }}>התחל מחדש (התנסות)</button>
        </>
      )}
    </div>
  );
}
