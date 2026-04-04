"use client";

import { useEffect, useState, useCallback } from "react";
import { Syringe, Plus, AlertTriangle, Check } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { INJECTION_SITES, CATEGORY_COLORS, FREQUENCY_LABELS, PEPTIDE_HALFLIVES } from "@/lib/peptideDefaults";
import Card from "@/components/Card";
import Toast from "@/components/Toast";
import PeptideWizard from "@/components/PeptideWizard";

interface Vial {
  id: number;
  peptide_name: string;
  category?: string;
  concentration_mg_ml: number;
  total_volume_ml: number;
  remaining_volume_ml: number;
  dose_mcg?: number;
  frequency?: string;
}

interface Cycle {
  peptide_name: string;
  cycle_start: string;
  planned_duration_days: number;
}

interface TodayLog {
  peptide_name: string;
}

export default function PeptideTracker() {
  const { user } = useUser();
  const [vials, setVials] = useState<Vial[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [todayLogs, setTodayLogs] = useState<TodayLog[]>([]);
  const [toast, setToast] = useState("");
  const [logging, setLogging] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [logSite, setLogSite] = useState<Record<number, string>>({});

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
    const site = logSite[vial.id] || INJECTION_SITES[0];
    setLogging(vial.peptide_name);

    const doseMcg = vial.dose_mcg || (vial.concentration_mg_ml * 0.1 * 1000);
    const volMl = vial.concentration_mg_ml > 0 ? doseMcg / (vial.concentration_mg_ml * 1000) : 0.1;

    try {
      await fetch("/api/peptides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_injection",
          chatId: user.id,
          peptide_name: vial.peptide_name,
          dosis_mcg: doseMcg,
          volume_ml: volMl,
          injection_site: site,
          vial_id: vial.id,
        }),
      });
      setToast(`${vial.peptide_name} — ${site}`);
      load();
    } catch { /* ignore */ }
    setLogging(null);
  }

  const loggedToday = new Set(todayLogs.map((l) => l.peptide_name));

  return (
    <>
      {vials.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Syringe size={16} style={{ color: "var(--accent2)" }} />
              <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Peptide</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {vials.map((v) => {
              const pct = v.total_volume_ml > 0 ? (v.remaining_volume_ml / v.total_volume_ml) * 100 : 0;
              const doseMcg = v.dose_mcg || (v.concentration_mg_ml * 0.1 * 1000);
              const volMl = v.concentration_mg_ml > 0 ? doseMcg / (v.concentration_mg_ml * 1000) : 0.1;
              const dosesLeft = volMl > 0 ? Math.floor(v.remaining_volume_ml / volMl) : 0;
              const isLow = dosesLeft <= 3;
              const done = loggedToday.has(v.peptide_name);
              const cycle = cycles.find((c) => c.peptide_name === v.peptide_name);
              const cycleDay = cycle ? Math.floor((Date.now() - new Date(cycle.cycle_start).getTime()) / 86400000) + 1 : null;
              const catColor = CATEGORY_COLORS[v.category || ""] || "var(--accent)";

              return (
                <div key={v.id} className="p-3 rounded-xl" style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{v.peptide_name}</span>
                    {v.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: catColor + "20", color: catColor }}>{v.category}</span>}
                    {isLow && <AlertTriangle size={12} style={{ color: "#F59E0B" }} />}
                  </div>

                  {/* Cycle + Vial bars */}
                  <div className="flex flex-col gap-1.5 mb-2">
                    {cycleDay != null && cycle && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5" style={{ color: "var(--text3)" }}>
                          <span>Zyklus</span><span>Tag {cycleDay}/{cycle.planned_duration_days}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bar-bg)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((cycleDay / cycle.planned_duration_days) * 100, 100)}%`, background: "var(--accent)" }} />
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5" style={{ color: "var(--text3)" }}>
                        <span>Vial</span><span>{dosesLeft} Dosen</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bar-bg)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 50 ? "#10B981" : pct > 20 ? "#F59E0B" : "#EF4444" }} />
                      </div>
                    </div>
                  </div>

                  {/* Site selector */}
                  {!done && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {INJECTION_SITES.slice(0, 4).map((s) => (
                        <button key={s} onClick={() => setLogSite({ ...logSite, [v.id]: s })}
                          className="text-[9px] px-2 py-1 rounded-full transition-all"
                          style={{
                            background: (logSite[v.id] || INJECTION_SITES[0]) === s ? "var(--accent)" : "var(--subtle-bg)",
                            color: (logSite[v.id] || INJECTION_SITES[0]) === s ? "#0D1117" : "var(--text3)",
                            border: "1px solid var(--card-border)",
                          }}>
                          {s.replace("links", "L").replace("rechts", "R")}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Log button */}
                  <button onClick={() => quickLog(v)} disabled={done || logging === v.peptide_name}
                    className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: done ? "rgba(16,185,129,0.1)" : "var(--grad-teal)",
                      color: done ? "#10B981" : "#0D1117",
                      border: done ? "1px solid rgba(16,185,129,0.2)" : "none",
                    }}>
                    {done ? <span className="flex items-center justify-center gap-1"><Check size={14} /> Heute erledigt</span> :
                      logging === v.peptide_name ? "..." : `Injiziert (${doseMcg}mcg / ${volMl.toFixed(2)}ml)`}
                  </button>

                  {/* Decay curve */}
                  {PEPTIDE_HALFLIVES[v.peptide_name] && (
                    <div className="mt-2">
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={(() => {
                          const hl = PEPTIDE_HALFLIVES[v.peptide_name];
                          const isLong = hl > 24;
                          const steps = 24;
                          const span = isLong ? hl * 3 : 48; // hours
                          const pts = [];
                          for (let i = 0; i <= steps; i++) {
                            const t = (i / steps) * span;
                            let level = 0;
                            // Simulate 3 injections
                            const interval = isLong ? hl * 1.5 : (v.frequency === "2x_daily" ? 12 : 24);
                            for (let inj = 0; inj < 4; inj++) {
                              const since = t - inj * interval;
                              if (since >= 0) level += Math.exp(-0.693 * since / hl);
                            }
                            pts.push({ t: isLong ? `${Math.round(t / 24)}d` : `${Math.round(t)}h`, v: Math.round(level * 100) });
                          }
                          return pts;
                        })()}>
                          <defs>
                            <linearGradient id={`decay-${v.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={catColor} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={catColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="t" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                          <YAxis hide />
                          <Area type="monotone" dataKey="v" stroke={catColor} fill={`url(#decay-${v.id})`} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add new peptide button */}
      <button onClick={() => setShowWizard(true)}
        className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
        style={{ background: "var(--subtle-bg)", color: "var(--accent)", border: "1px dashed var(--card-border)" }}>
        <Plus size={16} /> Neues Peptid anlegen
      </button>

      {showWizard && (
        <PeptideWizard chatId={user.id} onClose={() => setShowWizard(false)} onCreated={load} />
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </>
  );
}
