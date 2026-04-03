"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, BarChart, Bar, LineChart } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getScoreHistory, getTodayOura, getOuraHistory } from "@/lib/queries";
import { COLORS } from "@/lib/constants";
import { getSleepHero } from "@/lib/images";
import type { DailyScore } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import Card from "@/components/Card";

const STATUS_COLORS: Record<string, string> = {
  GRUEN: "#10B981", GELB: "#F59E0B", ROT: "#EF4444", ALARM: "#DC2626",
};
const STATUS_LABELS: Record<string, string> = {
  GRUEN: "Optimal", GELB: "Solide", ROT: "Recovery noetig", ALARM: "Ruhetag",
};

function SleepTip({ score }: { score: number | null }) {
  if (!score) return null;
  if (score >= 85) return (
    <Card className="border-l-4 border-emerald-500"><p className="text-sm">Exzellent. Routine beibehalten.</p></Card>
  );
  if (score >= 70) return (
    <Card className="border-l-4 border-amber-500"><p className="text-sm">Solide Basis. Schlafzimmer auf 18C kuehlen. Glycin + Magnesium nicht vergessen.</p></Card>
  );
  return (
    <Card className="border-l-4 border-red-500"><p className="text-sm">Bildschirme ab 21:00 ausschalten. Glycin + Magnesium erhoehen. Kein Koffein nach 12 Uhr.</p></Card>
  );
}

interface OuraDay {
  datum: string;
  sleep_score: number | null;
  readiness_score: number | null;
  deep_sleep_min: number | null;
  rem_sleep_min: number | null;
  light_sleep_min: number | null;
  total_sleep_min: number | null;
  sleep_efficiency: number | null;
  resting_hr: number | null;
  active_calories: number | null;
  steps: number | null;
}

export default function SchlafPage() {
  const { user, userKey } = useUser();
  const [today, setToday] = useState<DailyScore | null>(null);
  const [history, setHistory] = useState<DailyScore[]>([]);
  const [ouraToday, setOuraToday] = useState<OuraDay | null>(null);
  const [ouraHistory, setOuraHistory] = useState<OuraDay[]>([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    getTodayScores(user.id).then(setToday);
    getScoreHistory(user.id, days).then(setHistory);
    getTodayOura(user.id).then(setOuraToday);
    getOuraHistory(user.id, days).then(setOuraHistory);
  }, [user.id, days]);

  const statusColor = STATUS_COLORS[today?.day_status || "GELB"] || "#F59E0B";

  const sleepVals = history.filter((h) => h.sleep).map((h) => h.sleep!);
  const readyVals = history.filter((h) => h.readiness).map((h) => h.readiness!);
  const avgSleep = sleepVals.length ? Math.round(sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) : null;
  const avgReady = readyVals.length ? Math.round(readyVals.reduce((a, b) => a + b, 0) / readyVals.length) : null;
  const worstNight = history.reduce((min, h) => (!min || (h.sleep && h.sleep < (min.sleep || 999)) ? h : min), null as DailyScore | null);

  const chartData = history.map((h) => ({
    date: h.datum?.slice(5) || "",
    schlaf: h.sleep,
    readiness: h.readiness,
  }));

  // Sleep phases from Oura
  const hasPhases = ouraToday && (ouraToday.deep_sleep_min || ouraToday.rem_sleep_min || ouraToday.light_sleep_min);
  const totalMin = (ouraToday?.deep_sleep_min || 0) + (ouraToday?.rem_sleep_min || 0) + (ouraToday?.light_sleep_min || 0);

  // HR trend
  const hrData = ouraHistory
    .filter((d) => d.resting_hr)
    .map((d) => ({ date: d.datum?.slice(5), hr: d.resting_hr }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Schlaf</h1>
        <FamilySwitcher />
      </div>

      {/* Hero */}
      <div className="rounded-[20px] overflow-hidden relative" style={{ minHeight: 280 }}>
        <img src={getSleepHero(userKey)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(13,17,23,0.7)" }} />
        <div className="relative flex flex-col items-center py-8">
          <ScoreRing value={today?.sleep ?? null} label="Schlaf-Score" color={COLORS.primary} size={120} />
          <div className="mt-4 flex gap-6 text-center">
            <div>
              <p className="text-lg font-semibold text-white">{today?.readiness ?? "--"}</p>
              <p className="text-xs text-slate-400">Readiness</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{avgSleep ?? "--"}</p>
              <p className="text-xs text-slate-400">{days}T Schnitt</p>
            </div>
            {ouraToday?.sleep_efficiency != null && (
              <div>
                <p className="text-lg font-semibold text-white">{ouraToday.sleep_efficiency}%</p>
                <p className="text-xs text-slate-400">Effizienz</p>
              </div>
            )}
          </div>
          {today?.day_status && (
            <span className="mt-3 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: statusColor }}>
              {STATUS_LABELS[today.day_status] || today.day_status}
            </span>
          )}
        </div>
      </div>

      {/* Sleep Phases */}
      {hasPhases && (
        <Card>
          <h3 className="text-sm font-medium mb-3">Schlafphasen</h3>
          <div className="flex h-6 rounded-full overflow-hidden mb-2">
            {ouraToday!.deep_sleep_min! > 0 && (
              <div style={{ width: `${(ouraToday!.deep_sleep_min! / totalMin) * 100}%`, background: "#1E40AF" }} title="Deep" />
            )}
            {ouraToday!.rem_sleep_min! > 0 && (
              <div style={{ width: `${(ouraToday!.rem_sleep_min! / totalMin) * 100}%`, background: "#7C3AED" }} title="REM" />
            )}
            {ouraToday!.light_sleep_min! > 0 && (
              <div style={{ width: `${(ouraToday!.light_sleep_min! / totalMin) * 100}%`, background: "#38BDF8" }} title="Light" />
            )}
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: "var(--text2)" }}>
            <span style={{ color: "#1E40AF" }}>Deep: {ouraToday!.deep_sleep_min}m</span>
            <span style={{ color: "#7C3AED" }}>REM: {ouraToday!.rem_sleep_min}m</span>
            <span style={{ color: "#38BDF8" }}>Light: {ouraToday!.light_sleep_min}m</span>
            <span>Total: {Math.round(totalMin / 60)}h {totalMin % 60}m</span>
          </div>
        </Card>
      )}

      {/* Trend Chart */}
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
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="schlaf" stroke={COLORS.primary} fill="url(#sleepGrad)" strokeWidth={2} />
              <Line type="monotone" dataKey="readiness" stroke={COLORS.green} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Noch keine Daten. Oura-Ring verbinden in Einstellungen.</p>
        )}
      </Card>

      {/* Resting HR Trend */}
      {hrData.length > 2 && (
        <Card>
          <h3 className="text-sm font-medium mb-3">Ruhepuls-Trend</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={hrData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Schlaf-Schnitt</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{avgSleep ?? "--"}</p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Readiness-Schnitt</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.green }}>{avgReady ?? "--"}</p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Tage getrackt</p>
          <p className="text-2xl font-bold">{history.length}</p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Schlechteste Nacht</p>
          <p className="text-2xl font-bold text-red-500">{worstNight?.sleep ?? "--"}</p>
          <p className="text-[10px]" style={{ color: "var(--text3)" }}>{worstNight?.datum?.slice(5) || ""}</p>
        </Card>
      </div>

      <SleepTip score={today?.sleep ?? avgSleep} />
    </div>
  );
}
