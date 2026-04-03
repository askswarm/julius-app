"use client";

import { useEffect, useState } from "react";
import { Zap, AlertTriangle, Dumbbell, Pill } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getRecentAdaptations, getActiveSymptoms } from "@/lib/queries";
import Card from "@/components/Card";

interface Adaptation {
  datum: string;
  trigger: string;
  category: string;
  description: string;
}

interface Symptom {
  symptom: string;
  severity: string;
  started_at: string;
}

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  training: Dumbbell,
  supplements: Pill,
  warning: AlertTriangle,
};

const CATEGORY_COLORS: Record<string, string> = {
  training: "#F97316",
  supplements: "#7EE2B8",
  nutrition: "#79C0FF",
  warning: "#EF4444",
};

export default function AdaptationsCard() {
  const { user } = useUser();
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  useEffect(() => {
    getRecentAdaptations(user.id).then(setAdaptations);
    getActiveSymptoms(user.id).then(setSymptoms);
  }, [user.id]);

  if (adaptations.length === 0 && symptoms.length === 0) return null;

  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Aktuelle Anpassungen</p>

      {symptoms.length > 0 && (
        <div className="mb-3">
          {symptoms.map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-xl mb-1" style={{ background: "rgba(239,68,68,0.08)" }}>
              <AlertTriangle size={14} style={{ color: "#EF4444" }} />
              <span className="text-xs" style={{ color: "#EF4444" }}>
                {s.symptom} (seit {new Date(s.started_at).toLocaleDateString("de-DE", { day: "numeric", month: "short" })})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {adaptations.map((a, i) => {
          const Icon = CATEGORY_ICONS[a.category] || Zap;
          const color = CATEGORY_COLORS[a.category] || "var(--accent)";
          const daysAgo = Math.floor((Date.now() - new Date(a.datum).getTime()) / 86400000);
          const when = daysAgo === 0 ? "Heute" : daysAgo === 1 ? "Gestern" : `Vor ${daysAgo}T`;

          return (
            <div key={i} className="flex items-start gap-2 py-1">
              <Icon size={14} style={{ color, marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: "var(--text)" }}>{a.description}</p>
                <p className="text-[10px]" style={{ color: "var(--text3)" }}>{when}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
