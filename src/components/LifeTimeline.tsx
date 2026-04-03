"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";

interface TimeEvent {
  time: string; // HH:MM
  type: "meal" | "training" | "supplement" | "sleep";
  label: string;
  color: string;
  durationMin?: number;
}

const COLORS = {
  meal: "#10B981",
  training: "#F97316",
  supplement: "#7EE2B8",
  sleep: "#79C0FF",
  fasting: "rgba(126,226,184,0.08)",
  eating: "rgba(126,226,184,0.04)",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function LifeTimeline() {
  const { user } = useUser();
  const [events, setEvents] = useState<TimeEvent[]>([]);

  useEffect(() => {
    const datum = new Date().toISOString().split("T")[0];
    const id = user.id;

    Promise.all([
      supabase.from("nutrition_log").select("gericht_name, created_at, mahlzeit_typ").eq("chat_id", id).eq("datum", datum),
      supabase.from("training_log").select("name, typ, dauer_min, created_at").eq("chat_id", id).eq("datum", datum),
      supabase.from("supplement_log").select("zeitpunkt, created_at").eq("chat_id", id).eq("datum", datum),
    ]).then(([mealsRes, trainingRes, suppsRes]) => {
      const ev: TimeEvent[] = [];

      (mealsRes.data || []).forEach((m) => {
        const t = m.created_at ? new Date(m.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }) : "12:00";
        ev.push({ time: t, type: "meal", label: m.gericht_name || m.mahlzeit_typ, color: COLORS.meal });
      });

      (trainingRes.data || []).forEach((t) => {
        const time = t.created_at ? new Date(t.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }) : "11:00";
        ev.push({ time, type: "training", label: t.name || t.typ, color: COLORS.training, durationMin: t.dauer_min || 45 });
      });

      const suppTimes: Record<string, string> = {
        nuechtern: "07:00", fruehstueck: "09:00", pre_wo: "11:30", mittag: "13:00", abend: "19:00",
      };
      (suppsRes.data || []).forEach((s) => {
        ev.push({ time: suppTimes[s.zeitpunkt] || "12:00", type: "supplement", label: s.zeitpunkt, color: COLORS.supplement });
      });

      ev.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
      setEvents(ev);
    });
  }, [user.id]);

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const startHour = 6;
  const endHour = 23;
  const totalMin = (endHour - startHour) * 60;
  const essenStart = timeToMinutes(user.essensfenster_start);
  const essenEnd = timeToMinutes(user.essensfenster_ende);

  function posPercent(t: string): number {
    const min = timeToMinutes(t) - startHour * 60;
    return Math.max(0, Math.min(100, (min / totalMin) * 100));
  }

  const currentPos = ((currentMin - startHour * 60) / totalMin) * 100;

  return (
    <div className="relative" style={{ height: 260 }}>
      {/* Eating window background */}
      <div className="absolute left-8 right-0 rounded-lg" style={{
        top: `${posPercent(user.essensfenster_start)}%`,
        height: `${((essenEnd - essenStart) / totalMin) * 100}%`,
        background: COLORS.fasting,
        borderLeft: "2px solid rgba(126,226,184,0.2)",
      }} />

      {/* Hour labels + timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between">
        {Array.from({ length: endHour - startHour + 1 }).filter((_, i) => i % 2 === 0).map((_, i) => {
          const h = startHour + i * 2;
          return (
            <span key={h} className="text-[9px] font-mono" style={{ color: "var(--text3)", position: "absolute", top: `${((h - startHour) * 60 / totalMin) * 100}%` }}>
              {formatHour(h)}
            </span>
          );
        })}
      </div>

      {/* Vertical line */}
      <div className="absolute left-10 top-0 bottom-0 w-0.5 rounded-full" style={{ background: "var(--card-border)" }} />

      {/* Events */}
      {events.map((ev, i) => (
        <div key={i} className="absolute left-7 flex items-center gap-2" style={{ top: `${posPercent(ev.time)}%` }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-10" style={{ background: ev.color, boxShadow: `0 0 6px ${ev.color}` }} />
          {ev.type === "training" && ev.durationMin ? (
            <div className="rounded-lg px-2 py-0.5" style={{ background: ev.color + "20" }}>
              <span className="text-[10px] font-medium" style={{ color: ev.color }}>{ev.time} {ev.label} ({ev.durationMin}min)</span>
            </div>
          ) : (
            <span className="text-[10px]" style={{ color: ev.color }}>{ev.time} {ev.label}</span>
          )}
        </div>
      ))}

      {/* Current time marker */}
      {currentPos > 0 && currentPos < 100 && (
        <div className="absolute left-6 right-0 flex items-center z-20" style={{ top: `${currentPos}%` }}>
          <div className="w-4 h-4 rounded-full pulse-dot" style={{ background: "#EF4444", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }} />
          <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.3)" }} />
          <span className="text-[9px] font-mono ml-1" style={{ color: "#EF4444" }}>
            {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* No events placeholder */}
      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs" style={{ color: "var(--text3)" }}>Noch keine Events heute</p>
        </div>
      )}
    </div>
  );
}
