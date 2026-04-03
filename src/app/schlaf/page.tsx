"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getScoreHistory, getTodayOura, getOuraHistory } from "@/lib/queries";
import { COLORS } from "@/lib/constants";
import { getSleepHero } from "@/lib/images";
import type { DailyScore } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import Card from "@/components/Card";

const STATUS_COLORS: Record<string, string> = { GRUEN: "#10B981", GELB: "#F59E0B", ROT: "#EF4444", ALARM: "#DC2626" };
const STATUS_LABELS: Record<string, string> = { GRUEN: "Optimal", GELB: "Solide", ROT: "Recovery noetig", ALARM: "Ruhetag" };

const PHASE_COLORS: Record<string, string> = { "1": "#1E3A5F", "2": "#60A5FA", "3": "#7C3AED", "4": "#EF4444" };
const PHASE_LABELS: Record<string, string> = { "1": "Deep", "2": "Light", "3": "REM", "4": "Wach" };

function Hypnogram({ data, start, end }: { data: string; start: string; end: string }) {
  if (!data) return null;
  const phases = data.split("");
  const startTime = start ? new Date(start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
  const endTime = end ? new Date(end).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";

  // Map phase to y-position (inverted: deep at bottom)
  const yMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };

  return (
    <div>
      <div className="flex items-end h-20 gap-px rounded-lg overflow-hidden" style={{ background: "var(--bar-bg)" }}>
        {phases.map((p, i) => (
          <div key={i} className="flex-1" style={{
            background: PHASE_COLORS[p] || "var(--text3)",
            height: `${((4 - yMap[p]) / 4) * 100}%`,
            minWidth: 1,
            transition: "height 0.2s",
          }} />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[9px]" style={{ color: "var(--text3)" }}>
        <span>{startTime}</span>
        <span>{endTime}</span>
      </div>
    </div>
  );
}

function SleepTip({ score }: { score: number | null }) {
  if (!score) return null;
  if (score >= 85) return <Card className="border-l-4 border-emerald-500"><p className="text-sm">Exzellent. Routine beibehalten.</p></Card>;
  if (score >= 70) return <Card className="border-l-4 border-amber-500"><p className="text-sm">Solide Basis. Schlafzimmer 18C. Glycin + Magnesium.</p></Card>;
  return <Card className="border-l-4 border-red-500"><p className="text-sm">Bildschirme ab 21:00 aus. Glycin + Magnesium erhoehen. Kein Koffein nach 12.</p></Card>;
}

interface OuraDay {
  datum: string; sleep_score: number | null; readiness_score: number | null;
  deep_sleep_min: number | null; rem_sleep_min: number | null; light_sleep_min: number | null;
  total_sleep_min: number | null; sleep_efficiency: number | null; resting_hr: number | null;
  avg_hrv: number | null; lowest_hr: number | null; spo2_percentage: number | null;
  temperature_deviation: number | null; steps: number | null; active_calories: number | null;
}

export default function SchlafPage() {
  const { user, userKey } = useUser();
  const [today, setToday] = useState<DailyScore | null>(null);
  const [history, setHistory] = useState<DailyScore[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ouraToday, setOuraToday] = useState<any>(null);
  const [ouraHistory, setOuraHistory] = useState<OuraDay[]>([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    getTodayScores(user.id).then(setToday);
    getScoreHistory(user.id, days).then(setHistory);
    getTodayOura(user.id).then(setOuraToday);
    getOuraHistory(user.id, days).then((d) => setOuraHistory(d as OuraDay[]));
  }, [user.id, days]);

  const statusColor = STATUS_COLORS[today?.day_status || "GELB"] || "#F59E0B";
  const sleepVals = history.filter((h) => h.sleep).map((h) => h.sleep!);
  const avgSleep = sleepVals.length ? Math.round(sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) : null;

  const chartData = history.map((h) => ({ date: h.datum?.slice(5) || "", schlaf: h.sleep, readiness: h.readiness }));

  // Oura details
  const deepMin = ouraToday?.deep_sleep_min || 0;
  const remMin = ouraToday?.rem_sleep_min || 0;
  const lightMin = ouraToday?.light_sleep_min || 0;
  const awakeMin = ouraToday?.awake_min || 0;
  const totalMin = deepMin + remMin + lightMin;
  const efficiency = ouraToday?.sleep_efficiency || 0;
  const hypnogram = ouraToday?.hypnogram || "";

  // Trends
  const hrvData = ouraHistory.filter((d) => d.avg_hrv).map((d) => ({ date: d.datum?.slice(5), hrv: d.avg_hrv }));
  const hrData = ouraHistory.filter((d) => d.lowest_hr || d.resting_hr).map((d) => ({ date: d.datum?.slice(5), hr: d.lowest_hr || d.resting_hr }));
  const tempData = ouraHistory.filter((d) => d.temperature_deviation != null).map((d) => ({ date: d.datum?.slice(5), temp: d.temperature_deviation }));

  // Temperature assessment
  const tempDev = ouraToday?.temperature_deviation as number | null;
  const tempStatus = tempDev == null ? null : Math.abs(tempDev) <= 0.3 ? "normal" : tempDev > 1.0 ? "high" : "elevated";
  const tempColors = { normal: "#10B981", elevated: "#F59E0B", high: "#EF4444" };
  const tempLabels = { normal: "Normal", elevated: "Leicht erhoet — beobachten", high: "Erhoet — moegliche Erkrankung" };

  // SpO2
  const spo2 = ouraToday?.spo2_percentage as number | null;
  const spo2Status = spo2 == null ? null : spo2 >= 96 ? "normal" : spo2 >= 93 ? "low" : "critical";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Schlaf</h1>
        <FamilySwitcher />
      </div>

      {/* Hero */}
      <div className="rounded-[20px] overflow-hidden relative" style={{ minHeight: 260 }}>
        <img src={getSleepHero(userKey)} alt="" className="absolute inset-0 w-full h-full object-cover ken-burns" />
        <div className="absolute inset-0" style={{ background: "rgba(13,17,23,0.7)" }} />
        <div className="relative flex flex-col items-center py-8">
          <ScoreRing value={today?.sleep ?? null} label="Schlaf-Score" color={COLORS.primary} size={120} />
          <div className="mt-3 flex gap-4 text-center text-white">
            {totalMin > 0 && <div><p className="text-sm font-semibold">{Math.floor(totalMin / 60)}h {totalMin % 60}m</p><p className="text-[10px] text-slate-400">Gesamt</p></div>}
            {efficiency > 0 && <div><p className="text-sm font-semibold">{efficiency}%</p><p className="text-[10px] text-slate-400">Effizienz</p></div>}
            <div><p className="text-sm font-semibold">{avgSleep ?? "--"}</p><p className="text-[10px] text-slate-400">{days}T Schnitt</p></div>
          </div>
          {today?.day_status && (
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: statusColor }}>
              {STATUS_LABELS[today.day_status] || today.day_status}
            </span>
          )}
        </div>
      </div>

      {/* Hypnogram */}
      {hypnogram && (
        <Card>
          <h3 className="text-sm font-medium mb-2">Schlafphasen</h3>
          <Hypnogram data={hypnogram} start={ouraToday?.bedtime_start || ""} end={ouraToday?.bedtime_end || ""} />
          <div className="flex justify-between mt-2 text-[10px]">
            <span style={{ color: "#1E3A5F" }}>Deep: {deepMin}m</span>
            <span style={{ color: "#7C3AED" }}>REM: {remMin}m</span>
            <span style={{ color: "#60A5FA" }}>Light: {lightMin}m</span>
            {awakeMin > 0 && <span style={{ color: "#EF4444" }}>Wach: {awakeMin}m</span>}
          </div>
        </Card>
      )}

      {/* Sleep phases bar (fallback if no hypnogram) */}
      {!hypnogram && totalMin > 0 && (
        <Card>
          <h3 className="text-sm font-medium mb-2">Schlafphasen</h3>
          <div className="flex h-6 rounded-full overflow-hidden">
            {deepMin > 0 && <div style={{ width: `${(deepMin / totalMin) * 100}%`, background: "#1E3A5F" }} />}
            {remMin > 0 && <div style={{ width: `${(remMin / totalMin) * 100}%`, background: "#7C3AED" }} />}
            {lightMin > 0 && <div style={{ width: `${(lightMin / totalMin) * 100}%`, background: "#60A5FA" }} />}
          </div>
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text2)" }}>
            <span style={{ color: "#1E3A5F" }}>Deep: {deepMin}m</span>
            <span style={{ color: "#7C3AED" }}>REM: {remMin}m</span>
            <span style={{ color: "#60A5FA" }}>Light: {lightMin}m</span>
          </div>
        </Card>
      )}

      {/* HRV Trend */}
      {hrvData.length > 2 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">HRV Trend</h3>
            <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{ouraToday?.avg_hrv ? Math.round(ouraToday.avg_hrv) : "--"} ms</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={hrvData}>
              <defs>
                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7EE2B8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7EE2B8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Area type="monotone" dataKey="hrv" stroke="#7EE2B8" fill="url(#hrvGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Resting HR Trend */}
      {hrData.length > 2 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Ruhepuls Trend</h3>
            <span className="text-xs font-bold" style={{ color: "#EF4444" }}>{ouraToday?.lowest_hr || ouraToday?.resting_hr || "--"} bpm</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={hrData}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Temperature + SpO2 */}
      <div className="grid grid-cols-2 gap-3">
        {tempStatus && (
          <Card>
            <p className="text-xs" style={{ color: "var(--text3)" }}>Temperatur</p>
            <p className="text-xl font-bold" style={{ color: tempColors[tempStatus] }}>
              {tempDev! > 0 ? "+" : ""}{tempDev!.toFixed(1)}°
            </p>
            <p className="text-[10px]" style={{ color: tempColors[tempStatus] }}>{tempLabels[tempStatus]}</p>
          </Card>
        )}
        {spo2Status && (
          <Card>
            <p className="text-xs" style={{ color: "var(--text3)" }}>SpO2</p>
            <p className="text-xl font-bold" style={{ color: spo2Status === "normal" ? "#10B981" : spo2Status === "low" ? "#F59E0B" : "#EF4444" }}>
              {spo2}%
            </p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>
              {spo2Status === "normal" ? "Normal" : spo2Status === "low" ? "Leicht reduziert" : "Niedrig — Arzt konsultieren"}
            </p>
          </Card>
        )}
      </div>

      {/* Recommended bedtime */}
      {ouraToday?.recommended_bedtime && (
        <Card>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Oura empfiehlt</p>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Schlafenszeit: {ouraToday.recommended_bedtime}</p>
        </Card>
      )}

      {/* Schlaf Trend */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Schlaf-Trend</h3>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{ background: days === d ? "rgba(126,226,184,0.15)" : "transparent", color: days === d ? "var(--accent)" : "var(--text3)" }}>
                {d}T
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sleepGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Area type="monotone" dataKey="schlaf" stroke={COLORS.primary} fill="url(#sleepGrad2)" strokeWidth={2} />
              <Line type="monotone" dataKey="readiness" stroke={COLORS.green} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Oura-Ring verbinden in Einstellungen.</p>
        )}
      </Card>

      <SleepTip score={today?.sleep ?? avgSleep} />
    </div>
  );
}
