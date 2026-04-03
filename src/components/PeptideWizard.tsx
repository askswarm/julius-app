"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PEPTIDE_PRESETS, CATEGORY_COLORS, FREQUENCY_LABELS, TIMING_LABELS, type PeptidePreset } from "@/lib/peptideDefaults";
import Card from "./Card";

interface Props {
  chatId: number;
  onClose: () => void;
  onCreated: () => void;
}

export default function PeptideWizard({ chatId, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [preset, setPreset] = useState<PeptidePreset | null>(null);
  const [customName, setCustomName] = useState("");

  // Step 2
  const [vialMg, setVialMg] = useState(5);
  const [reconMl, setReconMl] = useState(2);
  const [storage, setStorage] = useState("fridge");

  // Step 3
  const [doseMcg, setDoseMcg] = useState(250);
  const [frequency, setFrequency] = useState("1x_daily");
  const [timing, setTiming] = useState("morning");
  const [fasting, setFasting] = useState(false);

  // Step 4
  const [cycleOn, setCycleOn] = useState(28);
  const [cycleOff, setCycleOff] = useState(14);

  function selectPreset(p: PeptidePreset) {
    setPreset(p);
    setVialMg(p.typical_vial_mg);
    setReconMl(p.typical_recon_ml);
    setDoseMcg(p.typical_dose_mcg);
    setFrequency(p.frequency);
    setTiming(p.timing);
    setFasting(p.fasting_required);
    setCycleOn(p.cycle_on_days);
    setCycleOff(p.cycle_off_days);
    setStorage(p.storage);
    setStep(2);
  }

  // Calculations
  const concMgMl = reconMl > 0 ? vialMg / reconMl : 0;
  const concMcgMl = concMgMl * 1000;
  const doseVolMl = concMcgMl > 0 ? doseMcg / concMcgMl : 0;
  const dosesPerVial = doseVolMl > 0 ? Math.floor(reconMl / doseVolMl) : 0;

  const name = preset?.name || customName;

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/peptides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_vial",
          chatId,
          peptide_name: name,
          concentration_mg_ml: concMgMl,
          total_volume_ml: reconMl,
          storage,
        }),
      });
      if (cycleOn > 0) {
        await fetch("/api/peptides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start_cycle",
            chatId,
            peptide_name: name,
            planned_duration_days: cycleOn,
            frequency,
          }),
        });
      }
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ background: "var(--card)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Neues Peptid</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text3)" }} /></button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="w-2 h-2 rounded-full transition-all" style={{ background: s === step ? "var(--accent)" : "var(--bar-bg)", width: s === step ? 16 : 8 }} />
          ))}
        </div>

        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
          {/* STEP 1 — Choose preset */}
          {step === 1 && (
            <div className="flex flex-col gap-2">
              {PEPTIDE_PRESETS.map((p) => (
                <button key={p.name} onClick={() => selectPreset(p)} className="text-left p-3 rounded-2xl transition-all"
                  style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{p.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: (CATEGORY_COLORS[p.category] || "#999") + "20", color: CATEGORY_COLORS[p.category] }}>{p.category}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{p.description}</p>
                </button>
              ))}
              <button onClick={() => { setPreset(null); setStep(2); }} className="p-3 rounded-2xl text-left"
                style={{ border: "2px dashed var(--card-border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>+ Custom Peptid</p>
              </button>
            </div>
          )}

          {/* STEP 2 — Vial config */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {!preset && (
                <div>
                  <label className="text-xs" style={{ color: "var(--text2)" }}>Name</label>
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="z.B. BPC-157"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--text2)" }}>Vial (mg)</label>
                  <input type="number" value={vialMg} onChange={(e) => setVialMg(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--text2)" }}>Rekon. (ml)</label>
                  <input type="number" step="0.5" value={reconMl} onChange={(e) => setReconMl(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                </div>
              </div>
              {/* Live calculation */}
              <div className="p-3 rounded-xl" style={{ background: "var(--subtle-bg)" }}>
                <p className="text-xs" style={{ color: "var(--accent)" }}>Konzentration: {concMgMl.toFixed(1)} mg/ml = {Math.round(concMcgMl)} mcg/ml</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>Dosis ({doseMcg}mcg) = {doseVolMl.toFixed(2)} ml</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>Dosen pro Vial: ~{dosesPerVial}</p>
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Lagerung</label>
                <div className="flex gap-2 mt-1">
                  {["fridge", "room", "freezer"].map((s) => (
                    <button key={s} onClick={() => setStorage(s)} className="flex-1 py-2 rounded-lg text-xs font-medium"
                      style={{ background: storage === s ? "var(--accent)" : "var(--subtle-bg)", color: storage === s ? "#0D1117" : "var(--text3)" }}>
                      {s === "fridge" ? "Kuehlschrank" : s === "room" ? "Raum" : "Tiefkuehl"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Dosierung */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Dosis (mcg)</label>
                <input type="number" value={doseMcg} onChange={(e) => setDoseMcg(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                <p className="text-[10px] mt-1" style={{ color: "var(--accent)" }}>= {doseVolMl.toFixed(2)} ml pro Injektion</p>
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Frequenz</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setFrequency(k)} className="px-3 py-1.5 rounded-full text-xs"
                      style={{ background: frequency === k ? "var(--accent)" : "var(--subtle-bg)", color: frequency === k ? "#0D1117" : "var(--text3)" }}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text2)" }}>Timing</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(TIMING_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setTiming(k)} className="px-3 py-1.5 rounded-full text-xs"
                      style={{ background: timing === k ? "var(--accent)" : "var(--subtle-bg)", color: timing === k ? "#0D1117" : "var(--text3)" }}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text)" }}>Nuechtern erforderlich</span>
                <button onClick={() => setFasting(!fasting)}
                  className={`w-11 h-6 rounded-full transition-colors ${fasting ? "bg-emerald-500" : "bg-slate-400"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${fasting ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {preset?.stacking_notes && (
                <p className="text-xs p-2 rounded-lg" style={{ background: "var(--subtle-bg)", color: "var(--text2)" }}>{preset.stacking_notes}</p>
              )}
            </div>
          )}

          {/* STEP 4 — Zyklus */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--text2)" }}>Zyklus (Tage)</label>
                  <input type="number" value={cycleOn} onChange={(e) => setCycleOn(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--text2)" }}>Pause (Tage)</label>
                  <input type="number" value={cycleOff} onChange={(e) => setCycleOff(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
                </div>
              </div>
              {cycleOn > 0 && (
                <p className="text-xs p-2 rounded-lg" style={{ background: "var(--subtle-bg)", color: "var(--accent)" }}>
                  {cycleOn} Tage on → {cycleOff} Tage off → wiederholen
                </p>
              )}
              {cycleOn === 0 && <p className="text-xs" style={{ color: "var(--text3)" }}>Kein Zyklus — Dauerhaft oder bei Bedarf</p>}
            </div>
          )}

          {/* STEP 5 — Confirm */}
          {step === 5 && (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-2xl" style={{ background: "var(--subtle-bg)" }}>
                <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{name}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs" style={{ color: "var(--text2)" }}>
                  <span>Vial: {vialMg}mg / {reconMl}ml</span>
                  <span>Konzentration: {concMgMl.toFixed(1)}mg/ml</span>
                  <span>Dosis: {doseMcg}mcg ({doseVolMl.toFixed(2)}ml)</span>
                  <span>Dosen/Vial: ~{dosesPerVial}</span>
                  <span>Frequenz: {FREQUENCY_LABELS[frequency] || frequency}</span>
                  <span>Timing: {TIMING_LABELS[timing] || timing}</span>
                  {cycleOn > 0 && <span>Zyklus: {cycleOn}d on / {cycleOff}d off</span>}
                  <span>Lagerung: {storage === "fridge" ? "Kuehlschrank" : storage}</span>
                </div>
              </div>
              <button onClick={save} disabled={saving || !name}
                className="w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: name ? "var(--grad-teal)" : "var(--text3)", color: "#0D1117" }}>
                {saving ? "Wird angelegt..." : "Peptid anlegen"}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step > 1 && (
          <div className="flex gap-3 px-6 pb-6" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm"
              style={{ color: "var(--text2)" }}>
              <ChevronLeft size={16} /> Zurueck
            </button>
            {step < 5 && (
              <button onClick={() => setStep(step + 1)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--accent)", color: "#0D1117" }}>
                Weiter <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
