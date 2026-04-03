"use client";

import { Bell, BellRing, Clock, BellOff, Check } from "lucide-react";
import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

const OPTIONS = [
  { id: "all", icon: BellRing, title: "Alles an", desc: "Morgens, Mittags, Abends, Training, Gesundheit", badge: "Empfohlen" },
  { id: "important", icon: Bell, title: "Nur wichtiges", desc: "Schlaf-Warnung, TRT/Peptide-Reminder, Uebertraining", badge: null },
  { id: "morning", icon: Clock, title: "Nur morgens", desc: "Oura-Summary + Supplement-Reminder", badge: null },
  { id: "off", icon: BellOff, title: "Aus", desc: "Keine Benachrichtigungen", badge: null },
];

export default function StepNotifications({ answers, update, next }: Props) {
  async function handleNext() {
    if (answers.notifications !== "off" && typeof Notification !== "undefined") {
      await Notification.requestPermission().catch(() => {});
    }
    next();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative h-[30%] overflow-hidden">
        <img src="/images/onboarding-notify.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), var(--bg))" }} />
      </div>
      <div className="flex-1 px-5 -mt-6 relative z-10">
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Bleib auf Kurs</h2>
        <p className="text-xs mt-1 mb-4" style={{ color: "var(--text3)" }}>Julius erinnert dich zur richtigen Zeit</p>

        <div className="flex flex-col gap-2.5">
          {OPTIONS.map((o) => {
            const active = answers.notifications === o.id;
            return (
              <button key={o.id} onClick={() => update({ notifications: o.id })}
                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{ background: active ? "rgba(126,226,184,0.1)" : "var(--subtle-bg)", border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--card-border)" }}>
                <o.icon size={22} style={{ color: active ? "var(--accent)" : "var(--text3)", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{o.title}</p>
                    {o.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(126,226,184,0.15)", color: "var(--accent)" }}>{o.badge}</span>}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text3)" }}>{o.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? "var(--accent)" : "transparent", border: active ? "none" : "1.5px solid var(--card-border)" }}>
                  {active && <Check size={12} style={{ color: "#0D1117" }} />}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={handleNext}
          className="w-full py-3.5 rounded-2xl text-sm font-bold mt-5"
          style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
          Weiter
        </button>
      </div>
    </div>
  );
}
