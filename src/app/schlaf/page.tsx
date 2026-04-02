"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getScoreHistory } from "@/lib/queries";
import { COLORS } from "@/lib/constants";
import { SLEEP_HERO } from "@/lib/images";
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
    <Card className="border-l-4 border-emerald-500">
      <p className="text-sm">Exzellent. Routine beibehalten.</p>
    </Card>
  );
  if (score >= 70) return (
    <Card className="border-l-4 border-amber-500">
      <p className="text-sm">Solide Basis. Schlafzimmer auf 18C kuehlen. Glycin + Magnesium nicht vergessen.</p>
    </Card>
  );
  return (
    <Card className="border-l-4 border-red-500">
      <p className="text-sm">Bildschirme ab 21:00 ausschalten. Glycin + Magnesium erhoehen. Kein Koffein nach 12 Uhr.</p>
    </Card>
  );
}

export default function SchlafPage() {
  const { user } = useUser();
  const [today, setToday] = useState<DailyScore | null>(null);
  const [history, setHistory] = useState<DailyScore[]>([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    getTodayScores(user.id).then(setToday);
    getScoreHistory(user.id, days).then(setHistory);
  }, [user.id, days]);

  const statusColor = STATUS_COLORS[today?.day_status || "GELB"] || "#F59E0B";

  // Calculate averages
  const sleepVals = history.filter((h) => h.sleep).map((h) => h.sleep!);
  const readyVals = history.filter((h) => h.readiness).map((h) => h.readiness!);
  const avgSleep = sleepVals.length ? Math.round(sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) : null;
  const avgReady = readyVals.length ? Math.round(readyVals.reduce((a, b) => a + b, 0) / readyVals.length) : null;
  const worstNight = history.reduce((min, h) => (!min || (h.sleep && h.sleep < (min.sleep || 999)) ? h : min), null as DailyScore | null);

  // Chart data
  const chartData = history.map((h) => ({
    date: h.datum?.slice(5) || "",
    schlaf: h.sleep,
    readiness: h.readiness,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Schlaf</h1>
        <FamilySwitcher />
      </div>

      {/* Hero Score with image */}
      <div className="rounded-[20px] overflow-hidden relative" style={{ minHeight: 280 }}>
        <img src={SLEEP_HERO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(13,17,23,0.7)" }} />
        <div className="relative flex flex-col items-center py-8">
        <ScoreRing value={today?.sleep ?? null} label="Schlaf-Score" color={COLORS.primary} size={120} />
        <div className="mt-4 flex gap-6 text-center">
          <div>
            <p className="text-lg font-semibold">{today?.readiness ?? "--"}</p>
            <p className="text-xs text-slate-500">Readiness</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{avgSleep ?? "--"}</p>
            <p className="text-xs text-slate-500">7T Schnitt</p>
          </div>
        </div>
        {today?.day_status && (
          <span
            className="mt-3 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: statusColor }}
          >
            {STATUS_LABELS[today.day_status] || today.day_status}
          </span>
        )}
      </div></div>

      {/* Trend Chart */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Schlaf-Trend</h3>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 text-xs rounded ${days === d ? "bg-blue-100 dark:bg-blue-900 text-blue-600" : "text-slate-400"}`}
              >
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
          <p className="text-sm text-slate-400 text-center py-8">Noch keine Daten. Sende deine Oura-Scores morgens an Julius.</p>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-slate-500">Schlaf-Schnitt</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{avgSleep ?? "--"}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Readiness-Schnitt</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.green }}>{avgReady ?? "--"}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Tage getrackt</p>
          <p className="text-2xl font-bold">{history.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Schlechteste Nacht</p>
          <p className="text-2xl font-bold text-red-500">{worstNight?.sleep ?? "--"}</p>
          <p className="text-[10px] text-slate-400">{worstNight?.datum?.slice(5) || ""}</p>
        </Card>
      </div>

      {/* Sleep Tip */}
      <SleepTip score={today?.sleep ?? avgSleep} />
    </div>
  );
}
