"use client";

import { useEffect, useState } from "react";
import { Syringe, Save, ChevronRight, Settings, BarChart3, Target, Moon, Sun, BookOpen, Download, HelpCircle } from "lucide-react";
import { differenceInYears } from "date-fns";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import { getProfileImage } from "@/lib/images";
import Card from "@/components/Card";
import FamilySwitcher from "@/components/FamilySwitcher";
import Toast from "@/components/Toast";
import { useTheme } from "@/lib/ThemeContext";

const GOAL_OPTIONS = ["Longevity", "Muskelaufbau", "VO2max", "HYROX", "Muskelerhalt", "Recomp", "Gewichtsverlust"];

export default function ProfilPage() {
  const { user, userKey } = useUser();
  const isVincent = userKey === "vincent";
  const { theme, toggleTheme } = useTheme();
  const [toast, setToast] = useState("");

  const [name, setName] = useState(user.name);
  const [geburtsdatum, setGeburtsdatum] = useState(isVincent ? "1987-03-15" : "1984-06-20");
  const [geschlecht, setGeschlecht] = useState(user.geschlecht);
  const [groesse, setGroesse] = useState(user.groesse_cm);
  const [gewicht, setGewicht] = useState(user.gewicht_kg);
  const [zielgewicht, setZielgewicht] = useState(isVincent ? 80 : 55);
  const [goals, setGoals] = useState<string[]>(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  const [customGoal, setCustomGoal] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(user.name);
    setGeschlecht(user.geschlecht);
    setGroesse(user.groesse_cm);
    setGewicht(user.gewicht_kg);
    setGeburtsdatum(isVincent ? "1987-03-15" : "1984-06-20");
    setZielgewicht(isVincent ? 80 : 55);
    setGoals(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  }, [user, isVincent]);

  const alter = geburtsdatum ? differenceInYears(new Date(), new Date(geburtsdatum)) : user.alter_jahre;
  const bmi = (gewicht / ((groesse / 100) ** 2)).toFixed(1);

  async function saveProfile() {
    await supabase.from("users").update({
      name, geschlecht, groesse_cm: groesse, gewicht_kg: gewicht, alter_jahre: alter, ziele: goals,
    }).eq("id", user.id);
    setToast("Profil gespeichert");
    setEditing(false);
  }

  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Profile Section */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-2">
        <div className="relative">
          <img
            src={getProfileImage(userKey)}
            alt={name}
            className="w-28 h-28 rounded-full object-cover"
            style={{ border: "3px solid var(--accent)", boxShadow: "0 0 20px rgba(126,226,184,0.2)" }}
          />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{name}</h1>
          <p className="text-xs" style={{ color: "var(--accent)" }}>Longevity Athlete</p>
        </div>
        <FamilySwitcher />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: alter, unit: "", label: "Alter" },
          { value: gewicht, unit: "kg", label: "Gewicht" },
          { value: groesse, unit: "cm", label: "Groesse" },
          { value: bmi, unit: "", label: "BMI" },
        ].map((s) => (
          <Card key={s.label} className="text-center !px-3 !py-3">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{s.value}<span className="text-[10px] font-normal" style={{ color: "var(--text3)" }}>{s.unit}</span></p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Daily Targets */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} style={{ color: "var(--accent)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Tagesziele</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between"><span className="text-sm" style={{ color: "var(--text2)" }}>Protein</span><span className="text-sm font-medium" style={{ color: "var(--text)" }}>{user.protein_ziel_g}g</span></div>
          <div className="flex justify-between"><span className="text-sm" style={{ color: "var(--text2)" }}>kcal Training</span><span className="text-sm font-medium" style={{ color: "var(--text)" }}>{user.kcal_training}</span></div>
          <div className="flex justify-between"><span className="text-sm" style={{ color: "var(--text2)" }}>Wasser</span><span className="text-sm font-medium" style={{ color: "var(--text)" }}>{user.wasser_ziel_ml / 1000}L</span></div>
          <div className="flex justify-between"><span className="text-sm" style={{ color: "var(--text2)" }}>Fasten</span><span className="text-sm font-medium" style={{ color: "var(--text)" }}>{isVincent ? "15" : "14"}h</span></div>
        </div>
      </Card>

      {/* Goals */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-2" style={{ color: "var(--text2)" }}>Ziele</p>
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <span key={g} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(126,226,184,0.1)", color: "var(--accent)", border: "1px solid rgba(126,226,184,0.2)" }}>
              {g}
            </span>
          ))}
        </div>
      </Card>

      {/* TRT (Vincent only) */}
      {isVincent && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Syringe size={16} className="text-blue-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>TRT Protokoll</p>
          </div>
          <div className="text-sm flex flex-col gap-1" style={{ color: "var(--text2)" }}>
            <div className="flex justify-between"><span>Dosis</span><span style={{ color: "var(--text)" }}>120mg/Woche</span></div>
            <div className="flex justify-between"><span>Frequenz</span><span style={{ color: "var(--text)" }}>2x (Mi + Sa)</span></div>
            <div className="flex justify-between"><span>Pro Injektion</span><span style={{ color: "var(--text)" }}>0.2ml / 60mg</span></div>
          </div>
        </Card>
      )}

      {/* Menu Links */}
      <Card className="!px-0 !py-0 overflow-hidden">
        {[
          { icon: Save, label: "Daten bearbeiten", action: () => setEditing(!editing), chevron: true },
          { icon: BarChart3, label: "Wochen-Report", href: "/report" },
          { icon: BookOpen, label: "Tages-Journal", href: "/journal" },
          { icon: Settings, label: "Einstellungen", href: "/einstellungen" },
          { icon: Download, label: "Daten exportieren", action: () => {
            const d = { user: userKey, exportedAt: new Date().toISOString() };
            const b = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
            const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `julius-export.json`; a.click(); URL.revokeObjectURL(u);
            setToast("Export gestartet");
          }},
          { icon: HelpCircle, label: "Hilfe & Feedback", action: () => setToast("julius@busch.family") },
        ].map((item, i) => {
          const content = (
            <div className="flex items-center justify-between px-6 py-3.5 transition-colors"
              style={{ borderBottom: i < 5 ? "1px solid var(--card-border)" : "none" }}>
              <div className="flex items-center gap-3">
                <item.icon size={18} style={{ color: "var(--text3)" }} />
                <span className="text-sm" style={{ color: "var(--text)" }}>{item.label}</span>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text3)" }} />
            </div>
          );
          if (item.href) return <Link key={item.label} href={item.href}>{content}</Link>;
          return <button key={item.label} onClick={item.action} className="w-full text-left">{content}</button>;
        })}

        {/* Dark Mode Toggle inline */}
        <div className="flex items-center justify-between px-6 py-3.5" style={{ borderBottom: "1px solid var(--card-border)" }}>
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={18} style={{ color: "var(--text3)" }} /> : <Sun size={18} style={{ color: "var(--text3)" }} />}
            <span className="text-sm" style={{ color: "var(--text)" }}>Dark Mode</span>
          </div>
          <button onClick={toggleTheme}
            className={`w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-emerald-500" : "bg-slate-400"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Version */}
        <div className="flex items-center justify-between px-6 py-3.5">
          <span className="text-sm" style={{ color: "var(--text3)" }}>Version</span>
          <span className="text-xs" style={{ color: "var(--text3)" }}>Julius v1.0</span>
        </div>
      </Card>

      {/* Edit Form (collapsible) */}
      {editing && (
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Daten bearbeiten</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs" style={{ color: "var(--text2)" }}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Geburtsdatum</label>
                <input type="date" value={geburtsdatum} onChange={(e) => setGeburtsdatum(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Geschlecht</label>
                <select value={geschlecht} onChange={(e) => setGeschlecht(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
                  <option value="M">Maennlich</option>
                  <option value="F">Weiblich</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Groesse</label>
                <input type="number" value={groesse} onChange={(e) => setGroesse(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Gewicht</label>
                <input type="number" step="0.1" value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Ziel kg</label>
                <input type="number" step="0.1" value={zielgewicht} onChange={(e) => setZielgewicht(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              </div>
            </div>

            <p className="text-xs mt-2" style={{ color: "var(--text2)" }}>Ziele</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => (
                <button key={g} onClick={() => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={{
                    background: goals.includes(g) ? "var(--accent)" : "var(--input-bg)",
                    color: goals.includes(g) ? "#0D1117" : "var(--text2)",
                    borderColor: goals.includes(g) ? "var(--accent)" : "var(--input-border)",
                  }}>
                  {g}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Eigenes Ziel..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs border" style={inputStyle}
              onKeyDown={(e) => { if (e.key === "Enter" && customGoal.trim()) { setGoals([...goals, customGoal.trim()]); setCustomGoal(""); } }} />

            <button onClick={saveProfile}
              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-sm font-medium rounded-xl"
              style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
              <Save size={16} /> Speichern
            </button>
          </div>
        </Card>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
