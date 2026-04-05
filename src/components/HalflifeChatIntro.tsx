"use client";

import { useEffect, useState } from "react";

export default function HalflifeChatIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("halflife-onboarding-completed");
    const seen = localStorage.getItem("halflife-chat-intro-seen");
    if (onboarded && !seen) setShow(true);
  }, []);

  function close() {
    localStorage.setItem("halflife-chat-intro-seen", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,6,0.98)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ maxWidth: 360, width: "100%", background: "#0c0c0f", borderRadius: 24, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E8893C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "hlPulse 2s ease-in-out infinite" }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <style>{`@keyframes hlPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8ec", textAlign: "center", marginTop: 16 }}>Dein persoenlicher Companion</div>
        <div style={{ fontSize: 14, color: "#a0a0a8", textAlign: "center", lineHeight: 1.6, marginTop: 12 }}>halflife funktioniert anders als andere Apps. Statt Formulare auszufuellen, sprichst du einfach mit deinem Companion.</div>
        <div style={{ marginTop: 20 }}>
          {[
            { icon: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><path d="M12 19v4" /><path d="M8 23h8" /></>, text: "Sag was du gegessen hast — per Sprache, Text oder Foto" },
            { icon: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>, text: "Fotografiere deine Blutwerte — der AI liest sie aus" },
            { icon: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>, text: "Frag alles zu deinem Protokoll — dein Companion weiss Bescheid" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8893C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{f.icon}</svg>
              <div style={{ fontSize: 13, color: "#e8e8ec" }}>{f.text}</div>
            </div>
          ))}
        </div>
        <button onClick={close} style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 14, background: "#E8893C", color: "#050506", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer" }}>Verstanden, loslegen</button>
      </div>
    </div>
  );
}
