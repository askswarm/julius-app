"use client";

import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

export default function StepWelcome({ answers, update, next }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 splash-gradient">
      {/* Logo */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold"
        style={{ background: "linear-gradient(135deg, #2EA67A, #7EE2B8)", color: "#0D1117", boxShadow: "0 0 40px rgba(126,226,184,0.3)" }}>
        J
      </div>
      <p className="text-3xl font-bold mt-5" style={{ color: "#E6EDF3", letterSpacing: 2 }}>Julius</p>
      <p className="text-sm mt-2 uppercase" style={{ color: "#7EE2B8", letterSpacing: 3 }}>Your Protocol Coach</p>

      {/* Language */}
      <div className="flex gap-3 mt-12">
        {[{ code: "de", label: "DE Deutsch" }, { code: "en", label: "EN English" }].map((l) => (
          <button key={l.code} onClick={() => update({ language: l.code })}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              border: answers.language === l.code ? "1.5px solid #7EE2B8" : "1.5px solid rgba(255,255,255,0.15)",
              color: answers.language === l.code ? "#7EE2B8" : "rgba(255,255,255,0.6)",
              background: answers.language === l.code ? "rgba(126,226,184,0.08)" : "transparent",
              width: 140,
            }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button onClick={next} disabled={!answers.language}
        className="mt-10 w-full max-w-xs py-4 rounded-2xl text-base font-bold transition-all"
        style={{ background: answers.language ? "linear-gradient(135deg, #2EA67A, #7EE2B8)" : "rgba(255,255,255,0.1)", color: "#0D1117" }}>
        Los geht&apos;s
      </button>
    </div>
  );
}
