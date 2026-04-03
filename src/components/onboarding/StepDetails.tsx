"use client";

import { Syringe, FlaskConical, Dumbbell, UtensilsCrossed, Hourglass } from "lucide-react";
import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props { answers: OnboardingAnswers; update: (p: Partial<OnboardingAnswers>) => void; next: () => void }

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
      style={{ background: active ? "var(--accent)" : "var(--subtle-bg)", color: active ? "#0D1117" : "var(--text3)", border: `1px solid ${active ? "var(--accent)" : "var(--card-border)"}` }}>
      {label}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all"
      style={{ background: active ? "rgba(126,226,184,0.15)" : "var(--subtle-bg)", color: active ? "var(--accent)" : "var(--text3)", border: `1px solid ${active ? "var(--accent)" : "var(--card-border)"}` }}>
      {label}
    </button>
  );
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function StepDetails({ answers, update, next }: Props) {
  const f = answers.focus;
  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="h-full flex flex-col px-5 pt-16 pb-4 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Deine Details</h2>

      {/* TRT */}
      {f.includes("trt") && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Syringe size={16} style={{ color: "#F97316" }} /><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>TRT Protokoll</span></div>
          <div className="flex gap-2 mb-3">
            {["Ja", "Geplant", "Nein"].map((v) => <Pill key={v} label={v} active={(v === "Ja" && answers.trt_active) || (v === "Nein" && !answers.trt_active)} onClick={() => update({ trt_active: v === "Ja" })} />)}
          </div>
          {answers.trt_active && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px]" style={{ color: "var(--text3)" }}>Dosis mg/Woche</label><input type="number" value={answers.trt_dose_mg} onChange={(e) => update({ trt_dose_mg: Number(e.target.value) })} className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} /></div>
                <div><label className="text-[10px]" style={{ color: "var(--text3)" }}>Konzentration mg/ml</label><input type="number" value={answers.trt_concentration} onChange={(e) => update({ trt_concentration: Number(e.target.value) })} className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} /></div>
              </div>
              <div className="flex gap-1.5 flex-wrap">{["1x", "2x", "3x", "EOD", "Taeglich"].map((v) => <Pill key={v} label={v} active={answers.trt_frequency === v} onClick={() => update({ trt_frequency: v })} />)}</div>
              <div className="flex gap-1.5 flex-wrap">{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => <Chip key={d} label={d} active={answers.trt_days.includes(d)} onClick={() => update({ trt_days: toggleArr(answers.trt_days, d) })} />)}</div>
              <div className="flex gap-2">{["SubQ", "IM"].map((m) => <Pill key={m} label={m} active={answers.trt_method === m} onClick={() => update({ trt_method: m })} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* Peptides */}
      {f.includes("peptides") && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><FlaskConical size={16} style={{ color: "#7EE2B8" }} /><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Peptide</span></div>
          <div className="flex gap-2 mb-3">
            {["Ja", "Interessiert", "Nein"].map((v) => <Pill key={v} label={v} active={(v === "Ja" && answers.peptides_active) || (v === "Nein" && !answers.peptides_active)} onClick={() => update({ peptides_active: v === "Ja" })} />)}
          </div>
          {answers.peptides_active && (
            <div className="flex flex-wrap gap-1.5">
              {["BPC-157", "TB-500", "GHK-Cu", "Epitalon", "CJC/Ipa", "Semaglutid", "NAD+", "PT-141"].map((p) => (
                <Chip key={p} label={p} active={answers.peptides_selected.includes(p)} onClick={() => update({ peptides_selected: toggleArr(answers.peptides_selected, p) })} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training */}
      {f.includes("training") && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Dumbbell size={16} style={{ color: "#F97316" }} /><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Training</span></div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {["Anfaenger", "Fortgeschritten", "Profi"].map((v) => <Pill key={v} label={v} active={answers.training_experience === v} onClick={() => update({ training_experience: v })} />)}
          </div>
          <p className="text-[10px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Equipment</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {["Gym", "Home Gym", "Bodyweight", "Outdoor", "Pool"].map((e) => <Chip key={e} label={e} active={answers.training_equipment.includes(e)} onClick={() => update({ training_equipment: toggleArr(answers.training_equipment, e) })} />)}
          </div>
          <p className="text-[10px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Tage pro Woche: {answers.training_days}</p>
          <input type="range" min={1} max={7} value={answers.training_days} onChange={(e) => update({ training_days: Number(e.target.value) })}
            className="w-full" style={{ accentColor: "var(--accent)" }} />
          <p className="text-[10px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Ziel</p>
          <div className="flex gap-1.5 flex-wrap">
            {["Muskelaufbau", "Fettabbau", "Ausdauer", "HYROX", "Allgemein"].map((g) => <Pill key={g} label={g} active={answers.training_goal === g} onClick={() => update({ training_goal: g })} />)}
          </div>
        </div>
      )}

      {/* Nutrition */}
      {f.includes("nutrition") && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><UtensilsCrossed size={16} style={{ color: "#10B981" }} /><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Ernaehrung</span></div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {["Keine Praeferenz", "Mediterran", "Low Carb", "Keto", "Vegan", "Vegetarisch"].map((s) => <Pill key={s} label={s} active={answers.nutrition_style === s} onClick={() => update({ nutrition_style: s })} />)}
          </div>
          <p className="text-[10px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Allergien</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {["Gluten", "Laktose", "Nuesse", "Soja", "Fisch", "Keine"].map((a) => <Chip key={a} label={a} active={answers.nutrition_allergies.includes(a)} onClick={() => update({ nutrition_allergies: toggleArr(answers.nutrition_allergies, a) })} />)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm" style={{ color: "var(--text)" }}>Intervallfasten</span>
            <button onClick={() => update({ nutrition_fasting: !answers.nutrition_fasting })}
              className={`w-11 h-6 rounded-full transition-colors ${answers.nutrition_fasting ? "bg-emerald-500" : "bg-slate-400"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${answers.nutrition_fasting ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      )}

      {/* Longevity */}
      {f.includes("longevity") && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3"><Hourglass size={16} style={{ color: "#7EE2B8" }} /><span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Longevity Stack</span></div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {["Einsteiger", "Fortgeschritten", "10+ Supplements"].map((v) => <Pill key={v} label={v} active={answers.longevity_experience === v} onClick={() => update({ longevity_experience: v })} />)}
          </div>
          <p className="text-[10px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Aktueller Stack</p>
          <div className="flex flex-wrap gap-1.5">
            {["Omega-3", "Vitamin D", "Magnesium", "Kreatin", "NAC", "Glycin", "Ashwagandha", "Q10", "B-Komplex", "Zink", "Spermidin", "Taurin", "EAA", "Vitamin C", "Kollagen"].map((s) => (
              <Chip key={s} label={s} active={answers.longevity_stack.includes(s)} onClick={() => update({ longevity_stack: toggleArr(answers.longevity_stack, s) })} />
            ))}
          </div>
        </div>
      )}

      <button onClick={next} className="w-full py-3.5 rounded-2xl text-sm font-bold mt-2 mb-4"
        style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
        Weiter
      </button>
    </div>
  );
}
