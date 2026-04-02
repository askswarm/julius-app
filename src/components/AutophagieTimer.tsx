"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";

function parseTime(t: string): number { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function nowMin(): number { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function fmt(m: number): string { const h = Math.floor(m / 60); return h > 0 ? `${h}h ${m % 60}min` : `${m % 60}min`; }

export default function AutophagieTimer() {
  const { user } = useUser();
  const [now, setNow] = useState(nowMin());
  useEffect(() => { const id = setInterval(() => setNow(nowMin()), 60000); return () => clearInterval(id); }, []);

  const start = parseTime(user.essensfenster_start);
  const end = parseTime(user.essensfenster_ende);
  const isOpen = now >= start && now < end;

  return (
    <div className="rounded-[20px] px-6 py-4 transition-all animate-fade-in stagger-2"
      style={{
        background: isOpen ? "rgba(126,226,184,0.06)" : "var(--card)",
        border: `1px solid ${isOpen ? "rgba(126,226,184,0.15)" : "var(--card-border)"}`,
      }}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? "pulse-dot" : ""}`}
          style={{ background: isOpen ? "var(--accent)" : "var(--accent2)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: isOpen ? "var(--accent)" : "var(--accent2)" }}>
            {isOpen ? "Essensfenster offen" : "Autophagie aktiv"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
            {isOpen ? `Schliesst in ${fmt(end - now)} (${user.essensfenster_ende})` : `Naechstes Essen um ${user.essensfenster_start}`}
          </p>
        </div>
      </div>
    </div>
  );
}
