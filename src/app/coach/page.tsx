"use client";

import { useState } from "react";
import { halflifeTheme as ht } from "@/lib/appConfig";

export default function CoachPage() {
  const [input, setInput] = useState("");

  return (
    <div style={{ background: ht.bg, minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginBottom: 4 }}>Coach</h1>
        <div style={{ fontSize: 11, color: ht.text3, marginBottom: 16 }}>Bildungs- und Tracking-Tool. Kein Medizinprodukt.</div>
      </div>
      <div style={{ flex: 1, padding: "0 16px", overflowY: "auto" as const }}>
        <div style={{ background: ht.card, borderRadius: "16px 16px 16px 4px", padding: "12px 14px", maxWidth: "85%", marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: "#c8c8d0", lineHeight: 1.55 }}>Hey! Ich bin dein Halflife Companion. Ich zeige dir Zusammenhaenge in deinen Daten, beantworte Fragen zu Protokollen und Supplements, und verweise auf relevante Literatur. Was moechtest du wissen?</div>
        </div>
      </div>
      <div style={{ padding: "8px 16px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", background: "linear-gradient(transparent, #050506 30%)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: ht.card, borderRadius: 24, padding: "8px 14px", border: `0.5px solid ${ht.border}` }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Frag mich etwas..."
            style={{ flex: 1, background: "transparent", border: "none", color: ht.text, fontSize: 14, outline: "none" }} />
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: ht.accentDim, border: `0.5px solid ${ht.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ht.accent} strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
