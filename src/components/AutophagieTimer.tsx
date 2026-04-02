"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import Card from "./Card";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function AutophagieTimer() {
  const { user } = useUser();
  const [now, setNow] = useState(nowMinutes());

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60000);
    return () => clearInterval(id);
  }, []);

  const start = parseTime(user.essensfenster_start);
  const end = parseTime(user.essensfenster_ende);
  const isOpen = now >= start && now < end;

  return (
    <Card>
      {isOpen ? (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Essensfenster offen
            </p>
            <p className="text-xs text-slate-500">
              Schliesst in {formatDuration(end - now)} ({user.essensfenster_ende})
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Autophagie aktiv
            </p>
            <p className="text-xs text-slate-500">
              Naechstes Essen um {user.essensfenster_start}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
