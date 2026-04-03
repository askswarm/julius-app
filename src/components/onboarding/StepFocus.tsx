"use client";

import { Syringe, FlaskConical, Dumbbell, UtensilsCrossed, Hourglass, Check } from "lucide-react";
import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

const FOCUS_OPTIONS = [
  { id: "trt", icon: Syringe, title: "TRT + Hormone", desc: "Injektionen, Blutwerte, Dosis-Tracking" },
  { id: "peptides", icon: FlaskConical, title: "Peptide + Biohacking", desc: "Zyklen, Vials, Stacking, Longevity" },
  { id: "training", icon: Dumbbell, title: "Training + Fitness", desc: "Kraft, HYROX, Cardio, GPS-Tracking" },
  { id: "nutrition", icon: UtensilsCrossed, title: "Ernaehrung + Familie", desc: "Makros, Wochenplan, Meal Tracking" },
  { id: "longevity", icon: Hourglass, title: "Longevity + Supplements", desc: "Stack-Optimierung, Autophagie, Anti-Aging" },
];

export default function StepFocus({ answers, update, next }: Props) {
  function toggle(id: string) {
    const f = answers.focus.includes(id) ? answers.focus.filter((x) => x !== id) : [...answers.focus, id];
    update({ focus: f });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative h-[35%] overflow-hidden">
        <img src="/images/onboarding-focus.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,17,23,0.3), var(--bg))" }} />
      </div>
      <div className="flex-1 px-5 -mt-8 relative z-10">
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Was ist dir am wichtigsten?</h2>
        <p className="text-xs mt-1 mb-4" style={{ color: "var(--text3)" }}>Waehle einen oder mehrere Bereiche</p>

        <div className="flex flex-col gap-2.5">
          {FOCUS_OPTIONS.map((o) => {
            const active = answers.focus.includes(o.id);
            return (
              <button key={o.id} onClick={() => toggle(o.id)}
                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: active ? "rgba(126,226,184,0.1)" : "var(--subtle-bg)",
                  border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--card-border)",
                }}>
                <o.icon size={22} style={{ color: active ? "var(--accent)" : "var(--text3)", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{o.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text3)" }}>{o.desc}</p>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? "var(--accent)" : "var(--subtle-bg)", border: active ? "none" : "1.5px solid var(--card-border)" }}>
                  {active && <Check size={14} style={{ color: "#0D1117" }} />}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={next} disabled={answers.focus.length === 0}
          className="w-full py-3.5 rounded-2xl text-sm font-bold mt-5 transition-all"
          style={{ background: answers.focus.length > 0 ? "var(--grad-teal)" : "var(--bar-bg)", color: "#0D1117" }}>
          Weiter
        </button>
      </div>
    </div>
  );
}
