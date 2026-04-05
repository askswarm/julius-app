"use client";

import { useState, useEffect } from "react";

export default function HalflifeDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("halflife-disclaimer-accepted")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,5,6,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 340, width: "100%", background: "#0c0c0f", borderRadius: 20, padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#e8e8ec", letterSpacing: -0.5, marginBottom: 16 }}>
          halflife<span style={{ color: "#E8893C", fontWeight: 300 }}>.</span>
        </div>
        <p style={{ fontSize: 13, color: "#a0a0a8", lineHeight: 1.6, marginBottom: 24 }}>
          Halflife ist ein persoenliches Tracking- und Bildungstool fuer die Dokumentation von Protokollen, Supplements und Blutwerten.
          Halflife ist kein Medizinprodukt und ersetzt keine aerztliche Beratung, Diagnose oder Behandlung.
          Besprich Protokoll-Aenderungen immer mit deinem behandelnden Arzt.
        </p>
        <button
          onClick={() => { localStorage.setItem("halflife-disclaimer-accepted", "true"); setShow(false); }}
          style={{ width: "100%", padding: 14, borderRadius: 14, background: "#E8893C", color: "#050506", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer" }}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
