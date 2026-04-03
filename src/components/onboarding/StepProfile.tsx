"use client";

import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

export default function StepProfile({ answers, update, next }: Props) {
  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };
  const valid = answers.name.trim() && answers.gender;

  return (
    <div className="h-full flex flex-col">
      <div className="relative h-[30%] overflow-hidden">
        <img src="/images/onboarding-profile.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), var(--bg))" }} />
      </div>
      <div className="flex-1 px-5 -mt-6 relative z-10 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Ueber dich</h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Name</label>
            <input value={answers.name} onChange={(e) => update({ name: e.target.value })} placeholder="Dein Name"
              className="w-full mt-1 px-4 py-3 rounded-xl text-sm border" style={inputStyle} />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Geschlecht</label>
            <div className="flex gap-2 mt-1">
              {[{ v: "M", l: "Maennlich" }, { v: "F", l: "Weiblich" }].map((g) => (
                <button key={g.v} onClick={() => update({ gender: g.v })}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: answers.gender === g.v ? "var(--accent)" : "var(--subtle-bg)",
                    color: answers.gender === g.v ? "#0D1117" : "var(--text3)",
                    border: `1.5px solid ${answers.gender === g.v ? "var(--accent)" : "var(--card-border)"}`,
                  }}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Geburtsdatum</label>
            <input type="date" value={answers.birthdate} onChange={(e) => update({ birthdate: e.target.value })}
              className="w-full mt-1 px-4 py-3 rounded-xl text-sm border" style={inputStyle} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Groesse cm</label>
              <input type="number" value={answers.height_cm} onChange={(e) => update({ height_cm: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-3 rounded-xl text-sm border text-center" style={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Gewicht kg</label>
              <input type="number" step="0.1" value={answers.weight_kg} onChange={(e) => update({ weight_kg: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-3 rounded-xl text-sm border text-center" style={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Ziel kg</label>
              <input type="number" step="0.1" value={answers.target_weight_kg || ""} placeholder="—"
                onChange={(e) => update({ target_weight_kg: e.target.value ? Number(e.target.value) : null })}
                className="w-full mt-1 px-3 py-3 rounded-xl text-sm border text-center" style={inputStyle} />
            </div>
          </div>
        </div>

        <button onClick={next} disabled={!valid}
          className="w-full py-3.5 rounded-2xl text-sm font-bold mt-5 mb-4 transition-all"
          style={{ background: valid ? "var(--grad-teal)" : "var(--bar-bg)", color: "#0D1117" }}>
          Weiter
        </button>
      </div>
    </div>
  );
}
