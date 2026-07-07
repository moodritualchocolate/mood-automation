"use client";

import type { SceneKey } from "./content";

// Wordless, warm, filmic scenes built from light + silhouette only.
// NO text of any kind (per the no-text-in-images rule) — these are placeholders
// for Grok artwork; the light/negative-space language stays when real art lands.

const INK = "rgb(22,16,12)";

function Layer({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
}

// A soft warm sun/light source.
function Sun({ x, y, size, intensity = 1 }: { x: string; y: string; size: number; intensity?: number }) {
  return (
    <Layer
      style={{
        background: `radial-gradient(${size}% ${size}% at ${x} ${y}, rgba(240,196,132,${0.9 * intensity}), rgba(214,150,86,${0.5 * intensity}) 30%, rgba(120,70,40,0.15) 55%, transparent 72%)`,
      }}
    />
  );
}

// Blurred silhouette blob — implies a figure/form without depicting one literally.
function Form({ cx, cy, w, h, blur = 22, op = 0.5, r = "48%" }: { cx: string; cy: string; w: number; h: number; blur?: number; op?: number; r?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        width: `${w}%`,
        height: `${h}%`,
        transform: "translate(-50%,-50%)",
        background: `rgba(18,11,7,${op})`,
        filter: `blur(${blur}px)`,
        borderRadius: r,
      }}
    />
  );
}

export function Scene({ scene, dim = false }: { scene: SceneKey; dim?: boolean }) {
  return (
    <Layer style={{ overflow: "hidden", background: INK }}>
      <div className="d1-drift" style={{ position: "absolute", inset: "-4%" }}>
        {sceneBody(scene)}
      </div>
      {/* bottom negative-space scrim reserved for the live Hebrew text layer */}
      <Layer
        style={{
          background:
            "linear-gradient(to top, rgba(14,9,6,0.92) 0%, rgba(14,9,6,0.55) 26%, transparent 58%)",
        }}
      />
      {dim && <Layer style={{ background: "rgba(10,7,5,0.42)" }} />}
    </Layer>
  );
}

function sceneBody(scene: SceneKey) {
  switch (scene) {
    case "window":
      // a lit window seen from a dark room (belonging: from outside)
      return (
        <>
          <Layer style={{ background: "linear-gradient(160deg,#0e0906,#160f0a)" }} />
          <div
            className="d1-breathe"
            style={{
              position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)",
              width: "34%", height: "46%", borderRadius: 10,
              background: "linear-gradient(180deg, rgba(246,206,140,0.95), rgba(206,138,74,0.7))",
              boxShadow: "0 0 120px 40px rgba(232,176,104,0.45)",
            }}
          />
          <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)", width: "34%", height: "46%", background: "linear-gradient(90deg,transparent 48%,rgba(20,12,8,0.6) 49%,rgba(20,12,8,0.6) 51%,transparent 52%)" }} />
        </>
      );
    case "room":
      // a warm room from inside (belonging: enveloped)
      return (
        <>
          <Layer style={{ background: "radial-gradient(120% 100% at 50% 45%, #3a2417, #1a110b 70%)" }} />
          <Sun x="50%" y="46%" size={90} intensity={0.9} />
          <Form cx="30%" cy="72%" w={26} h={30} op={0.4} />
          <Form cx="70%" cy="74%" w={24} h={28} op={0.4} />
        </>
      );
    case "reach":
      // two forms leaning toward each other (initiation: reach first)
      return (
        <>
          <Layer style={{ background: "linear-gradient(120deg,#241606,#3a2410)" }} />
          <Sun x="50%" y="42%" size={80} intensity={0.8} />
          <Form cx="38%" cy="52%" w={20} h={40} op={0.55} r="46% 46% 40% 40%" />
          <Form cx="60%" cy="50%" w={20} h={42} op={0.55} r="46% 46% 40% 40%" />
          <Form cx="49%" cy="52%" w={10} h={8} op={0.35} blur={14} />
        </>
      );
    case "wait":
      // one open, waiting form; light held in the center (initiation: attentive)
      return (
        <>
          <Layer style={{ background: "radial-gradient(120% 120% at 50% 55%, #2a1a0e, #150e08 72%)" }} />
          <div className="d1-breathe" style={{ position: "absolute", left: "50%", top: "48%", transform: "translate(-50%,-50%)", width: "22%", height: "22%", borderRadius: "50%", background: "radial-gradient(circle,rgba(244,200,140,0.9),rgba(210,140,80,0.2) 70%,transparent)" }} />
          <Form cx="50%" cy="52%" w={30} h={48} op={0.4} r="50% 50% 44% 44%" blur={26} />
        </>
      );
    case "street":
      // a warm crowded street (energy: crowd)
      return (
        <>
          <Layer style={{ background: "linear-gradient(180deg,#3a2612 0%,#241608 60%,#160e07 100%)" }} />
          <Sun x="50%" y="26%" size={70} intensity={0.7} />
          {[18, 30, 42, 54, 66, 78].map((x, i) => (
            <Form key={i} cx={`${x}%`} cy={`${60 + (i % 2) * 6}%`} w={7} h={22 + (i % 3) * 4} op={0.5} blur={10} r="40% 40% 30% 30%" />
          ))}
        </>
      );
    case "bench":
      // one quiet person, vast calm (energy: quiet)
      return (
        <>
          <Layer style={{ background: "linear-gradient(180deg,#2e1f10,#181009 78%)" }} />
          <Sun x="72%" y="34%" size={70} intensity={0.7} />
          <Form cx="34%" cy="60%" w={13} h={30} op={0.55} r="44% 44% 30% 30%" blur={16} />
        </>
      );
    case "door-half":
      // a door half-open, a slit of light (risk: measured)
      return (
        <>
          <Layer style={{ background: "linear-gradient(150deg,#0f0a06,#1c130c)" }} />
          <div className="d1-breathe" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "9%", height: "62%", background: "linear-gradient(180deg,rgba(244,202,142,0.95),rgba(206,138,74,0.6))", boxShadow: "0 0 90px 26px rgba(232,176,104,0.45)" }} />
        </>
      );
    case "door-wide":
      // a wide-open glowing portal (risk: open)
      return (
        <>
          <Layer style={{ background: "linear-gradient(150deg,#120b07,#20160d)" }} />
          <div className="d1-breathe" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "40%", height: "68%", borderRadius: "8px 8px 0 0", background: "linear-gradient(180deg,rgba(248,208,148,0.92),rgba(210,142,80,0.55))", boxShadow: "0 0 140px 50px rgba(236,180,108,0.5)" }} />
        </>
      );
    case "twoPeople":
      // the recognition hero — two figures at golden hour, big negative space below
      return (
        <>
          <Layer style={{ background: "linear-gradient(180deg,#4a3016 0%,#2a1810 55%,#160e08 100%)" }} />
          <Sun x="50%" y="34%" size={78} intensity={0.95} />
          <Form cx="42%" cy="46%" w={16} h={40} op={0.6} r="46% 46% 38% 38%" blur={18} />
          <Form cx="58%" cy="45%" w={16} h={42} op={0.6} r="46% 46% 38% 38%" blur={18} />
        </>
      );
    case "dusk":
      // evening / return
      return (
        <>
          <Layer style={{ background: "linear-gradient(180deg,#1a1630 0%,#3a2418 62%,#5a361c 100%)" }} />
          <Sun x="50%" y="86%" size={80} intensity={0.7} />
        </>
      );
    case "message":
      // a warm reach-out: a glowing screen-light held in a dark room (Moment_002)
      return (
        <>
          <Layer style={{ background: "radial-gradient(120% 120% at 50% 62%, #241708, #120c07 78%)" }} />
          <div
            className="d1-breathe"
            style={{
              position: "absolute", left: "50%", top: "58%", transform: "translate(-50%,-50%) rotate(-8deg)",
              width: "26%", height: "34%", borderRadius: 14,
              background: "linear-gradient(180deg, rgba(246,206,140,0.92), rgba(206,138,74,0.55))",
              boxShadow: "0 0 120px 44px rgba(232,176,104,0.42)",
            }}
          />
          <Form cx="50%" cy="66%" w={40} h={30} op={0.4} blur={30} />
        </>
      );
    case "paper":
      // library warm ground
      return (
        <>
          <Layer style={{ background: "radial-gradient(120% 120% at 50% 40%, #2c1d12, #170f09 80%)" }} />
          <Sun x="50%" y="30%" size={60} intensity={0.5} />
        </>
      );
    default:
      return <Layer style={{ background: INK }} />;
  }
}
