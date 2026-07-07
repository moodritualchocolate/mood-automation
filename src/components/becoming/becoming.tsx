"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyChoice, assembleBecoming, emptyMap, growthFraming, pickRecognition,
  type Axis, type ContentBundle, type HumanMap,
} from "@/lib/becoming/engine";

const KEY = "mood_becoming_v1";
type Attempt = { dimension: string; tried: boolean };
type Save = { day: number; map: HumanMap | null; attempts: Attempt[] };
type Phase = "discovery" | "open" | "recognition" | "challenge" | "capture" | "becoming" | "question" | "tomorrow" | "closed";

const TOTAL = 6;

export default function Becoming({ bundle }: { bundle: ContentBundle }) {
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<Save>({ day: 1, map: null, attempts: [] });
  const [phase, setPhase] = useState<Phase>("open");
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<HumanMap>(emptyMap());
  const [tried, setTried] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    let s: Save = { day: 1, map: null, attempts: [] };
    try { const raw = localStorage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch {}
    try { const ov = new URLSearchParams(location.search).get("day"); if (ov) s.day = Math.max(1, Math.min(TOTAL, Number(ov))); } catch {}
    setSave(s);
    setChosen(s.map || emptyMap());
    setPhase(s.day === 1 && !s.map ? "discovery" : "open");
    setReady(true);
  }, []);

  const persist = (s: Save) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} setSave(s); };

  const dimension = bundle.order[(save.day - 1) % bundle.order.length];
  const moment = bundle.moments[dimension];
  const map = save.map || chosen;
  const recognition = useMemo(() => moment && pickRecognition(moment.recognitions, map), [moment, map]);
  const engaged = useMemo(() => new Set(save.attempts.map((a) => a.dimension)), [save.attempts]);
  const distinct = engaged.size;
  const becomingLine = useMemo(() => assembleBecoming(bundle.becomingStatements.rules, engaged), [engaged, bundle]);
  const framing = useMemo(() => growthFraming(bundle.becomingPortrait, distinct), [distinct, bundle]);

  if (!ready || !moment) return <Shell><span /></Shell>;

  // --- discovery (day 1 only) ---
  if (phase === "discovery") {
    const stepData = bundle.discovery.steps[step];
    return (
      <Shell>
        <Dim>{bundle.system.onboarding.welcome}</Dim>
        <P>{step === 0 ? bundle.discovery.opening : stepData.prompt}</P>
        {[stepData.left, stepData.right].map((o: any) => (
          <Btn key={o.id} onClick={() => {
            const nextMap = applyChoice(map, o.signals as Partial<Record<Axis, number>>);
            setChosen(nextMap);
            if (step < bundle.discovery.steps.length - 1) setStep(step + 1);
            else { persist({ ...save, map: nextMap }); setPhase("open"); }
          }}>{o.label}</Btn>
        ))}
        <Meta>{step + 1} / {bundle.discovery.steps.length}</Meta>
      </Shell>
    );
  }

  // --- daily loop ---
  if (phase === "open") {
    const greet = save.day === 1 ? bundle.system.daily.greeting_morning : bundle.system.daily.greeting_returning;
    return (
      <Shell>
        <Dim>יום {save.day} · {TOTAL}</Dim>
        <P>{greet}</P>
        <Btn onClick={() => setPhase("recognition")}>{bundle.system.daily.open_moment}</Btn>
      </Shell>
    );
  }
  if (phase === "recognition") {
    return (
      <Shell>
        <Dim>{moment.title}</Dim>
        {recognition.lines.map((l, i) => <Line key={i}>{l}</Line>)}
        <Btn onClick={() => setPhase("challenge")}>יש לזה גם הזמנה קטנה</Btn>
      </Shell>
    );
  }
  if (phase === "challenge") {
    return (
      <Shell>
        <P>{moment.challengeHeader}</P>
        {moment.challenges.map((c) => (
          <Btn key={c.level} onClick={() => setPhase("capture")}>
            <b>{c.label}:</b> {c.text}<br /><Meta>{c.sub}</Meta>
          </Btn>
        ))}
      </Shell>
    );
  }
  if (phase === "capture") {
    return (
      <Shell>
        <P>עכשיו החלק האמיתי — צא לחיות את זה. בערב, ספר לי: ניסית?</P>
        {tried === null ? (
          <>
            <Btn onClick={() => setTried(true)}>ניסיתי</Btn>
            <Btn onClick={() => setTried(false)}>לא הפעם</Btn>
          </>
        ) : (
          <>
            <Line>{tried ? moment.onTry[0] : moment.onNotThisTime[0]}</Line>
            <Btn onClick={() => {
              const attempts = [...save.attempts, { dimension, tried: !!tried }];
              persist({ ...save, attempts });
              setTried(null);
              setPhase("becoming");
            }}>שמור את הרגע</Btn>
          </>
        )}
      </Shell>
    );
  }
  if (phase === "becoming") {
    const enough = distinct >= 1;
    return (
      <Shell>
        <Dim>מי שאתה נעשה</Dim>
        {!enough ? <Line>{bundle.becomingStatements.early_state}</Line> : (
          <>
            <Line>{framing}</Line>
            <Line strong>{becomingLine}</Line>
          </>
        )}
        <Btn onClick={() => setPhase(save.day >= TOTAL ? "question" : "tomorrow")}>
          {save.day >= TOTAL ? "רגע אחרון" : "סיימנו להיום"}
        </Btn>
      </Shell>
    );
  }
  if (phase === "tomorrow") {
    return (
      <Shell>
        <Line>{moment.tomorrowHooks[0]}</Line>
        <Btn onClick={() => { persist({ ...save, day: save.day + 1 }); setPhase("open"); }}>
          {/* prototype: advance a day; in life this is tomorrow */}
          למחר →
        </Btn>
        <Reset />
      </Shell>
    );
  }
  if (phase === "question") {
    const q = bundle.becomingPortrait.the_question;
    return (
      <Shell>
        {!answer ? (
          <>
            <Line strong>{becomingLine}</Line>
            <P>{q.prompt}</P>
            <Btn onClick={() => setAnswer("yes")}>{q.yes}</Btn>
            <Btn onClick={() => setAnswer("no")}>{q.no}</Btn>
          </>
        ) : (
          <>
            <Line>{answer === "yes" ? q.on_yes[0] : q.on_no[0]}</Line>
            <Reset />
          </>
        )}
      </Shell>
    );
  }
  return <Shell><Reset /></Shell>;
}

/* --- minimal calm UI (typography on a warm ground; no assets) --- */
const wrap: React.CSSProperties = { position: "fixed", inset: 0, background: "#17110c", color: "#f3e7d6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 26px", fontFamily: "Georgia, 'Times New Roman', serif", textAlign: "center", direction: "rtl" };
const inner: React.CSSProperties = { maxWidth: 460, width: "100%" };
function Shell({ children }: { children: React.ReactNode }) { return <div style={wrap}><div style={inner}>{children}</div></div>; }
function P({ children }: { children: React.ReactNode }) { return <p style={{ fontSize: 20, lineHeight: 1.6, fontWeight: 300, margin: "0 0 20px" }}>{children}</p>; }
function Line({ children, strong }: { children: React.ReactNode; strong?: boolean }) { return <p style={{ fontSize: strong ? 24 : 20, lineHeight: 1.6, fontWeight: 300, color: strong ? "#f6ead9" : "rgba(243,231,214,0.85)", margin: "6px 0" }}>{children}</p>; }
function Dim({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 13, letterSpacing: 2, color: "rgba(244,214,168,0.7)", marginBottom: 18 }}>{children}</div>; }
function Meta({ children }: { children: React.ReactNode }) { return <span style={{ fontSize: 14, color: "rgba(243,231,214,0.5)" }}>{children}</span>; }
function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ display: "block", width: "100%", margin: "10px 0", padding: "14px 18px", fontSize: 17, fontFamily: "inherit", color: "#f3e7d6", background: "rgba(244,214,168,0.08)", border: "1px solid rgba(244,214,168,0.28)", borderRadius: 12, cursor: "pointer", textAlign: "start", lineHeight: 1.5 }}>{children}</button>;
}
function Reset() {
  return <button onClick={() => { try { localStorage.removeItem(KEY); } catch {} location.href = "/becoming"; }} style={{ marginTop: 30, background: "none", border: "none", color: "rgba(243,231,214,0.35)", fontSize: 13, cursor: "pointer" }}>התחל מחדש (התנסות)</button>;
}
