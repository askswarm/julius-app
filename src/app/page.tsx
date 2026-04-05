"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, UtensilsCrossed, MessageCircle, TrendingUp, TrendingDown, Activity, Heart, Footprints, Flame } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { isHalflife, appName, appAccentColor } from "@/lib/appConfig";
import { analyzeProtocol } from "@/lib/protocolEngine";
import { getTodaySupplements, getLatestBloodwork } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE } from "@/lib/constants";
import { Syringe, AlertTriangle, Clock, Check } from "lucide-react";
import { getTodayScores, getTodayMacros, getTodayTraining, getTrainingLoad, getTodayMacroAdjustment, getTodayOura, getOuraHistory } from "@/lib/queries";
import { calculateDynamicKcal } from "@/lib/calorieLogic";
import { matchTrainingImage } from "@/lib/images";
import { TRAINING_SCHEDULE } from "@/lib/constants";
import type { DailyScore, MacroSummary, TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import MacroBar from "@/components/MacroBar";
import Card from "@/components/Card";
import AutophagieTimer from "@/components/AutophagieTimer";

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  wasser: "linear-gradient(90deg, #0284C7, #38BDF8)",
};

const HOME_VIDEOS: Record<string, string> = {
  vincent: "https://videos.pexels.com/video-files/4761437/4761437-uhd_2560_1440_25fps.mp4",
  maria: "https://videos.pexels.com/video-files/4761568/4761568-uhd_2560_1440_25fps.mp4",
};
const HOME_POSTERS: Record<string, string> = {
  vincent: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=600&fit=crop",
  maria: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=600&fit=crop",
};

interface OuraData {
  steps?: number; active_calories?: number; resting_hr?: number;
  avg_hrv?: number; lowest_hr?: number; stress_score?: number;
  vo2_max?: number; cardiovascular_age?: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, userKey } = useUser();
  const [halflifeReady, setHalflifeReady] = useState(!isHalflife);
  const [scores, setScores] = useState<DailyScore | null>(null);
  const [macros, setMacros] = useState<MacroSummary>({ kcal: 0, protein_g: 0, carbs_g: 0, fett_g: 0, wasser_ml: 0 });
  const [training, setTraining] = useState<TrainingEntry[]>([]);
  const [load, setLoad] = useState(0);
  const [macroAdj, setMacroAdj] = useState({ kcal: 0, protein: 0 });
  const [oura, setOura] = useState<OuraData | null>(null);
  const [yesterday, setYesterday] = useState<OuraData | null>(null);

  // Halflife onboarding redirect
  useEffect(() => {
    if (isHalflife && typeof window !== "undefined") {
      if (!localStorage.getItem("halflife-onboarding-completed")) {
        router.push("/onboarding");
        return;
      }
      setHalflifeReady(true);
    }
  }, [router]);

  useEffect(() => {
    const id = user.id;
    getTodayScores(id).then(setScores);
    getTodayMacros(id).then(setMacros);
    getTodayTraining(id).then(setTraining);
    getTrainingLoad(id).then(setLoad);
    getTodayMacroAdjustment(id).then(setMacroAdj);
    getTodayOura(id).then(setOura);
    getOuraHistory(id, 2).then((h) => { if (h.length >= 2) setYesterday(h[0] as unknown as OuraData); });

    const lastSync = localStorage.getItem("julius-oura-sync");
    if (!lastSync || parseInt(lastSync) < Date.now() - 3600000) {
      fetch("/api/oura/sync").then(() => {
        localStorage.setItem("julius-oura-sync", String(Date.now()));
        getTodayOura(id).then(setOura);
      }).catch(() => {});
    }
  }, [user.id]);

  const dynamicKcal = calculateDynamicKcal(user, oura?.active_calories || 0, macroAdj.kcal);
  const adjustedProtein = user.protein_ziel_g + macroAdj.protein;
  const today = new Date();
  const schedule = TRAINING_SCHEDULE[today.getDay()];
  const todayTraining = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";

  function trendVal(cur: number | undefined | null, prev: number | undefined | null): number | null {
    if (cur == null || prev == null) return null;
    return Math.round(cur - prev);
  }

  // Halflife-specific data
  const [bloodwork, setBloodwork] = useState<Record<string, { wert: number; datum: string }>>({});
  const [supplements, setSupplements] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<{ type: string; message: string; action: string }[]>([]);
  const [trtLogs, setTrtLogs] = useState<{ datum: string; dosis_mg: number; injection_site: string }[]>([]);

  useEffect(() => {
    if (!isHalflife) return;
    getLatestBloodwork(user.id).then((bw) => {
      setBloodwork(bw);
      setAlerts(analyzeProtocol(bw, true, oura as { sleep_score?: number | null; readiness_score?: number | null; temperature_deviation?: number | null } | null, user.geschlecht));
    });
    getTodaySupplements(user.id).then(setSupplements);
    fetch(`/api/trt?chatId=${user.id}`).then((r) => r.json()).then((d) => setTrtLogs(d.logs || [])).catch(() => {});
  }, [user.id, user.geschlecht, oura]);

  const readinessAdvice = (scores?.readiness ?? 80) >= 75
    ? "Volle Intensitaet moeglich"
    : (scores?.readiness ?? 80) >= 60
    ? "Leichtes Training empfohlen"
    : "Ruhe empfohlen";
  const readinessColor = (scores?.readiness ?? 80) >= 75 ? "rgba(255,255,255,0.75)" : "#F59E0B";

  // Halflife next supplement slot
  const currentHour = today.getHours() + today.getMinutes() / 60;
  const SLOT_TIMES: Record<string, number> = { nuechtern: 7, fruehstueck: 9, mittag: 13, abend: 19 };
  const nextSlot = Object.entries(SLOT_TIMES).find(([key, time]) => time > currentHour && !supplements.includes(key));

  const BW_KEY_MARKERS = [
    { key: "haematokrit", label: "HKT", max: 52 },
    { key: "testosteron_gesamt", label: "Total T", max: 1000 },
    { key: "oestradiol", label: "E2", max: 40 },
    { key: "vitamin_d", label: "Vit D", max: 80 },
    { key: "hscrp", label: "hsCRP", max: 1 },
    { key: "haemoglobin", label: "Hb", max: 17 },
  ];

  // === HALFLIFE HOME ===
  if (isHalflife) {
    if (!halflifeReady) return <div style={{ background: "#050506", minHeight: "100vh" }} />;
    const isTrtDay = [3, 6].includes(today.getDay());
    return (
      <div style={{ background: "#050506", minHeight: "100vh", padding: "16px 16px 100px", margin: "-20px -16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8ec", letterSpacing: -0.5 }}>halflife<span style={{ color: "#E8893C", fontWeight: 300 }}>.</span></div>
          <Link href="/settings" style={{ textDecoration: "none" }}><div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E8893C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#E8893C", fontWeight: 500 }}>V</div></Link>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginBottom: 16 }}>{format(today, "EEEE, d. MMMM", { locale: de })}</div>

        <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginBottom: 8 }}>Naechste Injektion</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e8ec" }}>{isTrtDay ? "Heute — 60mg" : "Samstag — 60mg"}</div>
          <div style={{ fontSize: 13, color: "#a0a0a8", marginTop: 4 }}>Test Cypionate · SubQ · 0.2ml</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 20, textAlign: "center" as const }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "#E8893C" }}>{scores?.readiness ?? "--"}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginTop: 4 }}>Readiness</div>
          </div>
          <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 20, textAlign: "center" as const }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "#E8893C" }}>{scores?.sleep ?? "--"}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginTop: 4 }}>Sleep</div>
          </div>
        </div>

        <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginBottom: 8 }}>Naechste Einnahme</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#e8e8ec" }}>19:00 — Abend</div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 8 }}>
            {["Magnesium", "Ashwagandha", "Glycin", "Kupfer"].map((s) => (
              <span key={s} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", color: "#E8893C" }}>{s}</span>
            ))}
          </div>
        </div>

        <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginBottom: 8 }}>TRT Protokoll</div>
          <div style={{ fontSize: 14, color: "#a0a0a8" }}>120mg/Woche · 2x Mi+Sa · Cypionate</div>
          <div style={{ fontSize: 13, color: "#E8893C", marginTop: 6 }}>Naechster Pin: {isTrtDay ? "Heute" : "Samstag"}</div>
        </div>

        <div style={{ background: "#0c0c0f", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#5a5a62", textTransform: "uppercase" as const, marginBottom: 12 }}>Blutwerte</div>
          {[{ n: "Total T", v: "847 ng/dL", c: "#34d399" }, { n: "Haematokrit", v: "51.8%", c: "#E8893C" }, { n: "Oestradiol", v: "31 pg/mL", c: "#34d399" }, { n: "Vitamin D", v: "62 ng/mL", c: "#34d399" }, { n: "PSA", v: "0.8 ng/mL", c: "#34d399" }].map((m) => (
            <div key={m.n} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #111114" }}>
              <span style={{ fontSize: 13, color: "#a0a0a8" }}>{m.n}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: m.c }}>{m.v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(232,137,60,0.04)", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8893C", marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#E8893C" }}>Haematokrit beobachten</div>
              <div style={{ fontSize: 12, color: "#a0a0a8", marginTop: 2, lineHeight: 1.5 }}>In der Literatur wird ab 52% eine aerztliche Ruecksprache empfohlen.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === JULIUS HOME (unchanged) ===
  return (
    <div className="flex flex-col gap-4 -mx-4 -mt-5">
      {/* ZONE 1 — HERO with video */}
      <div className="relative overflow-hidden" style={{ height: 300 }}>
        <video
          autoPlay loop muted playsInline
          poster={HOME_POSTERS[userKey] || HOME_POSTERS.vincent}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
        >
          <source src={HOME_VIDEOS[userKey] || HOME_VIDEOS.vincent} type="video/mp4" />
        </video>
        {/* Static fallback behind video */}
        <img src={HOME_POSTERS[userKey] || HOME_POSTERS.vincent} alt=""
          className="absolute inset-0 w-full h-full object-cover -z-10" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, var(--bg) 100%)" }} />
        <div className="relative h-full px-5 flex flex-col justify-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "var(--grad-teal)", color: "#0D1117" }}>J</div>
              <span className="text-sm font-semibold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>Julius</span>
            </div>
            <FamilySwitcher />
          </div>
          {/* Bottom text */}
          <div className="pb-6">
            <p className="text-[11px] font-medium uppercase tracking-[1px] text-white/60">
              {format(today, "EEEE, d. MMMM", { locale: de })}
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>
              Hallo {user.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* ZONE 2 — SCORE RINGS */}
        <Card className="flex justify-around" glow={scores != null}>
          <ScoreRing value={scores?.readiness ?? null} label="Readiness" color="#7EE2B8" />
          <ScoreRing value={scores?.sleep ?? null} label="Schlaf" color="#79C0FF" />
          <ScoreRing value={Math.min(load, 1000)} max={1000} label="Load 48h" color="#F97316" />
        </Card>

        {/* METRIC BAR — compact single row */}
        {oura && (
          <div className="flex items-center gap-0 rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            {[
              { label: "HRV", value: oura.avg_hrv ? Math.round(oura.avg_hrv) : null, unit: "ms", trend: trendVal(oura.avg_hrv, yesterday?.avg_hrv), trendInvert: false },
              { label: "Puls", value: oura.lowest_hr || oura.resting_hr || null, unit: "bpm", trend: trendVal(oura.lowest_hr, yesterday?.lowest_hr), trendInvert: true },
              { label: "Schritte", value: oura.steps || null, unit: "", trend: null, trendInvert: false },
              { label: "Active", value: oura.active_calories || null, unit: "kcal", trend: null, trendInvert: false },
              { label: "Stress", value: oura.stress_score || null, unit: "", trend: null, trendInvert: false },
            ].filter((m) => m.value != null).map((m, i, arr) => (
              <div key={m.label} className="flex-1 text-center py-3 px-1"
                style={{ borderRight: i < arr.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{typeof m.value === "number" && m.value > 999 ? `${(m.value / 1000).toFixed(1)}k` : m.value}</span>
                  {m.trend != null && m.trend !== 0 && (
                    (m.trendInvert ? m.trend < 0 : m.trend > 0)
                      ? <TrendingUp size={10} style={{ color: "#10B981" }} />
                      : <TrendingDown size={10} style={{ color: "#EF4444" }} />
                  )}
                </div>
                <p className="text-[9px] mt-0.5" style={{ color: "var(--text3)" }}>{m.label}{m.unit ? ` ${m.unit}` : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* ZONE 3 — BIO-ALTER + VO2MAX */}
        {(oura?.cardiovascular_age || oura?.vo2_max) && (
          <Card className="border-l-[3px] border-emerald-400">
            <div className="flex items-center justify-between">
              <div>
                {oura?.cardiovascular_age != null && (
                  <>
                    <p className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--accent)" }}>Biologisches Alter</p>
                    <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{oura.cardiovascular_age}</p>
                  </>
                )}
              </div>
              {oura?.vo2_max != null && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--accent2)" }}>VO2max</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{oura.vo2_max}</p>
                </div>
              )}
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text3)" }}>
              Kalendarisch: {user.alter_jahre}
              {oura?.cardiovascular_age && oura.cardiovascular_age < user.alter_jahre && ` — Herz ${user.alter_jahre - oura.cardiovascular_age}J juenger`}
            </p>
          </Card>
        )}

        {/* ZONE 4 — HEUTIGER FOKUS (Training Hero) */}
        <Link href="/training">
          <div className="rounded-[20px] overflow-hidden relative" style={{ height: 150 }}>
            <img src={matchTrainingImage(todayTraining, userKey)} alt="" className="absolute inset-0 w-full h-full object-cover ken-burns" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.8) 100%)" }} />
            <div className="relative h-full p-5 flex flex-col justify-end">
              <p className="text-[11px] text-white/60 uppercase tracking-wider">Heute</p>
              <p className="text-lg font-bold text-white">{todayTraining}</p>
              <p className="text-xs mt-0.5" style={{ color: readinessColor }}>
                Readiness {scores?.readiness ?? "--"} — {readinessAdvice}
              </p>
            </div>
          </div>
        </Link>

        {/* ZONE 5 — MAKROS + AUTOPHAGIE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Makros</span>
              <span className="text-xs" style={{ color: "var(--text3)" }}>{macros.kcal} / {dynamicKcal.target} kcal</span>
            </div>
            {(dynamicKcal.activityBonus > 0 || dynamicKcal.trainingBonus > 0) && (
              <p className="text-[9px] mb-2" style={{ color: "var(--accent)" }}>{dynamicKcal.label}</p>
            )}
            <div className="flex flex-col gap-2.5">
              <MacroBar label="Protein" current={macros.protein_g} target={adjustedProtein} gradient={GRADIENTS.protein} />
              <MacroBar label="Carbs" current={macros.carbs_g} target={200} gradient={GRADIENTS.carbs} />
              <MacroBar label="Fett" current={macros.fett_g} target={80} gradient={GRADIENTS.fett} />
              <MacroBar label="Wasser" current={macros.wasser_ml} target={user.wasser_ziel_ml} gradient={GRADIENTS.wasser} unit="ml" />
            </div>
          </Card>
          <AutophagieTimer />
        </div>

        {/* ZONE 6 — QUICK ACTIONS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Dumbbell, label: "Training", href: "/training", color: "var(--orange)" },
            { icon: UtensilsCrossed, label: "Essen", href: "/ernaehrung", color: "var(--accent)" },
            { icon: MessageCircle, label: "Julius", href: "/chat", color: "var(--accent2)" },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="flex flex-col items-center gap-2 py-4 transition-transform active:scale-95">
                <a.icon size={24} style={{ color: a.color }} />
                <span className="text-xs font-medium" style={{ color: "var(--text2)" }}>{a.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
