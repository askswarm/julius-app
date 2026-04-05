"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Msg { role: "bot" | "user"; text: string; card?: Record<string, string>; finish?: boolean }

const FOCUS = ["TRT Tracking", "Peptide", "Supplement Stack", "Blutwerte", "Longevity"];
const COMPOUNDS = ["Test Cypionate", "Test Enanthate", "Sustanon", "Undecanoat", "Kein TRT"];
const DOSES = ["80mg", "100mg", "120mg", "150mg", "200mg", "Andere"];
const FREQS = ["1x", "2x", "3x", "EOD", "Taeglich"];
const WEARABLES = ["Oura Ring", "Apple Watch", "Whoop", "Garmin", "Keins"];

export default function OnboardingPage() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, unknown>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem("halflife-onboarding-completed")) { router.replace("/"); return; }
    addBot("Was bringt dich zu halflife?");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  function addBot(text: string, extra?: Partial<Msg>) {
    setMsgs((p) => [...p, { role: "bot", text, ...extra }]);
    setSel([]);
  }
  function addUser(text: string) { setMsgs((p) => [...p, { role: "user", text }]); }

  function toggleChip(c: string) {
    const multi = step === 0;
    if (multi) setSel((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
    else setSel([c]);
  }

  function confirm() {
    if (sel.length === 0) return;

    if (step === 0) {
      setData((d) => ({ ...d, focus: sel }));
      addUser(sel.join(", "));
      setTimeout(() => { addBot("Welcher TRT-Wirkstoff?"); setStep(1); }, 400);
    } else if (step === 1) {
      setData((d) => ({ ...d, compound: sel[0] }));
      addUser(sel[0]);
      if (sel[0] === "Kein TRT") { setTimeout(() => { addBot("Nutzt du ein Wearable?"); setStep(5); }, 400); }
      else { setTimeout(() => { addBot("Welche Wochendosis?"); setStep(2); }, 400); }
    } else if (step === 2) {
      setData((d) => ({ ...d, dose: sel[0] }));
      addUser(sel[0]);
      setTimeout(() => { addBot("Wie oft pro Woche?"); setStep(3); }, 400);
    } else if (step === 3) {
      const freq = sel[0]; const dose = data.dose as string;
      const freqNum = freq === "EOD" ? 3.5 : freq === "Taeglich" ? 7 : parseInt(freq);
      const doseNum = parseInt(dose);
      const perInj = freqNum > 0 ? Math.round(doseNum / freqNum) : doseNum;
      setData((d) => ({ ...d, frequency: freq }));
      addUser(freq);
      setTimeout(() => {
        addBot("So hab ich es verstanden:", {
          card: { Wirkstoff: data.compound as string, Wochendosis: dose, Frequenz: freq, Einzeldosis: `${perInj}mg` },
        });
        setStep(4);
      }, 400);
    } else if (step === 5) {
      setData((d) => ({ ...d, wearable: sel[0] }));
      addUser(sel[0]);
      setTimeout(() => {
        const summary: Record<string, string> = {};
        if (data.focus) summary["Fokus"] = (data.focus as string[]).join(", ");
        if (data.compound && data.compound !== "Kein TRT") summary["TRT"] = `${data.compound}, ${data.dose}, ${data.frequency}`;
        summary["Wearable"] = sel[0];
        addBot("Dein Protokoll ist eingerichtet!", { card: summary, finish: true });
        setStep(6);
      }, 400);
    }
  }

  function confirmCard() {
    if (step === 4) {
      addUser("Stimmt so");
      setTimeout(() => { addBot("Nutzt du ein Wearable?"); setStep(5); }, 400);
    }
  }

  function finish() {
    localStorage.setItem("halflife-onboarding-completed", "true");
    localStorage.setItem("halflife-protocol", JSON.stringify(data));
    router.push("/");
  }

  const chips = step === 0 ? FOCUS : step === 1 ? COMPOUNDS : step === 2 ? DOSES : step === 3 ? FREQS : step === 5 ? WEARABLES : [];
  const phase = step <= 1 ? 1 : step <= 4 ? 2 : step === 5 ? 3 : 4;

  return (
    <div style={{ background: "#050506", minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", textAlign: "center" as const }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8ec", letterSpacing: -0.5 }}>halflife<span style={{ color: "#E8893C", fontWeight: 300 }}>.</span></div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 12 }}>
          {[1, 2, 3, 4].map((p) => (
            <div key={p} style={{ width: "22%", height: 3, borderRadius: 2, background: p < phase ? "#E8893C" : p === phase ? "rgba(232,137,60,0.4)" : "#1a1a1e" }} />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "16px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{
              background: m.role === "bot" ? "#111114" : "rgba(232,137,60,0.1)",
              borderRadius: m.role === "bot" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
              padding: "12px 14px", maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : 0,
              fontSize: 14, color: m.role === "bot" ? "#c8c8d0" : "#E8893C", lineHeight: 1.5,
            }}>
              {m.text}
            </div>
            {m.card && (
              <div style={{ background: "#0f1a16", border: "0.5px solid #1a2e24", borderRadius: 12, padding: 12, marginTop: 8, maxWidth: "85%" }}>
                {Object.entries(m.card).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 11, color: "#5a5a62" }}>{k}</span>
                    <span style={{ fontSize: 11, color: "#E8893C", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                {!m.finish && step === 4 && i === msgs.length - 1 && (
                  <button onClick={confirmCard} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 12, border: "0.5px solid rgba(232,137,60,0.3)", background: "rgba(232,137,60,0.08)", color: "#E8893C", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Stimmt so</button>
                )}
                {m.finish && (
                  <button onClick={finish} style={{ width: "100%", marginTop: 16, padding: 14, borderRadius: 14, background: "#E8893C", color: "#050506", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer" }}>Los geht&apos;s</button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Chips */}
        {chips.length > 0 && step !== 4 && step !== 6 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {chips.map((c) => {
                const active = sel.includes(c);
                return (
                  <button key={c} onClick={() => toggleChip(c)} style={{
                    fontSize: 12, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                    border: `0.5px solid ${active ? "rgba(232,137,60,0.4)" : "#1a1a1e"}`,
                    background: active ? "rgba(232,137,60,0.06)" : "#111114",
                    color: active ? "#E8893C" : "#a8a8b0",
                  }}>{c}</button>
                );
              })}
            </div>
            {sel.length > 0 && (
              <button onClick={confirm} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 20, background: "rgba(232,137,60,0.1)", border: "0.5px solid rgba(232,137,60,0.2)", color: "#E8893C", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Weiter
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
