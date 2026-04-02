"use client";

import { SUPPLEMENT_SLOTS } from "@/lib/constants";
import { Check, Clock } from "lucide-react";

export default function SupplementStatus({ takenSlots }: { takenSlots: string[] }) {
  return (
    <div className="flex justify-between">
      {SUPPLEMENT_SLOTS.map((slot) => {
        const taken = takenSlots.includes(slot.key);
        return (
          <div key={slot.key} className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${taken ? "glow-pulse" : ""}`}
              style={{
                background: taken ? "rgba(126,226,184,0.15)" : "rgba(255,255,255,0.04)",
                border: taken ? "1.5px solid var(--accent)" : "1.5px solid var(--card-border)",
                color: taken ? "var(--accent)" : "var(--text3)",
              }}>
              {taken ? <Check size={14} /> : <Clock size={12} />}
            </div>
            <span className="text-[9px] font-medium uppercase tracking-[0.5px]" style={{ color: "var(--text3)" }}>{slot.label}</span>
          </div>
        );
      })}
    </div>
  );
}
