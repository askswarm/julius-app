"use client";

import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Download, Syringe, Save } from "lucide-react";
import { differenceInYears } from "date-fns";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import Card from "@/components/Card";
import FamilySwitcher from "@/components/FamilySwitcher";
import AvatarUpload from "@/components/AvatarUpload";
import Toast from "@/components/Toast";

const GOAL_OPTIONS = ["Longevity", "Muskelaufbau", "VO2max", "HYROX", "Muskelerhalt", "Recomp", "Gewichtsverlust"];

export default function ProfilPage() {
  const { user, userKey } = useUser();
  const isVincent = userKey === "vincent";

  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Editable fields
  const [name, setName] = useState(user.name);
  const [geburtsdatum, setGeburtsdatum] = useState(isVincent ? "1987-03-15" : "1984-06-20");
  const [geschlecht, setGeschlecht] = useState(user.geschlecht);
  const [groesse, setGroesse] = useState(user.groesse_cm);
  const [gewicht, setGewicht] = useState(user.gewicht_kg);
  const [zielgewicht, setZielgewicht] = useState(isVincent ? 80 : 55);
  const [goals, setGoals] = useState<string[]>(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  const [customGoal, setCustomGoal] = useState("");

  // Reset on user switch
  useEffect(() => {
    setName(user.name);
    setGeschlecht(user.geschlecht);
    setGroesse(user.groesse_cm);
    setGewicht(user.gewicht_kg);
    setGeburtsdatum(isVincent ? "1987-03-15" : "1984-06-20");
    setZielgewicht(isVincent ? 80 : 55);
    setGoals(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  }, [user, isVincent]);

  useEffect(() => {
    const saved = localStorage.getItem("julius-dark");
    if (saved === "true") { setDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("julius-dark", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  const alter = geburtsdatum ? differenceInYears(new Date(), new Date(geburtsdatum)) : user.alter_jahre;
  const bmi = (gewicht / ((groesse / 100) ** 2)).toFixed(1);

  async function saveProfile() {
    const { error } = await supabase.from("users").update({
      name,
      geschlecht,
      groesse_cm: groesse,
      gewicht_kg: gewicht,
      alter_jahre: alter,
      ziele: goals,
    }).eq("id", user.id);

    if (!error) {
      setToast("Profil gespeichert");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Avatar */}
      <div className="flex flex-col items-center gap-3 py-6">
        <AvatarUpload
          chatId={user.id}
          name={name}
          currentUrl={avatarUrl || undefined}
          onUpload={(url) => { setAvatarUrl(url); setToast("Foto gespeichert"); }}
        />
        <h1 className="text-2xl font-semibold mt-2">{name}</h1>
        <p className="text-sm text-slate-500">{alter}J · {groesse}cm · {gewicht}kg · BMI {bmi}</p>
      </div>

      <FamilySwitcher />

      {/* Persoenliche Daten */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Persoenliche Daten</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Geburtsdatum</label>
              <input
                type="date"
                value={geburtsdatum}
                onChange={(e) => setGeburtsdatum(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Geschlecht</label>
              <select
                value={geschlecht}
                onChange={(e) => setGeschlecht(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600"
              >
                <option value="M">Maennlich</option>
                <option value="F">Weiblich</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Groesse (cm)</label>
              <input type="number" value={groesse} onChange={(e) => setGroesse(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Gewicht (kg)</label>
              <input type="number" step="0.1" value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Ziel (kg)</label>
              <input type="number" step="0.1" value={zielgewicht} onChange={(e) => setZielgewicht(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600" />
            </div>
          </div>

          <button onClick={saveProfile}
            className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors">
            <Save size={16} /> Speichern
          </button>
        </div>
      </Card>

      {/* Ziele */}
      <Card>
        <h3 className="text-sm font-medium mb-2">Ziele</h3>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button key={g} onClick={() => toggleGoal(g)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                goals.includes(g)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-slate-50 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600"
              }`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input type="text" placeholder="Eigenes Ziel..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-xs border border-slate-200 dark:border-slate-600"
            onKeyDown={(e) => { if (e.key === "Enter" && customGoal.trim()) { setGoals([...goals, customGoal.trim()]); setCustomGoal(""); } }}
          />
        </div>
      </Card>

      {/* Koerper Metriken */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Metriken</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="text-2xl font-bold">{bmi}</p><p className="text-xs text-slate-500">BMI</p></div>
          <div><p className="text-2xl font-bold">{user.protein_ziel_g}<span className="text-sm text-slate-400">g</span></p><p className="text-xs text-slate-500">Protein/Tag</p></div>
          <div><p className="text-2xl font-bold">{user.kcal_training}</p><p className="text-xs text-slate-500">kcal Training</p></div>
          <div><p className="text-2xl font-bold">{user.wasser_ziel_ml / 1000}<span className="text-sm text-slate-400">L</span></p><p className="text-xs text-slate-500">Wasser/Tag</p></div>
        </div>
      </Card>

      {/* Autophagie */}
      <Card>
        <h3 className="text-sm font-medium mb-2">Autophagie / Fasten</h3>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Essensfenster</span>
          <span className="font-medium">{user.essensfenster_start} – {user.essensfenster_ende}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-500">Fastendauer</span>
          <span className="font-medium">{isVincent ? "15" : "14"} Stunden</span>
        </div>
      </Card>

      {/* TRT */}
      {isVincent && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Syringe size={16} className="text-blue-500" />
            <h3 className="text-sm font-medium">TRT Protokoll</h3>
          </div>
          <div className="text-sm text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between"><span>Dosis</span><span className="text-slate-700 dark:text-slate-300">120mg/Woche</span></div>
            <div className="flex justify-between"><span>Frequenz</span><span className="text-slate-700 dark:text-slate-300">2x (Mi + Sa)</span></div>
            <div className="flex justify-between"><span>Pro Injektion</span><span className="text-slate-700 dark:text-slate-300">0.2ml / 60mg</span></div>
          </div>
        </Card>
      )}

      {/* Dark Mode */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dark ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-sm font-medium">Dark Mode</span>
          </div>
          <button onClick={toggleDark}
            className={`w-12 h-6 rounded-full transition-colors ${dark ? "bg-blue-500" : "bg-slate-300"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </Card>

      {/* Export */}
      <Card>
        <button className="flex items-center gap-2 text-sm text-blue-600">
          <Download size={16} /> Alle Daten exportieren (JSON)
        </button>
      </Card>

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
