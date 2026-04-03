"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Camera, X, Loader2, Sparkles } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodayMeals, getTodayMacros } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
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
const MEAL_TYPES = ["fruehstueck", "mittagessen", "abendessen", "snack", "shake"];
const MEAL_TYPE_LABELS: Record<string, string> = { ...MEAL_LABELS, shake: "Shake" };

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  kcal: "linear-gradient(90deg, #F97316, #FBBF24)",
};

const PORTION_MULTIPLIER: Record<string, number> = { klein: 0.7, normal: 1, gross: 1.4 };

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
  const [favorites, setFavorites] = useState<{ name: string; kcal: number; protein: number }[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMealType, setModalMealType] = useState("snack");
  const [modalTab, setModalTab] = useState<"manuell" | "foto">("manuell");
  const [gerichtName, setGerichtName] = useState("");
  const [portion, setPortion] = useState("normal");
  const [mKcal, setMKcal] = useState<number | "">("");
  const [mProtein, setMProtein] = useState<number | "">("");
  const [mCarbs, setMCarbs] = useState<number | "">("");
  const [mFett, setMFett] = useState<number | "">("");
  const [estimating, setEstimating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<{ name: string; kcal: number; protein: number; carbs: number; fett: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    getTodayMeals(user.id).then(setMeals);
    getTodayMacros(user.id).then(setMacros);
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  // Load favorites (top 5 most logged meals)
  useEffect(() => {
    supabase
      .from("nutrition_log")
      .select("gericht_name, kalorien, protein_g")
      .eq("chat_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, { name: string; kcal: number; protein: number; count: number }> = {};
        data.forEach((m) => {
          const key = (m.gericht_name || "").toLowerCase();
          if (!key) return;
          if (!counts[key]) counts[key] = { name: m.gericht_name, kcal: m.kalorien || 0, protein: m.protein_g || 0, count: 0 };
          counts[key].count++;
        });
        const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
        setFavorites(sorted);
      });
  }, [user.id]);

  const mealsByType: Record<string, NutritionEntry[]> = {};
  meals.forEach((m) => { const t = m.mahlzeit_typ || "snack"; (mealsByType[t] ||= []).push(m); });

  function openModal(mealType: string) {
    setModalMealType(mealType);
    setModalTab("manuell");
    setGerichtName("");
    setPortion("normal");
    setMKcal("");
    setMProtein("");
    setMCarbs("");
    setMFett("");
    setPhotoPreview(null);
    setPhotoResult(null);
    setShowModal(true);
  }

  async function estimateMacros() {
    if (!gerichtName.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: gerichtName, chatId: user.id, mode: "estimate" }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const mult = PORTION_MULTIPLIER[portion] || 1;
        setMKcal(Math.round((data.analysis.kalorien || 0) * mult));
        setMProtein(Math.round((data.analysis.protein_g || 0) * mult));
        setMCarbs(Math.round((data.analysis.kohlenhydrate_g || 0) * mult));
        setMFett(Math.round((data.analysis.fett_g || 0) * mult));
        if (data.analysis.gericht_name && !gerichtName.trim()) setGerichtName(data.analysis.gericht_name);
      }
    } catch { /* ignore */ }
    setEstimating(false);
  }

  async function saveManual() {
    if (!gerichtName.trim()) return;
    setSaving(true);
    try {
      const mult = PORTION_MULTIPLIER[portion] || 1;
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: user.id,
          mealType: modalMealType,
          mode: "manual",
          manualData: {
            gericht_name: gerichtName,
            kalorien: Math.round((Number(mKcal) || 0) * (mKcal ? 1 : mult)),
            protein_g: Math.round((Number(mProtein) || 0) * (mProtein ? 1 : mult)),
            kohlenhydrate_g: Math.round((Number(mCarbs) || 0) * (mCarbs ? 1 : mult)),
            fett_g: Math.round((Number(mFett) || 0) * (mFett ? 1 : mult)),
          },
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setToast("Mahlzeit gespeichert!");
        reload();
      }
    } catch { setToast("Fehler beim Speichern"); }
    setSaving(false);
  }

  async function quickAddFavorite(fav: { name: string; kcal: number; protein: number }) {
    setSaving(true);
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: user.id,
          mealType: modalMealType || "snack",
          mode: "manual",
          manualData: { gericht_name: fav.name, kalorien: fav.kcal, protein_g: fav.protein, kohlenhydrate_g: 0, fett_g: 0 },
        }),
      });
      setShowModal(false);
      setToast(`${fav.name} geloggt!`);
      reload();
    } catch { /* ignore */ }
    setSaving(false);
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      analyzePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function analyzePhoto(base64: string) {
    setAnalyzing(true);
    setPhotoResult(null);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, chatId: user.id, mealType: modalMealType }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setPhotoResult({
          name: data.analysis.gericht_name || "Unbekannt",
          kcal: data.analysis.kalorien || 0,
          protein: data.analysis.protein_g || 0,
          carbs: data.analysis.kohlenhydrate_g || 0,
          fett: data.analysis.fett_g || 0,
        });
        setShowModal(false);
        setToast("Mahlzeit gespeichert!");
        reload();
      } else {
        setToast(data.error || "Analyse fehlgeschlagen");
      }
    } catch { setToast("Verbindungsfehler"); }
    setAnalyzing(false);
  }

  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />

      {/* Hero Image */}
      <div className="rounded-[20px] overflow-hidden relative animate-fade-in" style={{ height: 140 }}>
        <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=300&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover ken-burns" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, var(--bg) 100%)" }} />
        <div className="relative h-full p-5 flex flex-col justify-end">
          <h1 className="text-xl font-bold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>Ernaehrung</h1>
        </div>
      </div>

      <div className="flex items-center justify-end animate-fade-in">
        <FamilySwitcher />
      </div>

      <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--subtle-bg)" }}>
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
              return <div key={type}>{entries.map((e) => <MealCard key={e.id} entry={e} />)}</div>;
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
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "var(--overlay)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Mahlzeit hinzufuegen</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text3)" }}><X size={20} /></button>
            </div>

            {/* Meal type pills */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {MEAL_TYPES.map((mt) => (
                <button key={mt} onClick={() => setModalMealType(mt)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: modalMealType === mt ? "var(--accent)" : "var(--subtle-bg)",
                    color: modalMealType === mt ? "#0D1117" : "var(--text3)",
                  }}>
                  {MEAL_TYPE_LABELS[mt] || mt}
                </button>
              ))}
            </div>

            {/* Manuell / Foto tabs */}
            <div className="flex rounded-xl p-1 gap-1 mb-4" style={{ background: "var(--subtle-bg)" }}>
              <button onClick={() => setModalTab("manuell")}
                className="flex-1 py-2 text-xs rounded-lg font-medium transition-all"
                style={{ background: modalTab === "manuell" ? "var(--card)" : "transparent", color: modalTab === "manuell" ? "var(--text)" : "var(--text3)" }}>
                Manuell
              </button>
              <button onClick={() => setModalTab("foto")}
                className="flex-1 py-2 text-xs rounded-lg font-medium transition-all"
                style={{ background: modalTab === "foto" ? "var(--card)" : "transparent", color: modalTab === "foto" ? "var(--text)" : "var(--text3)" }}>
                Foto
              </button>
            </div>

            {modalTab === "manuell" && (
              <div className="flex flex-col gap-3">
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div>
                    <p className="text-[10px] mb-1.5" style={{ color: "var(--text3)" }}>Letzte Gerichte</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {favorites.map((f, i) => (
                        <button key={i} onClick={() => quickAddFavorite(f)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all"
                          style={{ background: "var(--subtle-bg)", color: "var(--text2)", border: "1px solid var(--card-border)" }}>
                          {f.name} ({f.kcal} kcal)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <input value={gerichtName} onChange={(e) => setGerichtName(e.target.value)}
                  placeholder="z.B. Omelette mit Feta"
                  className="w-full px-4 py-3 rounded-2xl text-sm border" style={inputStyle} />

                {/* Portion */}
                <div>
                  <p className="text-[10px] mb-1.5" style={{ color: "var(--text3)" }}>Portionsgroesse</p>
                  <div className="flex gap-2">
                    {(["klein", "normal", "gross"] as const).map((p) => (
                      <button key={p} onClick={() => setPortion(p)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: portion === p ? "var(--accent)" : "var(--subtle-bg)",
                          color: portion === p ? "#0D1117" : "var(--text3)",
                          border: `1px solid ${portion === p ? "var(--accent)" : "var(--card-border)"}`,
                        }}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px]" style={{ color: "var(--text3)" }}>kcal</label>
                    <input type="number" value={mKcal} onChange={(e) => setMKcal(e.target.value ? Number(e.target.value) : "")}
                      placeholder="—" className="w-full mt-0.5 px-2 py-2 rounded-xl text-sm text-center border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px]" style={{ color: "var(--text3)" }}>Protein</label>
                    <input type="number" value={mProtein} onChange={(e) => setMProtein(e.target.value ? Number(e.target.value) : "")}
                      placeholder="—" className="w-full mt-0.5 px-2 py-2 rounded-xl text-sm text-center border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px]" style={{ color: "var(--text3)" }}>Carbs</label>
                    <input type="number" value={mCarbs} onChange={(e) => setMCarbs(e.target.value ? Number(e.target.value) : "")}
                      placeholder="—" className="w-full mt-0.5 px-2 py-2 rounded-xl text-sm text-center border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px]" style={{ color: "var(--text3)" }}>Fett</label>
                    <input type="number" value={mFett} onChange={(e) => setMFett(e.target.value ? Number(e.target.value) : "")}
                      placeholder="—" className="w-full mt-0.5 px-2 py-2 rounded-xl text-sm text-center border" style={inputStyle} />
                  </div>
                </div>

                {/* Estimate button */}
                {gerichtName.trim() && !mKcal && (
                  <button onClick={estimateMacros} disabled={estimating}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-medium transition-all"
                    style={{ background: "var(--subtle-bg)", color: "var(--accent)", border: "1px solid var(--card-border)" }}>
                    {estimating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {estimating ? "Wird geschaetzt..." : "Makros schaetzen lassen"}
                  </button>
                )}

                {/* Save */}
                <button onClick={saveManual} disabled={saving || !gerichtName.trim()}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: gerichtName.trim() ? "var(--grad-teal)" : "var(--text3)", color: "#0D1117" }}>
                  {saving ? "Speichern..." : "Mahlzeit speichern"}
                </button>
              </div>
            )}

            {modalTab === "foto" && (
              <div className="flex flex-col gap-3 items-center">
                {!photoPreview ? (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-12 rounded-2xl flex flex-col items-center gap-3 transition-all"
                    style={{ background: "var(--subtle-bg)", border: "2px dashed var(--card-border)" }}>
                    <Camera size={32} style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Foto aufnehmen oder waehlen</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>Claude analysiert automatisch</p>
                  </button>
                ) : (
                  <div className="w-full">
                    <img src={photoPreview} alt="" className="w-full h-48 object-cover rounded-2xl mb-3" />
                    {analyzing ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
                        <span className="text-sm" style={{ color: "var(--text2)" }}>Claude analysiert...</span>
                      </div>
                    ) : photoResult ? (
                      <div className="text-center py-2">
                        <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>Erkannt: {photoResult.name}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>
                          {photoResult.kcal} kcal | {photoResult.protein}g P | {photoResult.carbs}g KH | {photoResult.fett}g F
                        </p>
                      </div>
                    ) : null}
                    <button onClick={() => { setPhotoPreview(null); setPhotoResult(null); }}
                      className="w-full py-2 text-xs" style={{ color: "var(--text3)" }}>
                      Anderes Foto waehlen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
