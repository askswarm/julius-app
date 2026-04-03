"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dumbbell, Bike, Flame, Waves, Timer, CheckCircle2, Plus, X,
  Footprints, Ship, Zap, Flower2, Thermometer, StretchHorizontal,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodayTraining, getRecentTraining, getWeekTrainingCount } from "@/lib/queries";
import { TRAINING_SCHEDULE, COLORS } from "@/lib/constants";
import { matchTrainingImage, TRAINING_IMAGES } from "@/lib/images";
import type { TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import Toast from "@/components/Toast";
import MuscleMap from "@/components/MuscleMap";

const TABS = ["Uebersicht", "Wochenplan", "Performance"] as const;
type Tab = (typeof TABS)[number];

const TYPE_COLORS: Record<string, string> = {
  Kraft: "#F97316", Cardio: "#3B82F6", HYROX: "#10B981",
  CrossFit: "#F59E0B", Yoga: "#8B5CF6", Schwimmen: "#38BDF8",
  Radfahren: "#06B6D4", Laufen: "#3B82F6", Rudern: "#6366F1",
  Sauna: "#EF4444", Mobility: "#8B5CF6", TRX: "#F97316",
  "Gravel Bike": "#06B6D4",
};

interface SportOption {
  name: string;
  typ: string;
  icon: typeof Dumbbell;
  imageKey: string;
}

const SPORTS_VINCENT: SportOption[] = [
  { name: "Kraft", typ: "Kraft", icon: Dumbbell, imageKey: "kraft" },
  { name: "HYROX", typ: "HYROX", icon: Flame, imageKey: "hyrox" },
  { name: "Laufen", typ: "Laufen", icon: Footprints, imageKey: "laufen" },
  { name: "Gravel Bike", typ: "Radfahren", icon: Bike, imageKey: "radfahren" },
  { name: "Schwimmen", typ: "Schwimmen", icon: Waves, imageKey: "schwimmen" },
  { name: "Rudern", typ: "Rudern", icon: Ship, imageKey: "rudern" },
  { name: "CrossFit", typ: "CrossFit", icon: Zap, imageKey: "crossfit" },
  { name: "Yoga", typ: "Yoga", icon: Flower2, imageKey: "yoga" },
  { name: "Sauna", typ: "Sauna", icon: Thermometer, imageKey: "sauna" },
  { name: "Mobility", typ: "Mobility", icon: StretchHorizontal, imageKey: "mobility" },
];

const SPORTS_MARIA: SportOption[] = [
  { name: "Kraft", typ: "Kraft", icon: Dumbbell, imageKey: "kraft" },
  { name: "TRX", typ: "TRX", icon: Dumbbell, imageKey: "trx" },
  { name: "HYROX", typ: "HYROX", icon: Flame, imageKey: "hyrox" },
  { name: "Laufen", typ: "Laufen", icon: Footprints, imageKey: "laufen" },
  { name: "Schwimmen", typ: "Schwimmen", icon: Waves, imageKey: "schwimmen" },
  { name: "Yoga", typ: "Yoga", icon: Flower2, imageKey: "yoga" },
  { name: "Stretching", typ: "Stretching", icon: StretchHorizontal, imageKey: "stretching" },
  { name: "Meditation", typ: "Meditation", icon: Flower2, imageKey: "meditation" },
  { name: "Sauna", typ: "Sauna", icon: Thermometer, imageKey: "sauna" },
];

interface Exercise {
  name: string;
  saetze: number;
  wdh: number;
  gewicht: number;
}

function RPEColor(rpe: number): string {
  if (rpe <= 5) return "#10B981";
  if (rpe <= 7) return "#F59E0B";
  if (rpe <= 9) return "#F97316";
  return "#EF4444";
}

function PostWorkoutCard({ typ, rpe }: { typ: string; rpe: number }) {
  const isCardio = ["Laufen", "Schwimmen", "Radfahren", "HYROX", "Rudern"].includes(typ);

  return (
    <Card className="border-l-4 border-emerald-500">
      <p className="text-sm font-medium mb-2">Post-Workout Empfehlung</p>
      <div className="flex flex-col gap-1 text-xs" style={{ color: "var(--text2)" }}>
        {isCardio ? (
          <>
            <p>Wasser + Elektrolyte sofort</p>
            <p>Leichte Mahlzeit innerhalb 60 Min</p>
            <p>EAA + Glutamin empfohlen</p>
          </>
        ) : rpe >= 7 ? (
          <>
            <p>500ml Wasser sofort</p>
            <p>EAA + Glutamin innerhalb 15 Min</p>
            <p>30-40g Protein innerhalb 60 Min</p>
          </>
        ) : (
          <>
            <p>400ml Wasser</p>
            <p>EAA + Glutamin empfohlen</p>
            <p>Naechste Mahlzeit proteinreich planen</p>
          </>
        )}
      </div>
    </Card>
  );
}

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
              {trained && !isToday ? "\u2713" : format(day, "d")}
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
  const [toast, setToast] = useState("");

  // Activity picker state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportOption | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [logDauer, setLogDauer] = useState(50);
  const [logRpe, setLogRpe] = useState(6);
  const [logNotizen, setLogNotizen] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPostWorkout, setShowPostWorkout] = useState(false);
  const [savedTyp, setSavedTyp] = useState("");
  const [savedRpe, setSavedRpe] = useState(6);

  const reload = useCallback(() => {
    getTodayTraining(user.id).then(setTodayTraining);
    getRecentTraining(user.id, 30).then(setRecent);
    getWeekTrainingCount(user.id).then(setWeekCount);
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  const dayOfWeek = new Date().getDay();
  const schedule = TRAINING_SCHEDULE[dayOfWeek];
  const planned = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";
  const hasLogged = todayTraining.length > 0;
  const sports = userKey === "maria" ? SPORTS_MARIA : SPORTS_VINCENT;

  async function saveTraining() {
    if (!selectedSport) return;
    setSaving(true);

    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: user.id,
          typ: selectedSport.typ,
          name: selectedSport.name,
          dauer_min: logDauer,
          rpe: logRpe,
          notizen: logNotizen || null,
          uebungen: exercises.length > 0 ? exercises : null,
        }),
      });

      if (res.ok) {
        setSavedTyp(selectedSport.typ);
        setSavedRpe(logRpe);
        setShowLog(false);
        setSelectedSport(null);
        setShowPicker(false);
        setShowPostWorkout(true);
        setLogNotizen("");
        setExercises([]);
        setLogRpe(6);
        setLogDauer(50);
        setToast("Training gespeichert!");
        reload();
      }
    } finally {
      setSaving(false);
    }
  }

  function addExercise() {
    setExercises([...exercises, { name: "", saetze: 3, wdh: 10, gewicht: 0 }]);
  }

  function updateExercise(idx: number, field: keyof Exercise, value: string | number) {
    const updated = [...exercises];
    (updated[idx] as unknown as Record<string, string | number>)[field] = value;
    setExercises(updated);
  }

  // Chart data
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
          <Card>
            <WeekCalendar trainings={recent} />
          </Card>

          {/* Start Training Button */}
          {!hasLogged && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all glow-pulse"
              style={{ background: "var(--grad-teal)", color: "#0D1117" }}
            >
              <Plus size={20} /> Training starten
            </button>
          )}

          {/* Post-Workout Card */}
          {showPostWorkout && <PostWorkoutCard typ={savedTyp} rpe={savedRpe} />}

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
              </>
            )}
          </div></div>

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

          {/* Muscle Map */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Muskelgruppen (7 Tage)</h3>
            <MuscleMap />
          </Card>
        </div>
      )}

      {/* Activity Picker Modal */}
      {showPicker && !showLog && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
          <div className="flex-1 overflow-y-auto" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="max-w-lg mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Sportart waehlen</h2>
                <button onClick={() => setShowPicker(false)} className="p-2 rounded-full" style={{ color: "var(--text2)" }}>
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {sports.map((sport) => {
                  const imgUrl = matchTrainingImage(sport.imageKey, userKey);
                  return (
                    <button
                      key={sport.name}
                      onClick={() => { setSelectedSport(sport); setShowLog(true); }}
                      className="relative rounded-2xl overflow-hidden text-left transition-transform hover:scale-[1.02]"
                      style={{ height: 160 }}
                    >
                      <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.75))" }} />
                      <div className="relative h-full p-4 flex flex-col justify-between">
                        <sport.icon size={22} className="text-white/80" />
                        <p className="text-white font-semibold text-sm">{sport.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Screen */}
      {showLog && selectedSport && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: "var(--bg)" }}>
          <div className="max-w-lg mx-auto px-4 py-6 w-full" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setShowLog(false); setSelectedSport(null); }} className="p-1" style={{ color: "var(--text2)" }}>
                <X size={24} />
              </button>
              <selectedSport.icon size={24} style={{ color: TYPE_COLORS[selectedSport.typ] || "var(--accent)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{selectedSport.name}</h2>
            </div>

            {/* Duration */}
            <Card className="mb-3">
              <label className="text-xs" style={{ color: "var(--text2)" }}>Dauer (Minuten)</label>
              <input
                type="number"
                value={logDauer}
                onChange={(e) => setLogDauer(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-lg font-bold bg-transparent border text-center"
                style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
              />
            </Card>

            {/* RPE */}
            <Card className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: "var(--text2)" }}>RPE (Belastung)</label>
                <span className="text-2xl font-bold" style={{ color: RPEColor(logRpe) }}>{logRpe}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={logRpe}
                onChange={(e) => setLogRpe(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #10B981, #F59E0B, #F97316, #EF4444)` }}
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text3)" }}>
                <span>Leicht</span><span>Moderat</span><span>Hart</span><span>Max</span>
              </div>
            </Card>

            {/* Notes */}
            <Card className="mb-3">
              <label className="text-xs" style={{ color: "var(--text2)" }}>Notizen</label>
              <textarea
                value={logNotizen}
                onChange={(e) => setLogNotizen(e.target.value)}
                placeholder="Wie wars? Besonderheiten?"
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border text-sm resize-none"
                style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
              />
            </Card>

            {/* Exercises */}
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: "var(--text2)" }}>Uebungen</label>
                <button onClick={addExercise} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(126,226,184,0.1)", color: "var(--accent)" }}>
                  + Uebung
                </button>
              </div>
              {exercises.map((ex, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    placeholder="Name"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, "name", e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-transparent border text-xs"
                    style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
                  />
                  <input
                    type="number"
                    placeholder="S"
                    value={ex.saetze || ""}
                    onChange={(e) => updateExercise(i, "saetze", Number(e.target.value))}
                    className="w-12 px-2 py-1.5 rounded-lg bg-transparent border text-xs text-center"
                    style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
                  />
                  <span className="text-[10px]" style={{ color: "var(--text3)" }}>x</span>
                  <input
                    type="number"
                    placeholder="W"
                    value={ex.wdh || ""}
                    onChange={(e) => updateExercise(i, "wdh", Number(e.target.value))}
                    className="w-12 px-2 py-1.5 rounded-lg bg-transparent border text-xs text-center"
                    style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
                  />
                  <input
                    type="number"
                    placeholder="kg"
                    value={ex.gewicht || ""}
                    onChange={(e) => updateExercise(i, "gewicht", Number(e.target.value))}
                    className="w-14 px-2 py-1.5 rounded-lg bg-transparent border text-xs text-center"
                    style={{ borderColor: "var(--card-border)", color: "var(--text)" }}
                  />
                  <button onClick={() => setExercises(exercises.filter((_, j) => j !== i))} className="text-red-400 text-xs">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </Card>

            {/* Save Button */}
            <button
              onClick={saveTraining}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all"
              style={{ background: saving ? "var(--text3)" : "var(--grad-teal)", color: "#0D1117" }}
            >
              {saving ? "Speichern..." : "Training speichern"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
