"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { getTodayMeals, getTodayMacros } from "@/lib/queries";
import { COLORS } from "@/lib/constants";
import type { NutritionEntry, MacroSummary } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import MacroBar from "@/components/MacroBar";

const TABS = ["Heute", "Wochenplan", "Einkaufsliste"] as const;
type Tab = (typeof TABS)[number];

const MEAL_ORDER = ["fruehstueck", "mittagessen", "abendessen", "snack"];

const MEAL_LABELS: Record<string, string> = {
  fruehstueck: "Fruehstueck",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
  shake: "Shake",
  getraenk: "Getraenk",
};

function MealCard({ entry }: { entry: NutritionEntry }) {
  const time = entry.created_at ? new Date(entry.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <Card className="flex gap-3">
      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
        <img
          src={`https://source.unsplash.com/200x200/?${encodeURIComponent(entry.gericht_name || "food")},food`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium truncate">{entry.gericht_name}</p>
            <p className="text-xs text-slate-500">{MEAL_LABELS[entry.mahlzeit_typ] || entry.mahlzeit_typ} · {time}</p>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {entry.kalorien || 0} kcal
          </span>
        </div>
        <div className="flex gap-3 mt-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full">
            {entry.protein_g || 0}g P
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full">
            {entry.kohlenhydrate_g || 0}g KH
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full">
            {entry.fett_g || 0}g F
          </span>
        </div>
      </div>
    </Card>
  );
}

function EmptyMealSlot({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-xs text-slate-300 mt-1">Foto senden oder /meal im Bot</p>
    </div>
  );
}

export default function ErnaehrungPage() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("Heute");
  const [meals, setMeals] = useState<NutritionEntry[]>([]);
  const [macros, setMacros] = useState<MacroSummary>({ kcal: 0, protein_g: 0, carbs_g: 0, fett_g: 0, wasser_ml: 0 });

  useEffect(() => {
    getTodayMeals(user.id).then(setMeals);
    getTodayMacros(user.id).then(setMacros);
  }, [user.id]);

  const mealsByType: Record<string, NutritionEntry[]> = {};
  meals.forEach((m) => {
    const t = m.mahlzeit_typ || "snack";
    (mealsByType[t] ||= []).push(m);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ernaehrung</h1>
        <FamilySwitcher />
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Heute" && (
        <div className="flex flex-col gap-3">
          {MEAL_ORDER.map((type) => {
            const entries = mealsByType[type];
            if (entries && entries.length > 0) {
              return entries.map((e) => <MealCard key={e.id} entry={e} />);
            }
            if (type !== "snack") {
              return <EmptyMealSlot key={type} label={MEAL_LABELS[type] || type} />;
            }
            return null;
          })}

          {/* Tages-Zusammenfassung */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Tagesbilanz</h3>
            <div className="flex flex-col gap-2">
              <MacroBar label="Protein" current={macros.protein_g} target={user.protein_ziel_g} color={COLORS.green} />
              <MacroBar label="Carbs" current={macros.carbs_g} target={200} color={COLORS.primary} />
              <MacroBar label="Fett" current={macros.fett_g} target={80} color={COLORS.amber} />
              <MacroBar label="kcal" current={macros.kcal} target={user.kcal_training} color={COLORS.orange} unit="" />
            </div>
          </Card>
        </div>
      )}

      {tab === "Wochenplan" && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            Wochenplan wird vom Julius Bot generiert.<br />
            Schreib /wochenplan im Telegram Chat.
          </p>
        </Card>
      )}

      {tab === "Einkaufsliste" && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            Einkaufsliste wird aus Wochenplan + Vorrat generiert.<br />
            Schreib /einkauf im Telegram Chat.
          </p>
        </Card>
      )}
    </div>
  );
}
