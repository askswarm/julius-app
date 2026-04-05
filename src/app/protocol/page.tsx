"use client";

import { halflifeTheme as ht } from "@/lib/appConfig";

export default function ProtocolPage() {
  return (
    <div style={{ background: ht.bg, minHeight: "100vh", padding: "16px 16px 100px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginBottom: 20 }}>Protocol</h1>
      <div style={{ background: ht.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginBottom: 8 }}>TRT Schema</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: ht.text }}>120mg/Woche — Cypionate</div>
        <div style={{ fontSize: 13, color: ht.text2, marginTop: 4 }}>2x pro Woche · Mi + Sa · SubQ · 0.2ml</div>
        <div style={{ fontSize: 13, color: ht.accent, marginTop: 8 }}>Letzter Pin: Mittwoch, 02.04.</div>
        <button style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: `0.5px solid ${ht.accentBorder}`, background: ht.accentDim, color: ht.accent, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Injektion loggen</button>
      </div>
      <div style={{ background: ht.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginBottom: 8 }}>Injektions-Verlauf</div>
        {[{ d: "02.04.", dose: "60mg", site: "Oberschenkel L" }, { d: "30.03.", dose: "60mg", site: "Bauch R" }, { d: "26.03.", dose: "60mg", site: "Deltoid L" }].map((l) => (
          <div key={l.d} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${ht.border}` }}>
            <span style={{ fontSize: 13, color: ht.text2 }}>{l.d}</span>
            <span style={{ fontSize: 13, color: ht.text }}>{l.dose}</span>
            <span style={{ fontSize: 12, color: ht.text3 }}>{l.site}</span>
          </div>
        ))}
      </div>
      <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginBottom: 8 }}>Aktive Peptide</div>
        <div style={{ fontSize: 14, color: ht.text2 }}>Noch keine Peptide eingerichtet</div>
        <button style={{ marginTop: 12, padding: "8px 16px", borderRadius: 12, border: `0.5px solid ${ht.accentBorder}`, background: ht.accentDim, color: ht.accent, fontSize: 13, cursor: "pointer" }}>Peptid hinzufuegen</button>
      </div>
    </div>
  );
}
