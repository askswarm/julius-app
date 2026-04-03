"use client";

import { ChevronRight, Check } from "lucide-react";
import type { OnboardingAnswers } from "@/app/onboarding/page";

interface Props {
  answers: OnboardingAnswers;
  update: (p: Partial<OnboardingAnswers>) => void;
  next: () => void;
  goTo: (step: number) => void;
  onFinish: () => void;
  saving: boolean;
}

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full py-3 text-left"
      style={{ borderBottom: "1px solid var(--card-border)" }}>
      <div>
        <p className="text-xs" style={{ color: "var(--text3)" }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{value}</p>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text3)" }} />
    </button>
  );
}

export default function StepSummary({ answers, goTo, onFinish, saving }: Props) {
  return (
    <div className="h-full flex flex-col px-5 pt-16 pb-4 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--grad-teal)" }}>
          <Check size={24} style={{ color: "#0D1117" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Alles bereit, {answers.name || "User"}!</h2>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Pruefe deine Angaben</p>
        </div>
      </div>

      <div className="rounded-2xl px-4 py-2" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <Row label="Fokus" value={answers.focus.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(", ") || "—"} onClick={() => goTo(2)} />
        <Row label="Profil" value={`${answers.name}, ${answers.gender === "M" ? "M" : "F"}, ${answers.height_cm}cm, ${answers.weight_kg}kg`} onClick={() => goTo(3)} />
        <Row label="Wearable" value={answers.wearable === "oura" ? (answers.oura_token ? "Oura verbunden" : "Oura (kein Token)") : "Nicht verbunden"} onClick={() => goTo(4)} />

        {answers.focus.includes("trt") && (
          <Row label="TRT" value={answers.trt_active ? `${answers.trt_dose_mg}mg/Woche, ${answers.trt_frequency}, ${answers.trt_method}` : "Nicht aktiv"} onClick={() => goTo(5)} />
        )}
        {answers.focus.includes("peptides") && (
          <Row label="Peptide" value={answers.peptides_active ? answers.peptides_selected.join(", ") || "Aktiv" : "Nicht aktiv"} onClick={() => goTo(5)} />
        )}
        {answers.focus.includes("training") && (
          <Row label="Training" value={`${answers.training_experience || "—"}, ${answers.training_days}x/Woche`} onClick={() => goTo(5)} />
        )}
        {answers.focus.includes("nutrition") && (
          <Row label="Ernaehrung" value={answers.nutrition_style || "Keine Praeferenz"} onClick={() => goTo(5)} />
        )}
        {answers.focus.includes("longevity") && (
          <Row label="Longevity" value={`${answers.longevity_stack.length} Supplements`} onClick={() => goTo(5)} />
        )}

        <Row label="Benachrichtigungen" value={{ all: "Alles an", important: "Nur wichtiges", morning: "Nur morgens", off: "Aus" }[answers.notifications] || "—"} onClick={() => goTo(6)} />
      </div>

      <button onClick={onFinish} disabled={saving}
        className="w-full py-4 rounded-2xl text-base font-bold mt-6 transition-all"
        style={{ background: saving ? "var(--bar-bg)" : "var(--grad-teal)", color: "#0D1117", height: 56 }}>
        {saving ? "Wird eingerichtet..." : "Julius starten"}
      </button>
    </div>
  );
}
