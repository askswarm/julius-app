"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Camera, MessageSquare, BookOpen, X, Check, Loader2 } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodayMeals, getTodayMacros } from "@/lib/queries";
import type { NutritionEntry, MacroSummary } from "@/lib/types";
import { matchFoodImage } from "@/lib/images";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import MacroBar from "@/components/MacroBar";
import Toast from "@/components/Toast";

const TABS = ["Heute", "Wochenplan", "Einkaufsliste"] as const;
type Tab = (typeof TABS)[number];

const MEAL_ORDER = ["fruehstueck", "mittagessen", "abendessen", "snack"];
const MEAL_LABELS: Record<string, string> = { fruehstueck: "Fruehstueck", mittagessen: "Mittagessen", abendessen: "Abendessen", snack: "Snack" };

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  kcal: "linear-gradient(90deg, #F97316, #FBBF24)",
};

interface AnalysisResult {
  gericht_name: string;
  kalorien: number;
  protein_g: number;
  kohlenhydrate_g: number;
  fett_g: number;
  ballaststoffe_g: number;
}

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
  const [toast, setToast] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMealType, setModalMealType] = useState("snack");
  const [modalMode, setModalMode] = useState<"choose" | "text" | "confirm">("choose");
  const [textInput, setTextInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    getTodayMeals(user.id).then(setMeals);
    getTodayMacros(user.id).then(setMacros);
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  const mealsByType: Record<string, NutritionEntry[]> = {};
  meals.forEach((m) => { const t = m.mahlzeit_typ || "snack"; (mealsByType[t] ||= []).push(m); });

  function openModal(mealType: string) {
    setModalMealType(mealType);
    setModalMode("choose");
    setTextInput("");
    setPendingImage(null);
    setAnalysis(null);
    setShowModal(true);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
      analyzeFood(undefined, reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function analyzeFood(text?: string, image?: string) {
    setAnalyzing(true);
    setModalMode("confirm");

    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || undefined,
          image: image || undefined,
          chatId: user.id,
          mealType: modalMealType,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setShowModal(false);
        setToast("Mahlzeit gespeichert!");
        reload();
      } else {
        setAnalysis(null);
        setToast(data.error || "Analyse fehlgeschlagen");
        setShowModal(false);
      }
    } catch {
      setToast("Verbindungsfehler");
      setShowModal(false);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

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
            if (entries?.length) {
              return (
                <div key={type}>
                  {entries.map((e) => <MealCard key={e.id} entry={e} />)}
                </div>
              );
            }
            return (
              <button key={type} onClick={() => openModal(type)}
                className="rounded-[20px] p-5 text-center transition-all hover:scale-[1.01]"
                style={{ border: "2px dashed var(--card-border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>{MEAL_LABELS[type]}</p>
                <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>+ Mahlzeit hinzufuegen</p>
              </button>
            );
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
        <Card><p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Einkaufsliste via Chat an Julius.</p></Card>
      )}

      {/* Meal Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: "#161B22", maxHeight: "80vh", overflowY: "auto", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {MEAL_LABELS[modalMealType] || "Mahlzeit"} hinzufuegen
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text3)" }}>
                <X size={20} />
              </button>
            </div>

            {modalMode === "choose" && (
              <div className="flex flex-col gap-3">
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(126,226,184,0.08)", border: "1px solid var(--card-border)" }}>
                  <Camera size={24} style={{ color: "var(--accent)" }} />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Foto</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>Kamera oder Galerie</p>
                  </div>
                </button>

                <button onClick={() => setModalMode("text")}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(121,192,255,0.08)", border: "1px solid var(--card-border)" }}>
                  <MessageSquare size={24} style={{ color: "var(--accent2)" }} />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Text</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>Beschreibe dein Essen</p>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 rounded-2xl opacity-50"
                  style={{ background: "rgba(249,115,22,0.08)", border: "1px solid var(--card-border)" }}>
                  <BookOpen size={24} style={{ color: "var(--orange)" }} />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Aus Wochenplan</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>Kommt bald</p>
                  </div>
                </button>
              </div>
            )}

            {modalMode === "text" && (
              <div className="flex flex-col gap-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="z.B. Griechischer Joghurt mit Honig und Walnuessen, ca. 250g"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-transparent border text-sm resize-none"
                  style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
                  autoFocus
                />
                <button
                  onClick={() => analyzeFood(textInput)}
                  disabled={!textInput.trim()}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: textInput.trim() ? "var(--grad-teal)" : "var(--text3)", color: "#0D1117" }}
                >
                  Analysieren
                </button>
              </div>
            )}

            {modalMode === "confirm" && analyzing && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
                <p className="text-sm" style={{ color: "var(--text2)" }}>Claude analysiert...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
