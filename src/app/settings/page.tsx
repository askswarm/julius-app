"use client";

import { useState } from "react";
import { halflifeTheme as ht } from "@/lib/appConfig";
import Link from "next/link";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: on ? ht.accent : "#1a1a1e", position: "relative" as const, border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute" as const, top: 2, left: on ? 22 : 2, transition: "left 0.2s" }} />
    </button>
  );
}

function Row({ label, right, danger }: { label: string; right?: string; danger?: boolean }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: "0.5px solid #111114", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, color: danger ? "#e05050" : ht.text }}>{label}</span>
      <span style={{ fontSize: 14, color: "#3a3a42" }}>{right || "›"}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({ supps: true, trt: true, peptides: true, blood: true });

  function toggle(key: keyof typeof notifs) {
    setNotifs((p) => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem("halflife-notification-prefs", JSON.stringify(next));
      return next;
    });
  }

  return (
    <div style={{ background: ht.bg, minHeight: "100vh", padding: "16px 16px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/" style={{ color: ht.text3, textDecoration: "none", fontSize: 20 }}>←</Link>
        <span style={{ fontSize: 18, fontWeight: 600, color: ht.text }}>Settings</span>
      </div>

      {/* Profile */}
      <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${ht.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: ht.accent }}>VB</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginTop: 10 }}>Vincent</div>
        <div style={{ fontSize: 13, color: ht.text2, marginTop: 2 }}>Seit Maerz 2024 auf TRT</div>
        <div style={{ fontSize: 12, color: ht.text3, marginTop: 4 }}>120mg/Woche · 14 Supplements · 0 Peptide</div>
      </div>

      {/* Notifications */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginTop: 24, marginBottom: 8 }}>Notifications</div>
      {([["Supplement-Erinnerungen", "supps"], ["TRT-Erinnerungen", "trt"], ["Peptid-Erinnerungen", "peptides"], ["Blutwerte-Erinnerungen", "blood"]] as const).map(([label, key]) => (
        <div key={key} style={{ padding: "14px 0", borderBottom: "0.5px solid #111114", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: ht.text }}>{label}</span>
          <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
        </div>
      ))}

      {/* Protocol */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginTop: 24, marginBottom: 8 }}>Protocol</div>
      <Row label="Supplement-Zeiten aendern" />
      <Row label="Injektionstage aendern" />
      <Row label="TRT-Schema bearbeiten" />

      {/* Data */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginTop: 24, marginBottom: 8 }}>Data</div>
      <Row label="Blutwerte exportieren" />
      <Row label="Protokoll-Historie" />
      <Row label="Alle Daten loeschen" danger />

      {/* Legal */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: ht.text3, textTransform: "uppercase" as const, marginTop: 24, marginBottom: 8 }}>Legal</div>
      <Row label="Disclaimer erneut lesen" />
      <Row label="Datenschutzerklaerung" />
      <Row label="Impressum" />
      <Row label="App-Version" right="0.1.0" />
    </div>
  );
}
