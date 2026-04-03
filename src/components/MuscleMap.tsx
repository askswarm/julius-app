"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { getRecentTraining } from "@/lib/queries";
import type { TrainingEntry } from "@/lib/types";

type MuscleGroup =
  | "brust" | "schultern" | "bizeps" | "trizeps" | "unterarme"
  | "core" | "obliques"
  | "quads" | "hamstrings" | "waden" | "gluteus"
  | "lats" | "unterer_ruecken";

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  brust: "Brust", schultern: "Schultern", bizeps: "Bizeps", trizeps: "Trizeps",
  unterarme: "Unterarme", core: "Core", obliques: "Obliques",
  quads: "Quads", hamstrings: "Hamstrings", waden: "Waden", gluteus: "Gluteus",
  lats: "Lats/Ruecken", unterer_ruecken: "Unterer Ruecken",
};

const TRAINING_MUSCLES: Record<string, MuscleGroup[]> = {
  Kraft: ["brust", "schultern", "bizeps", "trizeps", "core", "quads", "hamstrings", "gluteus"],
  HYROX: ["brust", "schultern", "bizeps", "trizeps", "core", "quads", "hamstrings", "gluteus", "waden", "lats"],
  CrossFit: ["brust", "schultern", "bizeps", "trizeps", "core", "quads", "hamstrings", "gluteus", "waden", "lats"],
  Laufen: ["quads", "hamstrings", "waden", "gluteus"],
  Schwimmen: ["schultern", "lats", "core", "trizeps"],
  Rudern: ["lats", "schultern", "bizeps", "core", "quads"],
  Radfahren: ["quads", "hamstrings", "gluteus", "waden"],
  TRX: ["core", "schultern", "lats", "bizeps", "trizeps"],
  Yoga: ["core", "hamstrings"],
  Stretching: ["hamstrings", "core"],
  Mobility: ["core", "hamstrings"],
  Sauna: [],
  Meditation: [],
};

function getIntensity(count: number): { opacity: number; glow: boolean } {
  if (count === 0) return { opacity: 0, glow: false };
  if (count === 1) return { opacity: 0.3, glow: false };
  if (count === 2) return { opacity: 0.6, glow: false };
  return { opacity: 1, glow: true };
}

function getColor(count: number): string {
  if (count === 0) return "#484F58";
  if (count === 1) return "rgba(46,166,122,0.4)";
  if (count === 2) return "rgba(46,166,122,0.7)";
  return "#7EE2B8";
}

// SVG body outline with muscle groups
function BodyFront({ muscles }: { muscles: Record<MuscleGroup, number> }) {
  const m = (g: MuscleGroup) => getColor(muscles[g] || 0);
  const glow = (g: MuscleGroup) => (muscles[g] || 0) >= 3 ? "0 0 8px rgba(126,226,184,0.5)" : "none";

  return (
    <svg viewBox="0 0 120 220" className="w-full h-full">
      {/* Head */}
      <circle cx="60" cy="22" r="14" fill="none" stroke="#484F58" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="55" y="36" width="10" height="8" fill="none" stroke="#484F58" strokeWidth="1" />
      {/* Shoulders */}
      <ellipse cx="35" cy="52" rx="12" ry="8" fill={m("schultern")} style={{ filter: `drop-shadow(${glow("schultern")})` }} />
      <ellipse cx="85" cy="52" rx="12" ry="8" fill={m("schultern")} style={{ filter: `drop-shadow(${glow("schultern")})` }} />
      {/* Chest */}
      <ellipse cx="48" cy="65" rx="14" ry="10" fill={m("brust")} style={{ filter: `drop-shadow(${glow("brust")})` }} />
      <ellipse cx="72" cy="65" rx="14" ry="10" fill={m("brust")} style={{ filter: `drop-shadow(${glow("brust")})` }} />
      {/* Biceps */}
      <ellipse cx="24" cy="75" rx="6" ry="14" fill={m("bizeps")} style={{ filter: `drop-shadow(${glow("bizeps")})` }} />
      <ellipse cx="96" cy="75" rx="6" ry="14" fill={m("bizeps")} style={{ filter: `drop-shadow(${glow("bizeps")})` }} />
      {/* Forearms */}
      <ellipse cx="20" cy="100" rx="5" ry="12" fill={m("unterarme")} />
      <ellipse cx="100" cy="100" rx="5" ry="12" fill={m("unterarme")} />
      {/* Core */}
      <rect x="45" y="78" width="30" height="24" rx="4" fill={m("core")} style={{ filter: `drop-shadow(${glow("core")})` }} />
      {/* Obliques */}
      <rect x="38" y="82" width="7" height="18" rx="3" fill={m("obliques")} />
      <rect x="75" y="82" width="7" height="18" rx="3" fill={m("obliques")} />
      {/* Quads */}
      <ellipse cx="48" cy="130" rx="10" ry="22" fill={m("quads")} style={{ filter: `drop-shadow(${glow("quads")})` }} />
      <ellipse cx="72" cy="130" rx="10" ry="22" fill={m("quads")} style={{ filter: `drop-shadow(${glow("quads")})` }} />
      {/* Calves */}
      <ellipse cx="46" cy="175" rx="7" ry="18" fill={m("waden")} style={{ filter: `drop-shadow(${glow("waden")})` }} />
      <ellipse cx="74" cy="175" rx="7" ry="18" fill={m("waden")} style={{ filter: `drop-shadow(${glow("waden")})` }} />
    </svg>
  );
}

function BodyBack({ muscles }: { muscles: Record<MuscleGroup, number> }) {
  const m = (g: MuscleGroup) => getColor(muscles[g] || 0);
  const glow = (g: MuscleGroup) => (muscles[g] || 0) >= 3 ? "0 0 8px rgba(126,226,184,0.5)" : "none";

  return (
    <svg viewBox="0 0 120 220" className="w-full h-full">
      {/* Head */}
      <circle cx="60" cy="22" r="14" fill="none" stroke="#484F58" strokeWidth="1.5" />
      <rect x="55" y="36" width="10" height="8" fill="none" stroke="#484F58" strokeWidth="1" />
      {/* Shoulders */}
      <ellipse cx="35" cy="52" rx="12" ry="8" fill={m("schultern")} style={{ filter: `drop-shadow(${glow("schultern")})` }} />
      <ellipse cx="85" cy="52" rx="12" ry="8" fill={m("schultern")} style={{ filter: `drop-shadow(${glow("schultern")})` }} />
      {/* Lats */}
      <ellipse cx="48" cy="68" rx="14" ry="12" fill={m("lats")} style={{ filter: `drop-shadow(${glow("lats")})` }} />
      <ellipse cx="72" cy="68" rx="14" ry="12" fill={m("lats")} style={{ filter: `drop-shadow(${glow("lats")})` }} />
      {/* Triceps */}
      <ellipse cx="24" cy="75" rx="6" ry="14" fill={m("trizeps")} style={{ filter: `drop-shadow(${glow("trizeps")})` }} />
      <ellipse cx="96" cy="75" rx="6" ry="14" fill={m("trizeps")} style={{ filter: `drop-shadow(${glow("trizeps")})` }} />
      {/* Lower back */}
      <rect x="45" y="82" width="30" height="18" rx="4" fill={m("unterer_ruecken")} />
      {/* Gluteus */}
      <ellipse cx="48" cy="108" rx="12" ry="8" fill={m("gluteus")} style={{ filter: `drop-shadow(${glow("gluteus")})` }} />
      <ellipse cx="72" cy="108" rx="12" ry="8" fill={m("gluteus")} style={{ filter: `drop-shadow(${glow("gluteus")})` }} />
      {/* Hamstrings */}
      <ellipse cx="48" cy="135" rx="10" ry="20" fill={m("hamstrings")} style={{ filter: `drop-shadow(${glow("hamstrings")})` }} />
      <ellipse cx="72" cy="135" rx="10" ry="20" fill={m("hamstrings")} style={{ filter: `drop-shadow(${glow("hamstrings")})` }} />
      {/* Calves */}
      <ellipse cx="46" cy="175" rx="7" ry="18" fill={m("waden")} style={{ filter: `drop-shadow(${glow("waden")})` }} />
      <ellipse cx="74" cy="175" rx="7" ry="18" fill={m("waden")} style={{ filter: `drop-shadow(${glow("waden")})` }} />
    </svg>
  );
}

export default function MuscleMap() {
  const { user } = useUser();
  const [muscles, setMuscles] = useState<Record<MuscleGroup, number>>({} as Record<MuscleGroup, number>);
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  useEffect(() => {
    getRecentTraining(user.id, 7).then((trainings: TrainingEntry[]) => {
      const counts: Record<string, number> = {};
      trainings.forEach((t) => {
        const groups = TRAINING_MUSCLES[t.typ] || TRAINING_MUSCLES[t.name] || [];
        groups.forEach((g) => { counts[g] = (counts[g] || 0) + 1; });
      });
      setMuscles(counts as Record<MuscleGroup, number>);
    });
  }, [user.id]);

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1" style={{ maxHeight: 220 }}>
          <p className="text-[9px] text-center mb-1" style={{ color: "var(--text3)" }}>Vorne</p>
          <BodyFront muscles={muscles} />
        </div>
        <div className="flex-1" style={{ maxHeight: 220 }}>
          <p className="text-[9px] text-center mb-1" style={{ color: "var(--text3)" }}>Ruecken</p>
          <BodyBack muscles={muscles} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-3">
        {[
          { label: "0", color: "#484F58" },
          { label: "1x", color: "rgba(46,166,122,0.4)" },
          { label: "2x", color: "rgba(46,166,122,0.7)" },
          { label: "3+", color: "#7EE2B8" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            <span className="text-[9px]" style={{ color: "var(--text3)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Active muscles list */}
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {Object.entries(muscles)
          .filter(([, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([group, count]) => (
            <span key={group} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: getColor(count) + "20", color: getColor(count) }}>
              {MUSCLE_LABELS[group as MuscleGroup] || group}: {count}x
            </span>
          ))}
      </div>
    </div>
  );
}
