"use client";

import { halflifeTheme as ht } from "@/lib/appConfig";

export default function BloodPage() {
  return (
    <div style={{ background: ht.bg, minHeight: "100vh", padding: "16px 16px 100px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginBottom: 20 }}>Bloodwork</h1>
      <div style={{ background: ht.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginBottom: 12 }}>Letzte Werte — 15.03.2026</div>
        {[
          { n: "Total T", v: "847 ng/dL", c: "#34d399" }, { n: "Free T", v: "22.4 pg/mL", c: "#34d399" },
          { n: "Haematokrit", v: "51.8%", c: "#E8893C" }, { n: "Oestradiol", v: "31 pg/mL", c: "#34d399" },
          { n: "PSA", v: "0.8 ng/mL", c: "#34d399" }, { n: "SHBG", v: "32 nmol/L", c: "#34d399" },
          { n: "LH", v: "0.1 mIU/mL", c: ht.text3 }, { n: "Vitamin D", v: "62 ng/mL", c: "#34d399" },
          { n: "TSH", v: "1.8 mIU/L", c: "#34d399" }, { n: "Ferritin", v: "85 ng/mL", c: "#34d399" },
        ].map((m) => (
          <div key={m.n} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${ht.border}` }}>
            <span style={{ fontSize: 13, color: ht.text2 }}>{m.n}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: m.c }}>{m.v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button style={{ padding: 12, borderRadius: 12, border: `0.5px solid ${ht.accentBorder}`, background: ht.accentDim, color: ht.accent, fontSize: 13, cursor: "pointer" }}>Foto scannen</button>
        <button style={{ padding: 12, borderRadius: 12, border: `0.5px solid ${ht.border}`, background: ht.card, color: ht.text2, fontSize: 13, cursor: "pointer" }}>Manuell eingeben</button>
      </div>
    </div>
  );
}
