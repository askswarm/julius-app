"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { getTodayMeals, getTodayMacros } from "@/lib/queries";
import type { NutritionEntry, MacroSummary } from "@/lib/types";
import { matchFoodImage } from "@/lib/images";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import MacroBar from "@/components/MacroBar";

const TABS = ["Heute", "Wochenplan", "Einkaufsliste"] as const;
type Tab = (typeof TABS)[number];

const MEAL_ORDER = ["fruehstueck", "mittagessen", "abendessen", "snack"];
const MEAL_LABELS: Record<string, string> = { fruehstueck: "Fruehstueck", mittagessen: "Mittagessen", abendessen: "Abendessen", snack: "Snack" };

const FOOD_IMAGES: Record<string, string> = {
  default: "photo-1546069901-ba9599a7e63c",
  fruehstueck: "photo-1525351484163-7529414344d8",
  mittagessen: "photo-1512621776951-a57141f2eefd",
  abendessen: "photo-1467003909585-2f8a72700288",
  snack: "photo-1502741224143-90386d7f8c82",
};

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  kcal: "linear-gradient(90deg, #F97316, #FBBF24)",
};

function MealCard({ entry }: { entry: NutritionEntry }) {
  const imgUrl = matchFoodImage(entry.gericht_name || "");
  const time = entry.created_at ? new Date(entry.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <Card className="flex gap-4 animate-fade-in">
      <div className="w-20 h-20 rounded-[14px] overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg, rgba(126,226,184,0.1), rgba(121,192,255,0.1))" }}>
        <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold truncate">{entry.gericht_name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{MEAL_LABELS[entry.mahlzeit_typ] || entry.mahlzeit_typ} · {time}</p>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{entry.kalorien || 0} kcal</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[
            { v: entry.protein_g, l: "P", c: "rgba(126,226,184,0.12)", t: "var(--accent)" },
            { v: entry.kohlenhydrate_g, l: "KH", c: "rgba(121,192,255,0.12)", t: "var(--accent2)" },
            { v: entry.fett_g, l: "F", c: "rgba(249,115,22,0.12)", t: "var(--orange)" },
          ].map((m) => (
            <span key={m.l} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: m.c, color: m.t }}>
              {m.v || 0}g {m.l}
            </span>
          ))}
        </div>
      </div>
    </Card>
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
  meals.forEach((m) => { const t = m.mahlzeit_typ || "snack"; (mealsByType[t] ||= []).push(m); });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-xl font-bold">Ernaehrung</h1>
        <FamilySwitcher />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.04)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm rounded-lg font-medium transition-all"
            style={{
              background: tab === t ? "rgba(126,226,184,0.1)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--text3)",
            }}>{t}</button>
        ))}
      </div>

      {tab === "Heute" && (
        <div className="flex flex-col gap-3">
          {MEAL_ORDER.map((type) => {
            const entries = mealsByType[type];
            if (entries?.length) return entries.map((e) => <MealCard key={e.id} entry={e} />);
            if (type !== "snack") return (
              <div key={type} className="rounded-[20px] p-5 text-center" style={{ border: "2px dashed var(--card-border)" }}>
                <p className="text-sm" style={{ color: "var(--text3)" }}>{MEAL_LABELS[type]}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>Foto senden oder /meal im Bot</p>
              </div>
            );
            return null;
          })}

          <Card className="animate-fade-in stagger-4">
            <span className="text-[11px] font-semibold uppercase tracking-[1px] block mb-3" style={{ color: "var(--text2)" }}>Tagesbilanz</span>
            <div className="flex flex-col gap-2.5">
              <MacroBar label="Protein" current={macros.protein_g} target={user.protein_ziel_g} gradient={GRADIENTS.protein} />
              <MacroBar label="Carbs" current={macros.carbs_g} target={200} gradient={GRADIENTS.carbs} />
              <MacroBar label="Fett" current={macros.fett_g} target={80} gradient={GRADIENTS.fett} />
              <MacroBar label="kcal" current={macros.kcal} target={user.kcal_training} gradient={GRADIENTS.kcal} unit="" />
            </div>
          </Card>
        </div>
      )}

      {tab === "Wochenplan" && (
        <Card><p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Wochenplan wird vom Julius Bot generiert.</p></Card>
      )}
      {tab === "Einkaufsliste" && (
        <Card><p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Einkaufsliste via /einkauf im Telegram Bot.</p></Card>
      )}
    </div>
  );
}
