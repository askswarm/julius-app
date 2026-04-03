"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import StepWelcome from "@/components/onboarding/StepWelcome";
import StepFocus from "@/components/onboarding/StepFocus";
import StepProfile from "@/components/onboarding/StepProfile";
import StepWearable from "@/components/onboarding/StepWearable";
import StepDetails from "@/components/onboarding/StepDetails";
import StepNotifications from "@/components/onboarding/StepNotifications";
import StepSummary from "@/components/onboarding/StepSummary";

export interface OnboardingAnswers {
  language: string;
  focus: string[];
  name: string;
  birthdate: string;
  gender: string;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number | null;
  wearable: string | null;
  oura_token: string | null;
  trt_active: boolean;
  trt_dose_mg: number;
  trt_frequency: string;
  trt_days: string[];
  trt_concentration: number;
  trt_method: string;
  peptides_active: boolean;
  peptides_selected: string[];
  training_experience: string;
  training_equipment: string[];
  training_sports: string[];
  training_days: number;
  training_goal: string;
  nutrition_style: string;
  nutrition_allergies: string[];
  nutrition_fasting: boolean;
  nutrition_window_start: string;
  nutrition_window_end: string;
  longevity_experience: string;
  longevity_stack: string[];
  longevity_bloodwork: boolean;
  notifications: string;
}

const INITIAL: OnboardingAnswers = {
  language: "de", focus: [], name: "", birthdate: "", gender: "", height_cm: 175, weight_kg: 75, target_weight_kg: null,
  wearable: null, oura_token: null,
  trt_active: false, trt_dose_mg: 120, trt_frequency: "2x_week", trt_days: ["Mi", "Sa"], trt_concentration: 300, trt_method: "SubQ",
  peptides_active: false, peptides_selected: [],
  training_experience: "", training_equipment: [], training_sports: [], training_days: 4, training_goal: "",
  nutrition_style: "", nutrition_allergies: [], nutrition_fasting: false, nutrition_window_start: "09:00", nutrition_window_end: "18:30",
  longevity_experience: "", longevity_stack: [], longevity_bloodwork: false,
  notifications: "all",
};

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL);
  const [saving, setSaving] = useState(false);

  const update = useCallback((partial: Partial<OnboardingAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }, []);

  function next() { setDir(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function prev() { setDir(-1); setStep((s) => Math.max(s - 1, 1)); }
  function goTo(s: number) { setDir(s > step ? 1 : -1); setStep(s); }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      router.push("/");
    } catch { /* ignore */ }
    setSaving(false);
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const stepProps = { answers, update, next, prev };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Back button */}
      {step > 1 && (
        <button onClick={prev} className="absolute top-4 left-4 z-20 p-2 rounded-full"
          style={{ background: "rgba(0,0,0,0.3)", color: "white", paddingTop: "max(16px, env(safe-area-inset-top))" }}>
          <ArrowLeft size={20} />
        </button>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {step === 1 && <StepWelcome {...stepProps} />}
            {step === 2 && <StepFocus {...stepProps} />}
            {step === 3 && <StepProfile {...stepProps} />}
            {step === 4 && <StepWearable {...stepProps} />}
            {step === 5 && <StepDetails {...stepProps} />}
            {step === 6 && <StepNotifications {...stepProps} />}
            {step === 7 && <StepSummary {...stepProps} goTo={goTo} onFinish={finish} saving={saving} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="flex justify-center gap-1.5 py-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i + 1 === step ? 24 : 12,
              background: i + 1 <= step ? "var(--accent)" : "var(--bar-bg)",
              opacity: i + 1 === step ? 1 : i + 1 < step ? 0.6 : 0.3,
            }} />
        ))}
      </div>
    </div>
  );
}
