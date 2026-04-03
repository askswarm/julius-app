"use client";

import { CheckCircle2, Droplets, Dumbbell, Timer, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Card from "./Card";

interface Props {
  typ: string;
  rpe: number;
  dauerMin?: number;
  kcal?: number;
  distanzKm?: number;
  paceMinKm?: number;
}

export default function PostWorkoutSummary({ typ, rpe, dauerMin, kcal, distanzKm, paceMinKm }: Props) {
  const isCardio = ["Laufen", "Schwimmen", "Radfahren", "HYROX", "Rudern", "Gravel Bike"].includes(typ);

  return (
    <Card>
      {/* Success header */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1.0] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--accent)" }} />
        </motion.div>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Training gespeichert!</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {dauerMin != null && (
          <div className="text-center">
            <Timer size={14} className="mx-auto mb-1" style={{ color: "var(--text3)" }} />
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{dauerMin}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>Min</p>
          </div>
        )}
        {kcal != null && kcal > 0 && (
          <div className="text-center">
            <Flame size={14} className="mx-auto mb-1" style={{ color: "var(--orange)" }} />
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{kcal}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>kcal</p>
          </div>
        )}
        {rpe > 0 && (
          <div className="text-center">
            <TrendingUp size={14} className="mx-auto mb-1" style={{ color: rpe >= 8 ? "#EF4444" : rpe >= 6 ? "#F59E0B" : "#10B981" }} />
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{rpe}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>RPE</p>
          </div>
        )}
        {distanzKm != null && distanzKm > 0 && (
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{distanzKm.toFixed(2)}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>km</p>
          </div>
        )}
        {paceMinKm != null && paceMinKm > 0 && (
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {Math.floor(paceMinKm)}:{String(Math.round((paceMinKm % 1) * 60)).padStart(2, "0")}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>/km</p>
          </div>
        )}
      </div>

      {/* Post-WO Tips */}
      <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-1" style={{ color: "var(--text2)" }}>Post-Workout</p>
        <div className="flex items-center gap-2">
          <Droplets size={12} style={{ color: "#38BDF8" }} />
          <span className="text-xs" style={{ color: "var(--text2)" }}>{rpe >= 7 ? "500ml" : "400ml"} Wasser sofort</span>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell size={12} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text2)" }}>
            {isCardio ? "EAA + Glutamin, leichte Mahlzeit in 60 Min" : "EAA + Glutamin, 30-40g Protein in 60 Min"}
          </span>
        </div>
      </div>
    </Card>
  );
}
