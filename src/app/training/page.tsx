"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, Bike, Flame, Waves, Timer, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodayTraining, getRecentTraining, getWeekTrainingCount } from "@/lib/queries";
import { TRAINING_SCHEDULE, COLORS } from "@/lib/constants";
import { matchTrainingImage } from "@/lib/images";
import type { TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";

const TABS = ["Uebersicht", "Wochenplan", "Performance"] as const;
type Tab = (typeof TABS)[number];

const TYPE_COLORS: Record<string, string> = {
  Kraft: "#F97316", Cardio: "#3B82F6", HYROX: "#10B981",
  CrossFit: "#F59E0B", Yoga: "#8B5CF6", Schwimmen: "#38BDF8",
  Radfahren: "#06B6D4", Laufen: "#3B82F6", Rudern: "#6366F1",
};

const TYPE_ICONS: Record<string, typeof Dumbbell> = {
  Kraft: Dumbbell, Cardio: Bike, HYROX: Flame,
  Schwimmen: Waves, default: Timer,
};

function WeekCalendar({ trainings }: { trainings: TrainingEntry[] }) {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const trainedDates = new Set(trainings.map((t) => t.datum));

  return (
    <div className="flex justify-between">
      {Array.from({ length: 7 }).map((_, i) => {
        const day = addDays(monday, i);
        const dateStr = format(day, "yyyy-MM-dd");
        const isToday = format(today, "yyyy-MM-dd") === dateStr;
        const isPast = day < today && !isToday;
        const trained = trainedDates.has(dateStr);

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400">{format(day, "EEE", { locale: de })}</span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                isToday
                  ? "bg-blue-500 text-white"
                  : trained
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600"
                  : isPast
                  ? "text-slate-300"
                  : "text-slate-500"
              }`}
            >
              {trained && !isToday ? "✓" : format(day, "d")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrainingCard({ entry }: { entry: TrainingEntry }) {
  const color = TYPE_COLORS[entry.typ] || "#94a3b8";
  return (
    <Card className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
        <Dumbbell size={18} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{entry.name}</p>
        <div className="flex gap-2 mt-0.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>{entry.typ}</span>
          {entry.dauer_min && <span className="text-xs text-slate-500">{entry.dauer_min} min</span>}
          {entry.rpe && <span className="text-xs text-slate-500">RPE {entry.rpe}</span>}
        </div>
      </div>
      <span className="text-xs text-slate-400">{entry.datum?.slice(5)}</span>
    </Card>
  );
}

export default function TrainingPage() {
  const { user, userKey } = useUser();
  const [tab, setTab] = useState<Tab>("Uebersicht");
  const [todayTraining, setTodayTraining] = useState<TrainingEntry[]>([]);
  const [recent, setRecent] = useState<TrainingEntry[]>([]);
  const [weekCount, setWeekCount] = useState({ total: 0, byType: {} as Record<string, number> });

  useEffect(() => {
    getTodayTraining(user.id).then(setTodayTraining);
    getRecentTraining(user.id, 30).then(setRecent);
    getWeekTrainingCount(user.id).then(setWeekCount);
  }, [user.id]);

  const dayOfWeek = new Date().getDay();
  const schedule = TRAINING_SCHEDULE[dayOfWeek];
  const planned = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";
  const hasLogged = todayTraining.length > 0;

  // Chart data: group by week
  const weeklyData: Record<string, Record<string, number>> = {};
  recent.forEach((t) => {
    const d = new Date(t.datum);
    const wk = format(startOfWeek(d, { weekStartsOn: 1 }), "dd.MM.");
    if (!weeklyData[wk]) weeklyData[wk] = {};
    const typ = t.typ || "Sonstiges";
    weeklyData[wk][typ] = (weeklyData[wk][typ] || 0) + (t.dauer_min || 0);
  });
  const barData = Object.entries(weeklyData).map(([wk, types]) => ({ week: wk, ...types }));
  const allTypes = [...new Set(recent.map((t) => t.typ || "Sonstiges"))];

  // RPE trend
  const rpeData = recent
    .filter((t) => t.rpe)
    .map((t) => ({ date: t.datum?.slice(5), rpe: t.rpe }))
    .reverse();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Training</h1>
        <FamilySwitcher />
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === t ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Uebersicht" && (
        <div className="flex flex-col gap-4">
          {/* Week Calendar */}
          <Card>
            <WeekCalendar trainings={recent} />
          </Card>

          {/* Today Hero */}
          <div className="rounded-[20px] overflow-hidden relative" style={{ height: 200 }}>
            <img src={matchTrainingImage(planned, userKey)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(13,17,23,0.9) 100%)" }} />
            <div className="relative h-full p-5 flex flex-col justify-end text-white">
            {hasLogged ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={48} className="text-emerald-400" />
                <p className="text-lg font-semibold">Training complete!</p>
                <div className="flex gap-4 text-sm">
                  <span>{todayTraining[0].dauer_min || "?"} Min</span>
                  <span>RPE {todayTraining[0].rpe || "?"}</span>
                  <span>{todayTraining[0].typ}</span>
                </div>
                {todayTraining[0].notizen && (
                  <p className="text-xs text-slate-400 mt-1">{todayTraining[0].notizen}</p>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Heute geplant</p>
                <h2 className="text-xl font-semibold mt-1">{planned}</h2>
                <p className="text-sm text-slate-400 mt-1">Home-Gym — ca. 50 Min</p>
                <div className="flex gap-3 mt-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs">50 Min</span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs">~350 kcal</span>
                </div>
                <p className="text-xs text-white/40 mt-4">Logge via /log im Telegram Bot</p>
              </>
            )}
          </div></div>

          {/* Recent Log */}
          <h3 className="text-sm font-medium text-slate-500">Letzte Trainings</h3>
          {recent.slice(0, 7).map((t) => (
            <TrainingCard key={t.id} entry={t} />
          ))}
          {recent.length === 0 && (
            <Card><p className="text-sm text-slate-400 text-center py-4">Noch keine Trainings geloggt</p></Card>
          )}
        </div>
      )}

      {tab === "Wochenplan" && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const s = TRAINING_SCHEDULE[d];
            const dayName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d];
            const isToday = new Date().getDay() === d;
            const isSauna = d === 3 || d === 0;
            const t = s ? s[userKey as "vincent" | "maria"] : "?";
            return (
              <Card key={d} className={isToday ? "ring-2 ring-blue-500" : ""}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 ${isToday ? "text-blue-500" : "text-slate-400"}`}>{dayName}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t}</p>
                    {isSauna && <p className="text-xs text-amber-500 mt-0.5">+ Sauna 15-20 min</p>}
                  </div>
                  {isToday && <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full">Heute</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Performance" && (
        <div className="flex flex-col gap-4">
          {/* Volumen Chart */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Trainingsvolumen (Minuten/Woche)</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  {allTypes.map((typ) => (
                    <Bar key={typ} dataKey={typ} stackId="a" fill={TYPE_COLORS[typ] || "#94a3b8"} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Noch keine Daten</p>
            )}
          </Card>

          {/* RPE Trend */}
          <Card>
            <h3 className="text-sm font-medium mb-3">RPE Trend</h3>
            {rpeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={rpeData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rpe" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Noch keine Daten</p>
            )}
          </Card>

          {/* Frequenz */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Diese Woche</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{weekCount.total}</p>
                <p className="text-xs text-slate-500">/ 5 Sessions</p>
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {Object.entries(weekCount.byType).map(([typ, count]) => (
                  <span key={typ} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: (TYPE_COLORS[typ] || "#94a3b8") + "20", color: TYPE_COLORS[typ] || "#94a3b8" }}>
                    {typ}: {count}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
