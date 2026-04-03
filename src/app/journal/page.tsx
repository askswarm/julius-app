"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Wine, Coffee, Flame, Brain, Monitor, Pill, TreePine } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { calculateCorrelations } from "@/lib/correlations";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import Toast from "@/components/Toast";

interface JournalData {
  alkohol?: boolean;
  koffein_letzte?: string;
  sauna?: boolean;
  meditation?: boolean;
  bildschirm_spaet?: boolean;
  supplements_komplett?: boolean;
  stress_level?: number;
  outdoor_zeit?: string;
}

interface Insight { label: string; delta: number; metric: string; positive: boolean; }

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? "rgba(126,226,184,0.15)" : "var(--subtle-bg)",
        color: active ? "var(--accent)" : "var(--text3)",
        border: `1px solid ${active ? "var(--accent)" : "var(--card-border)"}`,
      }}>
      {label}
    </button>
  );
}

export default function JournalPage() {
  const { user } = useUser();
  const [data, setData] = useState<JournalData>({});
  const [insights, setInsights] = useState<Insight[]>([]);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/journal?chatId=${user.id}&days=30`);
      const json = await res.json();
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = (json.entries || []).find((e: { datum: string }) => e.datum === today);
      if (todayEntry) {
        setData({
          alkohol: todayEntry.alkohol,
          koffein_letzte: todayEntry.koffein_letzte,
          sauna: todayEntry.sauna,
          meditation: todayEntry.meditation,
          bildschirm_spaet: todayEntry.bildschirm_spaet,
          supplements_komplett: todayEntry.supplements_komplett,
          stress_level: todayEntry.stress_level,
          outdoor_zeit: todayEntry.outdoor_zeit,
        });
      }
      const corr = calculateCorrelations(json.entries || [], json.scores || []);
      setInsights(corr);
    } catch { /* ignore */ }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function save(updates: Partial<JournalData>) {
    const newData = { ...data, ...updates };
    setData(newData);
    setSaving(true);
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: user.id, ...newData }),
      });
      setToast("Gespeichert");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Journal</h1>
        <FamilySwitcher />
      </div>

      {/* Quick Toggles */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Heute</p>

        {/* Alkohol */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Wine size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Alkohol</span>
          </div>
          <div className="flex gap-2">
            <ToggleButton active={data.alkohol === false} label="Nein" onClick={() => save({ alkohol: false })} />
            <ToggleButton active={data.alkohol === true} label="Ja" onClick={() => save({ alkohol: true })} />
          </div>
        </div>

        {/* Koffein */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Coffee size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Koffein letzte Tasse</span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {[
              { val: "kein", label: "Kein" },
              { val: "vor_12", label: "<12h" },
              { val: "12_15", label: "12-15h" },
              { val: "nach_15", label: ">15h" },
            ].map((o) => (
              <ToggleButton key={o.val} active={data.koffein_letzte === o.val} label={o.label} onClick={() => save({ koffein_letzte: o.val })} />
            ))}
          </div>
        </div>

        {/* Sauna */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Flame size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Sauna</span>
          </div>
          <div className="flex gap-2">
            <ToggleButton active={data.sauna === false} label="Nein" onClick={() => save({ sauna: false })} />
            <ToggleButton active={data.sauna === true} label="Ja" onClick={() => save({ sauna: true })} />
          </div>
        </div>

        {/* Meditation */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Meditation</span>
          </div>
          <div className="flex gap-2">
            <ToggleButton active={data.meditation === false} label="Nein" onClick={() => save({ meditation: false })} />
            <ToggleButton active={data.meditation === true} label="Ja" onClick={() => save({ meditation: true })} />
          </div>
        </div>

        {/* Bildschirm nach 21 */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Monitor size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Bildschirm nach 21h</span>
          </div>
          <div className="flex gap-2">
            <ToggleButton active={data.bildschirm_spaet === false} label="Nein" onClick={() => save({ bildschirm_spaet: false })} />
            <ToggleButton active={data.bildschirm_spaet === true} label="Ja" onClick={() => save({ bildschirm_spaet: true })} />
          </div>
        </div>

        {/* Supplements */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Pill size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Supplements komplett</span>
          </div>
          <div className="flex gap-2">
            <ToggleButton active={data.supplements_komplett === false} label="Nein" onClick={() => save({ supplements_komplett: false })} />
            <ToggleButton active={data.supplements_komplett === true} label="Ja" onClick={() => save({ supplements_komplett: true })} />
          </div>
        </div>

        {/* Stress Level */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm" style={{ color: "var(--text)" }}>Stress-Level</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <button key={level} onClick={() => save({ stress_level: level })}
                className="w-8 h-8 rounded-full text-xs font-medium transition-all"
                style={{
                  background: data.stress_level === level
                    ? level <= 2 ? "rgba(16,185,129,0.2)" : level <= 3 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"
                    : "var(--subtle-bg)",
                  color: data.stress_level === level
                    ? level <= 2 ? "#10B981" : level <= 3 ? "#F59E0B" : "#EF4444"
                    : "var(--text3)",
                  border: `1px solid ${data.stress_level === level ? "currentColor" : "var(--card-border)"}`,
                }}>
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Outdoor */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <TreePine size={16} style={{ color: "var(--text3)" }} />
            <span className="text-sm" style={{ color: "var(--text)" }}>Outdoor-Zeit</span>
          </div>
          <div className="flex gap-1">
            {[
              { val: "unter_30", label: "<30m" },
              { val: "30_60", label: "30-60m" },
              { val: "ueber_60", label: ">60m" },
            ].map((o) => (
              <ToggleButton key={o.val} active={data.outdoor_zeit === o.val} label={o.label} onClick={() => save({ outdoor_zeit: o.val })} />
            ))}
          </div>
        </div>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Deine Insights</p>
          <div className="flex flex-col gap-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                {insight.positive
                  ? <TrendingUp size={16} style={{ color: "#10B981" }} />
                  : <TrendingDown size={16} style={{ color: "#EF4444" }} />}
                <span className="text-sm flex-1" style={{ color: "var(--text)" }}>
                  {insight.label}
                </span>
                <span className="text-xs font-medium" style={{ color: insight.positive ? "#10B981" : "#EF4444" }}>
                  {insight.positive ? "+" : ""}{insight.delta} {insight.metric}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {insights.length === 0 && (
        <Card>
          <p className="text-sm text-center py-4" style={{ color: "var(--text3)" }}>
            Insights erscheinen nach 7+ Tagen Journal-Eintraegen.
          </p>
        </Card>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
