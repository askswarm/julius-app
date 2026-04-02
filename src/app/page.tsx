"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getTodayMacros, getTodayTraining, getTodaySupplements, getTrainingLoad } from "@/lib/queries";
import { TRAINING_SCHEDULE, COLORS } from "@/lib/constants";
import type { DailyScore, MacroSummary, TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import MacroBar from "@/components/MacroBar";
import Card from "@/components/Card";
import AutophagieTimer from "@/components/AutophagieTimer";
import SupplementStatus from "@/components/SupplementStatus";

export default function HomePage() {
  const { user, userKey } = useUser();
  const [scores, setScores] = useState<DailyScore | null>(null);
  const [macros, setMacros] = useState<MacroSummary>({ kcal: 0, protein_g: 0, carbs_g: 0, fett_g: 0, wasser_ml: 0 });
  const [training, setTraining] = useState<TrainingEntry[]>([]);
  const [supplements, setSupplements] = useState<string[]>([]);
  const [load, setLoad] = useState(0);

  useEffect(() => {
    const id = user.id;
    getTodayScores(id).then(setScores);
    getTodayMacros(id).then(setMacros);
    getTodayTraining(id).then(setTraining);
    getTodaySupplements(id).then(setSupplements);
    getTrainingLoad(id).then(setLoad);
  }, [user.id]);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const schedule = TRAINING_SCHEDULE[dayOfWeek];
  const todayTraining = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {format(today, "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
          <h1 className="text-2xl font-semibold mt-1">Hallo {user.name}</h1>
        </div>
        <FamilySwitcher />
      </div>

      {/* Score Rings */}
      <Card className="flex justify-around relative">
        <ScoreRing value={scores?.readiness ?? null} label="Readiness" color={COLORS.green} />
        <ScoreRing value={scores?.sleep ?? null} label="Schlaf" color={COLORS.primary} />
        <ScoreRing value={Math.min(load, 1000)} max={1000} label="Load (48h)" color={COLORS.orange} />
      </Card>

      {/* Autophagie Timer */}
      <AutophagieTimer />

      {/* Makro Tracker */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">Makros heute</h3>
          <span className="text-xs text-slate-500">{macros.kcal} / {user.kcal_training} kcal</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <MacroBar label="Protein" current={macros.protein_g} target={user.protein_ziel_g} color={COLORS.green} />
          <MacroBar label="Carbs" current={macros.carbs_g} target={200} color={COLORS.primary} />
          <MacroBar label="Fett" current={macros.fett_g} target={80} color={COLORS.amber} />
          <MacroBar label="Wasser" current={macros.wasser_ml} target={user.wasser_ziel_ml} color={COLORS.water} unit="ml" />
        </div>
      </Card>

      {/* Training */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
              <Dumbbell size={20} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">{todayTraining}</h3>
              <p className="text-xs text-slate-500">
                {training.length > 0
                  ? `${training[0].name} — RPE ${training[0].rpe || "?"}`
                  : "Noch nicht geloggt"}
              </p>
            </div>
          </div>
          {training.length > 0 ? (
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 text-sm">
              ✓
            </div>
          ) : (
            <ChevronRight size={18} className="text-slate-400" />
          )}
        </div>
      </Card>

      {/* Supplements */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Supplements</h3>
        <SupplementStatus takenSlots={supplements} />
      </Card>
    </div>
  );
}
