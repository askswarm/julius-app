"use client";

import { halflifeTheme as ht } from "@/lib/appConfig";
import { useRouter } from "next/navigation";

const SLOTS = [
  { time: "07:00", label: "Nuechtern", supps: ["Spermidin", "NAC 600mg", "Taurin 1.5g"], done: true },
  { time: "09:00", label: "Fruehstueck", supps: ["D3+K2 10k", "Omega-3", "B-Komplex", "Ubiquinol", "Zink 30mg"], done: true },
  { time: "11:30", label: "Pre-Workout", supps: ["Citrullin", "Glutamin", "EAA"], done: true },
  { time: "13:00", label: "Mittag", supps: ["Selen + Vitamin C"], done: false },
  { time: "19:00", label: "Abend", supps: ["Magnesium", "Ashwagandha", "Glycin 3g", "Kupfer"], done: false },
];

export default function StackPage() {
  const router = useRouter();
  return (
    <div style={{ background: ht.bg, minHeight: "100vh", padding: "16px 16px 100px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginBottom: 20 }}>Stack</h1>
      {SLOTS.map((s) => (
        <div key={s.time} style={{ marginBottom: 16, paddingLeft: 20, borderLeft: `1px solid ${s.done ? ht.accent : "#1a1a1e"}`, position: "relative" as const }}>
          <div style={{ position: "absolute" as const, left: -4, top: 2, width: 8, height: 8, borderRadius: "50%", background: s.done ? ht.accent : "#1a1a1e" }} />
          <div style={{ fontSize: 13, color: s.done ? ht.accent : ht.text3, fontWeight: 500 }}>{s.time} {s.label}</div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 6 }}>
            {s.supps.map((sp) => (
              <span key={sp} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: s.done ? "rgba(232,137,60,0.06)" : ht.card, border: `0.5px solid ${s.done ? "rgba(232,137,60,0.15)" : "#1a1a1e"}`, color: s.done ? ht.accent : ht.text2 }}>{sp}</span>
            ))}
          </div>
        </div>
      ))}
      <button style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 12, border: `0.5px solid ${ht.accentBorder}`, background: ht.accentDim, color: ht.accent, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Supplement hinzufuegen</button>
      <div onClick={() => router.push("/coach?prompt=" + encodeURIComponent("Ich moechte ein neues Supplement hinzufuegen"))} style={{ fontSize: 11, color: ht.accent, textDecoration: "underline", cursor: "pointer", textAlign: "center" as const, marginTop: 8 }}>oder per Chat eingeben</div>
      <div style={{ fontSize: 10, color: "#3a3a42", textAlign: "center" as const, padding: 16, marginTop: "auto" }}>halflife ersetzt keine aerztliche Beratung. Besprich Aenderungen an deinem Protokoll immer mit deinem Arzt.</div>
    </div>
  );
}
