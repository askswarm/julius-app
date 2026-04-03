"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, ChevronRight, BarChart3, BookOpen } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getTodayMacros, getTodayTraining, getTodaySupplements, getTrainingLoad, getTodayMacroAdjustment } from "@/lib/queries";
import { TRAINING_SCHEDULE } from "@/lib/constants";
import type { DailyScore, MacroSummary, TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import MacroBar from "@/components/MacroBar";
import Card from "@/components/Card";
import AutophagieTimer from "@/components/AutophagieTimer";
import SupplementStatus from "@/components/SupplementStatus";
import LifeTimeline from "@/components/LifeTimeline";

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  wasser: "linear-gradient(90deg, #0284C7, #38BDF8)",
};

export default function HomePage() {
  const { user, userKey } = useUser();
  const [scores, setScores] = useState<DailyScore | null>(null);
  const [macros, setMacros] = useState<MacroSummary>({ kcal: 0, protein_g: 0, carbs_g: 0, fett_g: 0, wasser_ml: 0 });
  const [training, setTraining] = useState<TrainingEntry[]>([]);
  const [supplements, setSupplements] = useState<string[]>([]);
  const [load, setLoad] = useState(0);
  const [macroAdj, setMacroAdj] = useState({ kcal: 0, protein: 0 });

  useEffect(() => {
    const id = user.id;
    getTodayScores(id).then(setScores);
    getTodayMacros(id).then(setMacros);
    getTodayTraining(id).then(setTraining);
    getTodaySupplements(id).then(setSupplements);
    getTrainingLoad(id).then(setLoad);
    getTodayMacroAdjustment(id).then(setMacroAdj);
  }, [user.id]);

  const adjustedKcal = user.kcal_training + macroAdj.kcal;
  const adjustedProtein = user.protein_ziel_g + macroAdj.protein;

  const today = new Date();
  const schedule = TRAINING_SCHEDULE[today.getDay()];
  const todayTraining = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-xs font-medium uppercase tracking-[1px]" style={{ color: "var(--text3)" }}>
            {format(today, "EEEE, d. MMMM", { locale: de })}
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: "var(--text)" }}>Hallo {user.name}</h1>
        </div>
        <FamilySwitcher />
      </div>

      {/* Score Rings */}
      <Card className="flex justify-around animate-fade-in stagger-1" glow={scores != null}>
        <ScoreRing value={scores?.readiness ?? null} label="Readiness" color="#7EE2B8" />
        <ScoreRing value={scores?.sleep ?? null} label="Schlaf" color="#79C0FF" />
        <ScoreRing value={Math.min(load, 1000)} max={1000} label="Load 48h" color="#F97316" />
      </Card>

      {/* Life Timeline */}
      <Card className="animate-fade-in stagger-2">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] block mb-3" style={{ color: "var(--text2)" }}>Tagesverlauf</span>
        <LifeTimeline />
      </Card>

      {/* Autophagie */}
      <AutophagieTimer />

      {/* Makros */}
      <Card className="animate-fade-in stagger-3">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Makros heute</span>
          <span className="text-xs font-medium" style={{ color: "var(--text3)" }}>
            {macros.kcal} / {adjustedKcal} kcal
            {macroAdj.kcal > 0 && <span style={{ color: "var(--accent)" }}> (+{macroAdj.kcal})</span>}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <MacroBar label="Protein" current={macros.protein_g} target={adjustedProtein} gradient={GRADIENTS.protein} />
          <MacroBar label="Carbs" current={macros.carbs_g} target={200} gradient={GRADIENTS.carbs} />
          <MacroBar label="Fett" current={macros.fett_g} target={80} gradient={GRADIENTS.fett} />
          <MacroBar label="Wasser" current={macros.wasser_ml} target={user.wasser_ziel_ml} gradient={GRADIENTS.wasser} unit="ml" />
        </div>
      </Card>

      {/* Training */}
      <Card className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Dumbbell size={20} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold">{todayTraining}</p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>
                {training.length > 0 ? `${training[0].name} — RPE ${training[0].rpe || "?"}` : "Noch nicht geloggt"}
              </p>
            </div>
          </div>
          {training.length > 0 ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm glow-pulse"
              style={{ background: "rgba(126,226,184,0.15)", color: "var(--accent)" }}>✓</div>
          ) : (
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          )}
        </div>
      </Card>

      {/* Supplements */}
      <Card className="animate-fade-in stagger-5">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] block mb-3" style={{ color: "var(--text2)" }}>Supplements</span>
        <SupplementStatus takenSlots={supplements} />
      </Card>

      {/* Journal Link */}
      <Link href="/journal">
        <Card className="animate-fade-in stagger-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(126,226,184,0.1)" }}>
                <BookOpen size={20} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold">Tages-Journal</p>
                <p className="text-xs" style={{ color: "var(--text2)" }}>Gewohnheiten tracken</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          </div>
        </Card>
      </Link>

      {/* Week Report Link */}
      <Link href="/report">
        <Card className="animate-fade-in stagger-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(121,192,255,0.1)" }}>
                <BarChart3 size={20} style={{ color: "var(--accent2)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold">Wochen-Report</p>
                <p className="text-xs" style={{ color: "var(--text2)" }}>Training, Ernaehrung, Schlaf</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          </div>
        </Card>
      </Link>
    </div>
  );
}
