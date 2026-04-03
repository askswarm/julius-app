"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getWeekMeals, getRecentTraining, getLatestBloodwork } from "@/lib/queries";
import { generateSupplementTips, type SupplementTip } from "@/lib/supplementLogic";
import Card from "@/components/Card";

const ICONS = {
  green: CheckCircle2,
  yellow: AlertCircle,
  red: AlertTriangle,
};

const COLORS = {
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
};

const BG = {
  green: "rgba(16,185,129,0.08)",
  yellow: "rgba(245,158,11,0.08)",
  red: "rgba(239,68,68,0.08)",
};

export default function SupplementAdvisor() {
  const { user, userKey } = useUser();
  const [tips, setTips] = useState<SupplementTip[]>([]);

  useEffect(() => {
    Promise.all([
      getWeekMeals(user.id),
      getRecentTraining(user.id, 7),
      getLatestBloodwork(user.id),
    ]).then(([meals, trainings, bloodwork]) => {
      const result = generateSupplementTips(meals, trainings, bloodwork, userKey);
      setTips(result);
    });
  }, [user.id, userKey]);

  if (tips.length === 0) return null;

  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Julius empfiehlt</p>
      <div className="flex flex-col gap-2">
        {tips.map((tip, i) => {
          const Icon = ICONS[tip.severity];
          return (
            <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: BG[tip.severity] }}>
              <Icon size={18} style={{ color: COLORS[tip.severity], flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS[tip.severity] }}>{tip.text}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>{tip.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
