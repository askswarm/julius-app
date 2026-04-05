"use client";

import { useState } from "react";

interface Props {
  current: number;
  goal?: number;
  onAdd: (ml: number) => void;
}

export default function WaterGlass({ current, goal = 3000, onAdd }: Props) {
  const [tapScale, setTapScale] = useState(1);
  const fillPct = Math.min((current / goal) * 100, 100);
  const showWave = current > 0 && current < goal;

  function handleTap() {
    onAdd(250);
    setTapScale(1.05);
    setTimeout(() => setTapScale(1), 150);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
      <style>{`
        @keyframes hlWave { 0% { transform: translateX(-50%) } 100% { transform: translateX(0%) } }
      `}</style>
      <div
        onClick={handleTap}
        style={{
          width: 64, height: 88, position: "relative" as const, cursor: "pointer",
          transform: `scale(${tapScale})`, transition: "transform 0.15s ease",
        }}
      >
        {/* Glass outline */}
        <div style={{
          position: "absolute" as const, inset: 0,
          border: "2px solid rgba(255,255,255,0.1)", borderTop: "none",
          borderRadius: "0 0 16px 16px", overflow: "hidden",
        }}>
          {/* Fill level */}
          <div style={{
            position: "absolute" as const, bottom: 0, left: 0, right: 0,
            height: `${fillPct}%`, maxHeight: "100%",
            background: "linear-gradient(180deg, #60A5FA, #3B82F6)",
            borderRadius: "0 0 14px 14px",
            transition: "height 0.6s ease",
          }}>
            {/* Wave */}
            {showWave && (
              <div style={{
                position: "absolute" as const, top: -3, left: 0, width: "200%", height: 6,
                background: "linear-gradient(180deg, #60A5FA, #3B82F6)",
                borderRadius: "40% 60% 50% 40% / 60% 40% 60% 40%",
                animation: "hlWave 3s infinite linear",
              }} />
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#a0a0a8" }}>{(current / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L</div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#5a5a62", textTransform: "uppercase" as const }}>Wasser</div>
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        {[250, 500].map((ml) => (
          <button key={ml} onClick={() => onAdd(ml)} style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 8,
            background: "rgba(96,165,250,0.08)", border: "0.5px solid rgba(96,165,250,0.2)",
            color: "#60A5FA", cursor: "pointer",
          }}>+{ml}ml</button>
        ))}
      </div>
    </div>
  );
}
