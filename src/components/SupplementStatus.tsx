"use client";

import { SUPPLEMENT_SLOTS, COLORS } from "@/lib/constants";

interface SupplementStatusProps {
  takenSlots: string[];
}

export default function SupplementStatus({ takenSlots }: SupplementStatusProps) {
  return (
    <div className="flex justify-between">
      {SUPPLEMENT_SLOTS.map((slot) => {
        const taken = takenSlots.includes(slot.key);
        return (
          <div key={slot.key} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                taken
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-slate-300 dark:border-slate-600 text-slate-400"
              }`}
            >
              {taken ? "✓" : ""}
            </div>
            <span className="text-[10px] text-slate-500">{slot.label}</span>
          </div>
        );
      })}
    </div>
  );
}
