"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Download, Syringe } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { COLORS } from "@/lib/constants";
import Card from "@/components/Card";
import FamilySwitcher from "@/components/FamilySwitcher";

export default function ProfilPage() {
  const { user, userKey } = useUser();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("julius-dark");
    if (saved === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("julius-dark", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  const bmi = (user.gewicht_kg / ((user.groesse_cm / 100) ** 2)).toFixed(1);
  const isVincent = userKey === "vincent";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white">
          {user.name[0]}
        </div>
        <h1 className="text-2xl font-semibold">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.alter_jahre}J · {user.groesse_cm}cm · {user.gewicht_kg}kg</p>
      </div>

      <FamilySwitcher />

      {/* Ziele */}
      <Card>
        <h3 className="text-sm font-medium mb-2">Ziele</h3>
        <div className="flex flex-wrap gap-2">
          {(isVincent
            ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"]
            : ["Muskelaufbau 55kg", "HYROX", "Longevity"]
          ).map((z) => (
            <span key={z} className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full">{z}</span>
          ))}
        </div>
      </Card>

      {/* Koerper */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Koerper</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold">{user.gewicht_kg}<span className="text-sm text-slate-400">kg</span></p>
            <p className="text-xs text-slate-500">Gewicht</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{bmi}</p>
            <p className="text-xs text-slate-500">BMI</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.protein_ziel_g}<span className="text-sm text-slate-400">g</span></p>
            <p className="text-xs text-slate-500">Protein/Tag</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.kcal_training}</p>
            <p className="text-xs text-slate-500">kcal Training</p>
          </div>
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

      {/* TRT — nur Vincent */}
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
          <button
            onClick={toggleDark}
            className={`w-12 h-6 rounded-full transition-colors ${dark ? "bg-blue-500" : "bg-slate-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </Card>

      {/* Export */}
      <Card>
        <button className="flex items-center gap-2 text-sm text-blue-600">
          <Download size={16} />
          Alle Daten exportieren (JSON)
        </button>
      </Card>
    </div>
  );
}
