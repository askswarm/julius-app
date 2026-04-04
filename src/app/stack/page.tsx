"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Clock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodaySupplements } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE, SUPPLEMENT_STACK } from "@/lib/constants";
import { halflifeTheme as ht } from "@/lib/appConfig";
import Card from "@/components/Card";
import Toast from "@/components/Toast";
import Disclaimer from "@/components/Disclaimer";

const SLOT_TIMES: Record<string, number> = { nuechtern: 7, fruehstueck: 9, pre_wo: 11.5, mittag: 13, abend: 19 };

export default function StackPage() {
  const { user, userKey } = useUser();
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { getTodaySupplements(user.id).then(setTakenSlots); }, [user.id]);

  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
  const dayOfWeek = new Date().getDay();
  const isTraining = ![0, 3].includes(dayOfWeek);
  const nextSlot = Object.entries(SLOT_TIMES).find(([key, time]) => {
    if (key === "pre_wo" && !isTraining) return false;
    return time > currentHour && !takenSlots.includes(key);
  });

  async function markSlotTaken(slotKey: string) {
    if (takenSlots.includes(slotKey)) return;
    setSaving(slotKey);
    await fetch("/api/supplements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: user.id, zeitpunkt: slotKey }) });
    setTakenSlots((prev) => [...prev, slotKey]);
    setToast("Supplements geloggt!");
    setExpandedSlot(null);
    setSaving(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text }}>Stack</h1>

      {/* Next intake */}
      <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
        {nextSlot ? (
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3 }}>Naechste Einnahme</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: ht.text, marginTop: 4 }}>
              {SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.time} {SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.label}
            </p>
            <p style={{ fontSize: 13, color: ht.text2, marginTop: 4 }}>
              {(SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.items || []).join(", ")}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} style={{ color: ht.success }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: ht.success }}>Alle Einnahmen erledigt</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
        {Object.entries(SUPPLEMENT_SCHEDULE).map(([key, slot]) => {
          if (key === "pre_wo" && !isTraining) return null;
          const extra = key === "fruehstueck" && userKey === "maria" ? [...slot.items, "Kreatin"] : slot.items;
          const taken = takenSlots.includes(key);
          const expanded = expandedSlot === key;

          return (
            <div key={key}>
              <button onClick={() => setExpandedSlot(expanded ? null : key)} className="flex gap-3 w-full text-left">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs"
                    style={{ background: taken ? ht.accent : "transparent", borderColor: taken ? ht.accent : ht.border, color: taken ? ht.bg : ht.text3 }}>
                    {taken ? <Check size={12} /> : <Clock size={12} />}
                  </div>
                  <div className="w-0.5 flex-1 my-1" style={{ background: ht.border }} />
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12, color: ht.text3 }}>{slot.time}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: ht.text }}>{slot.label}</span>
                    {!taken && (expanded ? <ChevronUp size={14} className="ml-auto" style={{ color: ht.text3 }} /> : <ChevronDown size={14} className="ml-auto" style={{ color: ht.text3 }} />)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extra.map((item) => (
                      <span key={item} style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 20,
                        background: taken ? ht.accentDim : ht.bg,
                        border: `0.5px solid ${taken ? ht.accentBorder : ht.border}`,
                        color: taken ? ht.accent : ht.text2,
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              </button>
              {expanded && !taken && (
                <div className="pl-10 pb-3">
                  <button onClick={() => markSlotTaken(key)} disabled={saving === key}
                    className="px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: ht.accentDim, color: ht.accent, border: `1px solid ${ht.accentBorder}` }}>
                    {saving === key ? "..." : "Alle genommen"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stack list */}
      <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>Vollstaendiger Stack</p>
        {SUPPLEMENT_STACK.filter((s) => !s.nur_maria || userKey === "maria").map((s) => (
          <div key={s.name} className="py-1.5" style={{ borderBottom: `1px solid ${ht.border}` }}>
            <div className="flex justify-between"><span style={{ fontSize: 12, fontWeight: 500, color: ht.text }}>{s.name}</span></div>
            <p style={{ fontSize: 10, color: ht.text3 }}>{s.dosis}</p>
          </div>
        ))}
      </div>

      <Disclaimer />
      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
