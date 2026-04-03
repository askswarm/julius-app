"use client";

import { useEffect, useState, useCallback } from "react";
import { Syringe, Save } from "lucide-react";
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

  const [toast, setToast] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [name, setName] = useState(user.name);
  const [geburtsdatum, setGeburtsdatum] = useState(isVincent ? "1987-03-15" : "1984-06-20");
  const [geschlecht, setGeschlecht] = useState(user.geschlecht);
  const [groesse, setGroesse] = useState(user.groesse_cm);
  const [gewicht, setGewicht] = useState(user.gewicht_kg);
  const [zielgewicht, setZielgewicht] = useState(isVincent ? 80 : 55);
  const [goals, setGoals] = useState<string[]>(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  const [customGoal, setCustomGoal] = useState("");

  useEffect(() => {
    setName(user.name);
    setGeschlecht(user.geschlecht);
    setGroesse(user.groesse_cm);
    setGewicht(user.gewicht_kg);
    setGeburtsdatum(isVincent ? "1987-03-15" : "1984-06-20");
    setZielgewicht(isVincent ? 80 : 55);
    setGoals(isVincent ? ["VO2max", "Muskelerhalt", "Longevity", "HYROX"] : ["Muskelaufbau", "HYROX", "Longevity"]);
  }, [user, isVincent]);

  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  const alter = geburtsdatum ? differenceInYears(new Date(), new Date(geburtsdatum)) : user.alter_jahre;
  const bmi = (gewicht / ((groesse / 100) ** 2)).toFixed(1);

  async function saveProfile() {
    const { error } = await supabase.from("users").update({
      name, geschlecht, groesse_cm: groesse, gewicht_kg: gewicht, alter_jahre: alter, ziele: goals,
    }).eq("id", user.id);
    if (!error) setToast("Profil gespeichert");
  }

  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 py-6">
        <AvatarUpload chatId={user.id} name={name} currentUrl={avatarUrl || undefined}
          onUpload={(url) => { setAvatarUrl(url); setToast("Foto gespeichert"); }} />
        <h1 className="text-2xl font-semibold mt-2" style={{ color: "var(--text)" }}>{name}</h1>
        <p className="text-sm" style={{ color: "var(--text2)" }}>{alter}J · {groesse}cm · {gewicht}kg · BMI {bmi}</p>
      </div>

      <FamilySwitcher />

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Persoenliche Daten</h3>
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
              <label className="text-xs" style={{ color: "var(--text2)" }}>Groesse (cm)</label>
              <input type="number" value={groesse} onChange={(e) => setGroesse(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--text2)" }}>Gewicht (kg)</label>
              <input type="number" step="0.1" value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--text2)" }}>Ziel (kg)</label>
              <input type="number" step="0.1" value={zielgewicht} onChange={(e) => setZielgewicht(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>
          </div>
          <button onClick={saveProfile}
            className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
            <Save size={16} /> Speichern
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Ziele</h3>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button key={g} onClick={() => toggleGoal(g)}
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
        <div className="flex gap-2 mt-3">
          <input type="text" placeholder="Eigenes Ziel..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs border" style={inputStyle}
            onKeyDown={(e) => { if (e.key === "Enter" && customGoal.trim()) { setGoals([...goals, customGoal.trim()]); setCustomGoal(""); } }}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Metriken</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{bmi}</p><p className="text-xs" style={{ color: "var(--text2)" }}>BMI</p></div>
          <div><p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{user.protein_ziel_g}<span className="text-sm" style={{ color: "var(--text3)" }}>g</span></p><p className="text-xs" style={{ color: "var(--text2)" }}>Protein/Tag</p></div>
          <div><p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{user.kcal_training}</p><p className="text-xs" style={{ color: "var(--text2)" }}>kcal Training</p></div>
          <div><p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{user.wasser_ziel_ml / 1000}<span className="text-sm" style={{ color: "var(--text3)" }}>L</span></p><p className="text-xs" style={{ color: "var(--text2)" }}>Wasser/Tag</p></div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Autophagie / Fasten</h3>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text2)" }}>Essensfenster</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>{user.essensfenster_start} – {user.essensfenster_ende}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span style={{ color: "var(--text2)" }}>Fastendauer</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>{isVincent ? "15" : "14"} Stunden</span>
        </div>
      </Card>

      {isVincent && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Syringe size={16} className="text-blue-500" />
            <h3 className="text-sm font-medium" style={{ color: "var(--text)" }}>TRT Protokoll</h3>
          </div>
          <div className="text-sm flex flex-col gap-1" style={{ color: "var(--text2)" }}>
            <div className="flex justify-between"><span>Dosis</span><span style={{ color: "var(--text)" }}>120mg/Woche</span></div>
            <div className="flex justify-between"><span>Frequenz</span><span style={{ color: "var(--text)" }}>2x (Mi + Sa)</span></div>
            <div className="flex justify-between"><span>Pro Injektion</span><span style={{ color: "var(--text)" }}>0.2ml / 60mg</span></div>
          </div>
        </Card>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
