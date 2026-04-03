"use client";

import { Watch } from "lucide-react";
import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

const WEARABLES = [
  { id: "oura", name: "Oura Ring", desc: "Schlaf, HRV, Readiness, Aktivitaet", available: true },
  { id: "apple", name: "Apple Watch", desc: "Bald verfuegbar", available: false },
  { id: "whoop", name: "WHOOP", desc: "Bald verfuegbar", available: false },
  { id: "garmin", name: "Garmin", desc: "Bald verfuegbar", available: false },
];

export default function StepWearable({ answers, update, next }: Props) {
  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="h-full flex flex-col">
      <div className="relative h-[30%] overflow-hidden">
        <img src="/images/onboarding-wearable.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), var(--bg))" }} />
      </div>
      <div className="flex-1 px-5 -mt-6 relative z-10 overflow-y-auto">
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Wearable verbinden</h2>
        <p className="text-xs mt-1 mb-4" style={{ color: "var(--text3)" }}>Automatische Daten statt manueller Eingabe</p>

        <div className="flex flex-col gap-2.5">
          {WEARABLES.map((w) => (
            <button key={w.id} onClick={() => w.available && update({ wearable: w.id })} disabled={!w.available}
              className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
              style={{
                background: answers.wearable === w.id ? "rgba(126,226,184,0.1)" : "var(--subtle-bg)",
                border: answers.wearable === w.id ? "1.5px solid var(--accent)" : "1.5px solid var(--card-border)",
                opacity: w.available ? 1 : 0.4,
              }}>
              <Watch size={22} style={{ color: answers.wearable === w.id ? "var(--accent)" : "var(--text3)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{w.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text3)" }}>{w.desc}</p>
              </div>
            </button>
          ))}

          {answers.wearable === "oura" && (
            <div className="mt-2">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Oura Personal Access Token</label>
              <input value={answers.oura_token || ""} onChange={(e) => update({ oura_token: e.target.value })}
                placeholder="Token einfuegen..." className="w-full mt-1 px-4 py-3 rounded-xl text-sm border font-mono" style={inputStyle} />
              <p className="text-[10px] mt-1" style={{ color: "var(--text3)" }}>cloud.ouraring.com → Personal Access Token</p>
            </div>
          )}
        </div>

        <button onClick={next}
          className="w-full py-3.5 rounded-2xl text-sm font-bold mt-5 transition-all"
          style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
          {answers.wearable ? "Weiter" : "Ueberspringen"}
        </button>
      </div>
    </div>
  );
}
