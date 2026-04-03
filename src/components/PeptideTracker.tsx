"use client";

import { useEffect, useState, useCallback } from "react";
import { Syringe, Plus, AlertTriangle, Check } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import Card from "@/components/Card";
import Toast from "@/components/Toast";

interface Vial {
  id: number;
  peptide_name: string;
  concentration_mg_ml: number;
  total_volume_ml: number;
  remaining_volume_ml: number;
  reconstitution_date: string;
}

interface Cycle {
  id: number;
  peptide_name: string;
  cycle_start: string;
  planned_duration_days: number;
  frequency: string;
}

interface TodayLog {
  peptide_name: string;
  dosis_mcg: number;
  injection_site: string;
}

const INJECTION_SITES = ["Bauch links", "Bauch rechts", "Oberschenkel links", "Oberschenkel rechts", "Deltamuskel"];

export default function PeptideTracker() {
  const { user } = useUser();
  const [vials, setVials] = useState<Vial[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [todayLogs, setTodayLogs] = useState<TodayLog[]>([]);
  const [toast, setToast] = useState("");
  const [logging, setLogging] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/peptides?chatId=${user.id}`);
      const data = await res.json();
      setVials(data.vials || []);
      setCycles(data.cycles || []);
      setTodayLogs(data.todayLogs || []);
    } catch { /* ignore */ }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function quickLog(vial: Vial) {
    setLogging(vial.peptide_name);
    const doseMcg = vial.concentration_mg_ml * 0.1 * 1000; // 0.1ml standard dose
    const site = INJECTION_SITES[Math.floor(Math.random() * INJECTION_SITES.length)];

    try {
      await fetch("/api/peptides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_injection",
          chatId: user.id,
          peptide_name: vial.peptide_name,
          dosis_mcg: doseMcg,
          volume_ml: 0.1,
          injection_site: site,
          vial_id: vial.id,
        }),
      });
      setToast(`${vial.peptide_name} geloggt — ${site}`);
      load();
    } catch { /* ignore */ }
    setLogging(null);
  }

  if (vials.length === 0 && cycles.length === 0) return null;

  const loggedToday = new Set(todayLogs.map((l) => l.peptide_name));

  return (
    <>
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Syringe size={16} style={{ color: "var(--accent2)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Peptide</p>
        </div>

        <div className="flex flex-col gap-2">
          {vials.map((v) => {
            const pct = (v.remaining_volume_ml / v.total_volume_ml) * 100;
            const dosesLeft = Math.floor(v.remaining_volume_ml / 0.1);
            const isLow = dosesLeft <= 3;
            const done = loggedToday.has(v.peptide_name);

            // Find matching cycle
            const cycle = cycles.find((c) => c.peptide_name === v.peptide_name);
            const cycleDay = cycle ? Math.floor((Date.now() - new Date(cycle.cycle_start).getTime()) / 86400000) + 1 : null;

            return (
              <div key={v.id} className="flex items-center gap-3 py-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{v.peptide_name}</p>
                    {isLow && <AlertTriangle size={12} style={{ color: "#F59E0B" }} />}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: "var(--text3)" }}>{dosesLeft} Dosen uebrig</span>
                    {cycleDay && cycle && (
                      <span className="text-[10px]" style={{ color: "var(--accent2)" }}>Tag {cycleDay}/{cycle.planned_duration_days}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 rounded-full mt-1.5" style={{ background: "var(--bar-bg)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isLow ? "#F59E0B" : "var(--accent)" }} />
                  </div>
                </div>

                <button onClick={() => quickLog(v)} disabled={done || logging === v.peptide_name}
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-all flex-shrink-0"
                  style={{
                    background: done ? "rgba(16,185,129,0.1)" : "var(--subtle-bg)",
                    border: `1px solid ${done ? "#10B981" : "var(--card-border)"}`,
                    color: done ? "#10B981" : "var(--text3)",
                  }}>
                  {done ? <Check size={16} /> : <Syringe size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </>
  );
}
