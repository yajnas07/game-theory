import { useState, useEffect, useCallback, useRef } from "react";
import {
LineChart, Line, XAxis, YAxis, Tooltip, Legend,
ResponsiveContainer, CartesianGrid
} from "recharts";
/* ─── Payoff matrix ─────────────────────────────────────────────────── */
const PAYOFF = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };
/* ─── Strategies ────────────────────────────────────────────────────── */
const STRATEGIES = {
"Always Cooperate": {
short: "ALLC",
color: "#22C55E",
desc: "Cooperates unconditionally every round.",
move: () => "C",
},
"Always Defect": {
short: "ALLD",
color: "#EF4444",
desc: "Defects unconditionally — maximises individual gain, destroys collective welfare.",
move: () => "D",
},
"Tit for Tat": {
short: "TFT",
color: "#3B82F6",
desc: "Cooperates on round 1, then mirrors the opponent’s last move exactly.",
move: (_my, opp) => opp.length === 0 ? "C" : opp[opp.length - 1],
},
"Tit for Two Tats": {
short: "TF2T",
color: "#8B5CF6",
desc: "Only defects after the opponent defects twice consecutively — very forgiving.",
move: (_my, opp) => {
const n = opp.length;
return (n >= 2 && opp[n - 1] === "D" && opp[n - 2] === "D") ? "D" : "C";
},
},
"Generous TFT": {
short: "GTFT",
color: "#F59E0B",
desc: "Like TFT but randomly forgives a defection ~20% of the time.",
move: (_my, opp) => {
if (opp.length === 0) return "C";
return (opp[opp.length - 1] === "D" && Math.random() > 0.2) ? "D" : "C";
},
},
"Grim Trigger": {
short: "GRIM",
color: "#EC4899",
desc: "Cooperates until betrayed once, then defects forever — no second chances.",
move: (_my, opp) => opp.includes("D") ? "D" : "C",
},
"Pavlov": {
short: "PAV",
color: "#14B8A6",
desc: "Win-Stay, Lose-Shift: repeat last move if score ≥ 3, otherwise switch.",
move: (my, _opp, scores) => {
if (my.length === 0) return "C";
return scores[scores.length - 1] >= 3 ? my[my.length - 1]
: (my[my.length - 1] === "C" ? "D" : "C");
},
},
"Random": {
short: "RAND",
color: "#94A3B8",
desc: "Cooperates or defects randomly with equal probability.",
move: () => Math.random() < 0.5 ? "C" : "D",
},
};
const NAMES = Object.keys(STRATEGIES);
/* ─── Simulation engine ─────────────────────────────────────────────── */
function runGame(n1, n2, rounds) {
const s1 = STRATEGIES[n1], s2 = STRATEGIES[n2];
const h1 = [], h2 = [], sc1 = [], sc2 = [], out = [];
for (let i = 0; i < rounds; i++) {
const m1 = s1.move(h1, h2, sc1);
const m2 = s2.move(h2, h1, sc2);
const [g1, g2] = PAYOFF[m1 + m2];
h1.push(m1); h2.push(m2); sc1.push(g1); sc2.push(g2);
const cum1 = sc1.reduce((a, b) => a + b, 0);
const cum2 = sc2.reduce((a, b) => a + b, 0);
out.push({ round: i + 1, m1, m2, s1: g1, s2: g2, cum1, cum2 });
}
return out;
}
function runTournament(rounds) {
const matrix = {}, totals = {};
NAMES.forEach(n => { matrix[n] = {}; totals[n] = 0; });
NAMES.forEach(n1 => NAMES.forEach(n2 => {
const g = runGame(n1, n2, rounds);
const score = g[g.length - 1]?.cum1 ?? 0;
matrix[n1][n2] = score;
totals[n1] += score;
}));
return { matrix, totals };
}
/* ─── Inline styles / tokens ────────────────────────────────────────── */
const T = {
bg: "#080E1C",
surface: "#0D1526",
card: "#111E33",
border: "#1A2A45",
borderBright: "#2A3F60",
text: "#E2E8F0",
muted: "#4A5F7A",
dim: "#2A3F60",
p1: "#7FA8FF",
p2: "#FF9F6A",
coop: "#22D3A0",
defect: "#F87171",
coopBg: "#052A1A",
defectBg: "#2A0A0A",
};
const css = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;600&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${T.bg}; } .chip { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; font-family:'JetBrains Mono',monospace; font-weight:600; font-size:12px; flex-shrink:0; } .C { background:${T.coopBg}; color:${T.coop}; border:1.5px solid ${T.coop}; } .D { background:${T.defectBg}; color:${T.defect}; border:1.5px solid ${T.defect}; } .tape::-webkit-scrollbar { height:3px; } .tape::-webkit-scrollbar-track { background:#0A1020; } .tape::-webkit-scrollbar-thumb { background:#2A3F60; border-radius:2px; } select { appearance:none; background:${T.card}; color:${T.text}; border:1px solid ${T.border}; border-radius:8px; padding:9px 34px 9px 12px; font-family:'Inter',sans-serif; font-size:14px; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234A5F7A' d='M1 1l5 5 5-5'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; } select:focus { outline:1px solid #3B82F6; } .btn { padding:8px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; transition:all 0.15s; } .btn-primary { background:linear-gradient(135deg,#1D4ED8,#4F46E5); color:white; } .btn-primary:hover { filter:brightness(1.15); } .btn-ghost { background:${T.card}; color:${T.muted}; border:1px solid ${T.border}; } .btn-ghost:hover { background:${T.border}; color:${T.text}; } .tab { padding:7px 18px; border-radius:6px; cursor:pointer; border:none; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; } .tab-active { background:#1E3A8A; color:#BAD4FF; } .tab-inactive { background:transparent; color:${T.muted}; } .tab-inactive:hover { color:${T.text}; } .eyebrow { font-family:'Space Grotesk',sans-serif; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; } .mono { font-family:'JetBrains Mono',monospace; } .heading { font-family:'Space Grotesk',sans-serif; }`;
/* ─── Move Chip ─────────────────────────────────────────────────────── */
function MoveChip({ move }) {
return <span className={`chip ${move}`}>{move}</span>;
}
/* ─── Score Panel ───────────────────────────────────────────────────── */
function ScorePanel({ label, name, score, opponent, lead, accent }) {
return (
<div style={{ background: T.card, borderRadius: 12, padding: "14px 18px",
border: `1px solid ${lead ? accent + "55" : T.border}`, flex: 1, textAlign: "center" }}>
<div className="eyebrow" style={{ color: accent, marginBottom: 6 }}>{label}</div>
<div style={{ fontSize: 13, color: T.muted, marginBottom: 8, fontFamily: "‘Inter’, sans-serif",
whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
<div className="mono" style={{ fontSize: 42, fontWeight: 700,
color: lead ? T.coop : opponent ? T.defect : T.text }}>
{score}
</div>
</div>
);
}
/* ─── Payoff Reference ──────────────────────────────────────────────── */
function PayoffRef() {
const pairs = [["C","C",3,3], ["C","D",0,5], ["D","C",5,0], ["D","D",1,1]];
return (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
<span className="eyebrow" style={{ color: T.muted, marginRight: 4 }}>Payoffs:</span>
{pairs.map(([m1, m2, s1, s2]) => (
<span key={m1+m2} style={{ display: "inline-flex", alignItems: "center", gap: 3,
background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
padding: "3px 8px", fontFamily: "‘JetBrains Mono’,monospace", fontSize: 12 }}>
<span style={{ color: m1 === "C" ? T.coop : T.defect }}>{m1}</span>
<span style={{ color: T.dim }}>·</span>
<span style={{ color: m2 === "C" ? T.coop : T.defect }}>{m2}</span>
<span style={{ color: T.muted }}> → </span>
<span style={{ color: T.p1 }}>{s1}</span>
<span style={{ color: T.dim }}>,</span>
<span style={{ color: T.p2 }}>{s2}</span>
</span>
))}
</div>
);
}
/* ─── Duel View ─────────────────────────────────────────────────────── */
function DuelView({ numRounds }) {
const [p1, setP1] = useState("Tit for Tat");
const [p2, setP2] = useState("Always Defect");
const [speed, setSpeed] = useState(250);
const [allRounds, setAllRounds] = useState([]);
const [shown, setShown] = useState([]);
const [cursor, setCursor] = useState(0);
const [playing, setPlaying] = useState(false);
const iref = useRef(null);
const tapeRef = useRef(null);
const init = useCallback(() => {
setAllRounds(runGame(p1, p2, numRounds));
setShown([]); setCursor(0); setPlaying(false);
}, [p1, p2, numRounds]);
useEffect(() => { init(); }, [init]);
useEffect(() => {
if (!playing) { clearInterval(iref.current); return; }
iref.current = setInterval(() => {
setCursor(c => {
if (c >= allRounds.length) { setPlaying(false); clearInterval(iref.current); return c; }
setShown(allRounds.slice(0, c + 1));
return c + 1;
});
}, speed);
return () => clearInterval(iref.current);
}, [playing, allRounds, speed]);
useEffect(() => {
if (tapeRef.current) tapeRef.current.scrollLeft = tapeRef.current.scrollWidth;
}, [shown]);
const play = () => {
if (cursor >= allRounds.length) { setShown([]); setCursor(0); setTimeout(() => setPlaying(true), 0); }
else setPlaying(!playing);
};
const skip = () => { setPlaying(false); setShown(allRounds); setCursor(allRounds.length); };
const reset = () => { setPlaying(false); setShown([]); setCursor(0); };
const last = shown[shown.length - 1];
const s1 = last?.cum1 ?? 0, s2 = last?.cum2 ?? 0;
const chartData = shown.map(r => ({ r: r.round, P1: r.cum1, P2: r.cum2 }));
return (
<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 {/* Strategy selectors */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 12,
   background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
<div>
<div className="eyebrow" style={{ color: T.p1, marginBottom: 8 }}>Player 1</div>
<select value={p1} onChange={e => setP1(e.target.value)} style={{ width: "100%" }}>
       {NAMES.map(n => <option key={n}>{n}</option>)}
</select>
<div style={{ fontSize: 12, color: T.muted, marginTop: 8, fontFamily: "'Inter',sans-serif",
       lineHeight: 1.5 }}>{STRATEGIES[p1].desc}</div>
</div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "center",
     paddingBottom: 24 }}>
<span className="heading" style={{ fontSize: 18, fontWeight: 700, color: T.dim }}>VS</span>
</div>
<div>
<div className="eyebrow" style={{ color: T.p2, marginBottom: 8 }}>Player 2</div>
<select value={p2} onChange={e => setP2(e.target.value)} style={{ width: "100%" }}>
       {NAMES.map(n => <option key={n}>{n}</option>)}
</select>
<div style={{ fontSize: 12, color: T.muted, marginTop: 8, fontFamily: "'Inter',sans-serif",
       lineHeight: 1.5 }}>{STRATEGIES[p2].desc}</div>
</div>
</div>
 {/* Controls bar */}
<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
<button className="btn btn-primary" onClick={play} style={{ minWidth: 110 }}>
     {playing ? "⏸ Pause" : cursor === 0 ? "▶ Play" : cursor >= allRounds.length ? "↺ Replay" : "▶ Resume"}
</button>
<button className="btn btn-ghost" onClick={skip}>⏭ Skip to end</button>
<button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
<span style={{ fontSize: 12, color: T.muted }}>Speed:</span>
<select value={speed} onChange={e => setSpeed(+e.target.value)} style={{ padding: "7px 30px 7px 10px" }}>
<option value={600}>Slow</option>
<option value={250}>Normal</option>
<option value={80}>Fast</option>
<option value={20}>Instant</option>
</select>
</div>
</div>
 {/* Score cards */}
<div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
<ScorePanel label="Player 1" name={p1} score={s1}
     lead={s1 > s2} opponent={s1 < s2} accent={T.p1} />
<div style={{ display: "flex", flexDirection: "column", alignItems: "center",
     justifyContent: "center", minWidth: 70, gap: 4 }}>
<div className="eyebrow" style={{ color: T.muted, fontSize: 9 }}>Round</div>
<div className="mono" style={{ fontSize: 26, fontWeight: 700, color: T.muted }}>
       {cursor}<span style={{ fontSize: 13, color: T.dim }}>/{numRounds}</span>
</div>
</div>
<ScorePanel label="Player 2" name={p2} score={s2}
     lead={s2 > s1} opponent={s2 < s1} accent={T.p2} />
</div>
 {/* Move tape */}
<div style={{ background: T.surface, borderRadius: 12, padding: "16px 18px",
   border: `1px solid ${T.border}` }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
     marginBottom: 12 }}>
<span className="eyebrow" style={{ color: T.muted }}>Move history</span>
     {shown.length > 0 && (
<span style={{ fontSize: 11, color: T.dim, fontFamily: "'JetBrains Mono',monospace" }}>
         {shown.length} rounds
</span>
     )}
</div>
   {/* Row labels */}
<div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
<div style={{ width: 20, display: "flex", flexDirection: "column", gap: 8,
       justifyContent: "center", flexShrink: 0 }}>
<span className="eyebrow" style={{ color: T.p1, fontSize: 8 }}>P1</span>
<span className="eyebrow" style={{ color: T.p2, fontSize: 8 }}>P2</span>
</div>
<div ref={tapeRef} className="tape"
       style={{ overflowX: "auto", display: "flex", gap: 5, paddingBottom: 4 }}>
       {shown.length === 0 ? (
<div style={{ color: T.dim, fontSize: 13, fontFamily: "'Inter',sans-serif",
           padding: "8px 0", whiteSpace: "nowrap" }}>
           Press ▶ Play to start the simulation…
</div>
       ) : shown.map((r, i) => {
         const isLast = i === shown.length - 1;
         return (
<div key={i} style={{ display: "flex", flexDirection: "column",
             alignItems: "center", gap: 4, flexShrink: 0,
             background: isLast ? T.card : "transparent",
             border: `1px solid ${isLast ? T.borderBright : "transparent"}`,
             borderRadius: 8, padding: "3px 2px" }}>
<MoveChip move={r.m1} />
<MoveChip move={r.m2} />
<span className="mono" style={{ fontSize: 9, color: T.dim }}>
               {r.s1}·{r.s2}
</span>
<span className="mono" style={{ fontSize: 8, color: "#1A2A45" }}>
               {r.round}
</span>
</div>
         );
       })}
</div>
</div>
   {/* Legend */}
<div style={{ display: "flex", gap: 14, marginTop: 10 }}>
     {[["C", T.coop, "Cooperate"], ["D", T.defect, "Defect"]].map(([m, c, label]) => (
<div key={m} style={{ display: "flex", alignItems: "center", gap: 5 }}>
<MoveChip move={m} />
<span style={{ fontSize: 11, color: T.muted }}>{label}</span>
</div>
     ))}
<span style={{ fontSize: 11, color: T.dim, marginLeft: 4 }}>
       · Score per round shown as <span className="mono">P1·P2</span>
</span>
</div>
</div>
 {/* Chart */}
 {shown.length > 1 && (
<div style={{ background: T.surface, borderRadius: 12, padding: "18px 18px 10px",
     border: `1px solid ${T.border}` }}>
<div className="eyebrow" style={{ color: T.muted, marginBottom: 14 }}>
       Cumulative score
</div>
<ResponsiveContainer width="100%" height={190}>
<LineChart data={chartData}>
<CartesianGrid strokeDasharray="3 3" stroke={T.border} />
<XAxis dataKey="r" stroke={T.border}
           tick={{ fontSize: 10, fill: T.muted }} label={{ value: "Round",
           position: "insideBottom", offset: -2, fill: T.muted, fontSize: 10 }} />
<YAxis stroke={T.border} tick={{ fontSize: 10, fill: T.muted }} />
<Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.borderBright}`,
           borderRadius: 8 }} labelStyle={{ color: T.muted, fontSize: 11 }}
           itemStyle={{ fontSize: 11 }} labelFormatter={v => `Round ${v}`} />
<Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
<Line type="monotone" dataKey="P1" name={`P1: ${p1}`}
           stroke={T.p1} strokeWidth={2} dot={false} />
<Line type="monotone" dataKey="P2" name={`P2: ${p2}`}
           stroke={T.p2} strokeWidth={2} dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
 )}
</div>
);
}
/* ─── Tournament View ───────────────────────────────────────────────── */
function TournamentView({ numRounds }) {
const [result, setResult] = useState(null);
const run = () => setResult(runTournament(numRounds));
const sorted = result
? NAMES.map(n => ({ n, t: result.totals[n] })).sort((a, b) => b.t - a.t)
: [];
const hi = sorted[0]?.t ?? 1, lo = sorted[sorted.length - 1]?.t ?? 0;
const cellColor = (score) => {
const maxP = numRounds * 5;
const pct = score / maxP;
if (pct > 0.72) return { bg: "#0A2D18", color: T.coop };
if (pct > 0.55) return { bg: "#0C1E3A", color: T.p1 };
if (pct > 0.38) return { bg: T.surface, color: T.text };
return { bg: "#1E0808", color: T.defect };
};
return (
<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
<p style={{ margin: 0, fontSize: 13, color: T.muted, fontFamily: "‘Inter’,sans-serif" }}>
Every strategy plays <span className="mono" style={{ color: T.text }}>{numRounds}</span> rounds
against every other (including itself). Winner by total score.
</p>
<button className="btn btn-primary" onClick={run}>Run Tournament</button>
</div>
 {!result && (
<div style={{ textAlign: "center", padding: "60px 0", color: T.dim,
     fontFamily: "'Space Grotesk',sans-serif", fontSize: 14 }}>
     Click "Run Tournament" to pit all strategies against each other
</div>
 )}
 {result && (
<>
     {/* Rankings */}
<div style={{ background: T.surface, borderRadius: 12, padding: "18px 20px",
       border: `1px solid ${T.border}` }}>
<div className="eyebrow" style={{ color: T.muted, marginBottom: 14 }}>Rankings</div>
       {sorted.map((item, i) => {
         const pct = (item.t - lo) / (hi - lo || 1);
         const strat = STRATEGIES[item.n];
         const medals = ["🥇", "🥈", "🥉"];
         return (
<div key={item.n} style={{ display: "flex", alignItems: "center",
             gap: 12, marginBottom: 10 }}>
<span style={{ fontSize: 16, width: 24, textAlign: "center" }}>
               {medals[i] || <span className="mono" style={{ fontSize: 12, color: T.muted }}>{i+1}</span>}
</span>
<div style={{ width: 10, height: 10, borderRadius: "50%",
               background: strat.color, flexShrink: 0 }} />
<span style={{ width: 155, fontSize: 13, color: T.text,
               fontFamily: "'Inter',sans-serif" }}>{item.n}</span>
<div style={{ flex: 1, background: T.card, borderRadius: 4,
               height: 7, overflow: "hidden" }}>
<div style={{ width: `${pct * 100}%`, height: "100%",
                 background: `linear-gradient(90deg, ${strat.color}88, ${strat.color})`,
                 borderRadius: 4 }} />
</div>
<span className="mono" style={{ fontSize: 13, color: T.muted, width: 48,
               textAlign: "right" }}>{item.t}</span>
</div>
         );
       })}
</div>
     {/* Matrix */}
<div style={{ background: T.surface, borderRadius: 12, padding: "18px 20px",
       border: `1px solid ${T.border}`, overflowX: "auto" }}>
<div className="eyebrow" style={{ color: T.muted, marginBottom: 4 }}>Score matrix</div>
<p style={{ fontSize: 11, color: T.dim, marginBottom: 14,
         fontFamily: "'Inter',sans-serif" }}>
         Row strategy's score when playing against column strategy
</p>
<table style={{ borderCollapse: "separate", borderSpacing: 3,
         fontFamily: "'JetBrains Mono',monospace" }}>
<thead>
<tr>
<th style={{ padding: "0 10px 4px 0", textAlign: "right",
               color: T.dim, fontSize: 9 }}>vs →</th>
             {NAMES.map(n => (
<th key={n} style={{ padding: "0 2px 6px", textAlign: "center",
                 color: T.p1, fontSize: 9, writingMode: "vertical-rl",
                 height: 72, verticalAlign: "bottom" }}>
                 {STRATEGIES[n].short}
</th>
             ))}
<th style={{ padding: "0 4px 6px 8px", textAlign: "center",
               color: T.muted, fontSize: 9, verticalAlign: "bottom" }}>TOTAL</th>
</tr>
</thead>
<tbody>
           {NAMES.map(n1 => (
<tr key={n1}>
<td style={{ padding: "2px 10px 2px 0", textAlign: "right",
                 color: T.p1, fontSize: 9, whiteSpace: "nowrap" }}>
                 {STRATEGIES[n1].short}
</td>
               {NAMES.map(n2 => {
                 const score = result.matrix[n1][n2];
                 const { bg, color } = cellColor(score);
                 return (
<td key={n2} style={{ padding: "5px 6px", textAlign: "center",
                     background: bg, color, borderRadius: 5, fontSize: 11,
                     fontWeight: n1 === n2 ? 700 : 400,
                     border: n1 === n2 ? `1px solid ${T.borderBright}` : "none" }}>
                     {score}
</td>
                 );
               })}
<td style={{ padding: "5px 6px 5px 10px", textAlign: "right",
                 color: T.text, fontSize: 12, fontWeight: 600 }}>
                 {result.totals[n1]}
</td>
</tr>
           ))}
</tbody>
</table>
</div>
</>
 )}
</div>

);
}
/* ─── Root App ──────────────────────────────────────────────────────── */
export default function App() {
const [tab, setTab] = useState("duel");
const [numRounds, setNumRounds] = useState(30);
return (
<div style={{ fontFamily: "‘Inter’,sans-serif", background: T.bg,
color: T.text, minHeight: "100vh" }}>
<style>{css}</style>

 {/* Header */}
<div style={{ background: `linear-gradient(135deg, #0A101E 0%, #101830 100%)`,
   borderBottom: `1px solid ${T.border}`, padding: "22px 28px" }}>
<div style={{ maxWidth: 900, margin: "0 auto" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
<div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0,
         background: "linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)",
         display: "flex", alignItems: "center", justifyContent: "center",
         fontSize: 16 }}>⚖</div>
<h1 className="heading" style={{ fontSize: 22, fontWeight: 700,
         color: "#F1F5F9", margin: 0 }}>Prisoner's Dilemma</h1>
<span style={{ fontSize: 13, color: T.muted }}>— Strategy Simulator</span>
</div>
<PayoffRef />
</div>
</div>
 {/* Nav */}
<div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 28px 0",
   display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
<div style={{ display: "flex", gap: 3, background: T.surface, padding: 3,
     borderRadius: 9, border: `1px solid ${T.border}` }}>
<button className={`tab ${tab === "duel" ? "tab-active" : "tab-inactive"}`}
       onClick={() => setTab("duel")}>⚔ Duel</button>
<button className={`tab ${tab === "tournament" ? "tab-active" : "tab-inactive"}`}
       onClick={() => setTab("tournament")}>🏆 Tournament</button>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
<span className="eyebrow" style={{ color: T.muted }}>Rounds:</span>
<select value={numRounds} onChange={e => setNumRounds(+e.target.value)}
       style={{ padding: "7px 28px 7px 10px" }}>
       {[10, 20, 30, 50, 100, 200].map(n => <option key={n}>{n}</option>)}
</select>
</div>
</div>
 {/* Main content */}
<div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 28px 48px" }}>
   {tab === "duel"
     ? <DuelView key={numRounds} numRounds={numRounds} />
     : <TournamentView key={numRounds} numRounds={numRounds} />}
</div>
</div>

);
}