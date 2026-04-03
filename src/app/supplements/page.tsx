"use client";

import { useEffect, useState, useCallback } from "react";
import { Syringe, Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodaySupplements, getLatestBloodwork } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE, SUPPLEMENT_STACK, BLOODWORK_MARKERS, COLORS } from "@/lib/constants";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import ScoreRing from "@/components/ScoreRing";
import Toast from "@/components/Toast";
import SupplementAdvisor from "@/components/SupplementAdvisor";
import AdaptationsCard from "@/components/AdaptationsCard";
import PeptideTracker from "@/components/PeptideTracker";

const TABS = ["Tagesplan", "Protokolle", "Blutwerte"] as const;
type Tab = (typeof TABS)[number];

const TRT_DAYS = [3, 6];

function BloodworkMarkerCard({ label, wert, einheit, opt_min, opt_max, datum }: {
  label: string; wert: number; einheit: string; opt_min: number; opt_max: number; datum: string;
}) {
  const status = wert >= opt_min && wert <= opt_max ? "green" : (wert < opt_min * 0.8 || wert > opt_max * 1.2) ? "red" : "amber";
  const bg = { green: "bg-emerald-50 dark:bg-emerald-950", amber: "bg-amber-50 dark:bg-amber-950", red: "bg-red-50 dark:bg-red-950" }[status];
  const text = { green: "text-emerald-600", amber: "text-amber-600", red: "text-red-600" }[status];

  return (
    <div className={`${bg} rounded-xl p-3`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${text}`}>{wert} <span className="text-xs font-normal">{einheit}</span></p>
      <p className="text-[10px] text-slate-400">Optimal: {opt_min}–{opt_max} · {datum?.slice(5)}</p>
    </div>
  );
}

export default function SupplementsPage() {
  const { user, userKey } = useUser();
  const [tab, setTab] = useState<Tab>("Tagesplan");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [bloodwork, setBloodwork] = useState<Record<string, { wert: number; datum: string }>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const reload = useCallback(() => {
    getTodaySupplements(user.id).then(setTakenSlots);
    getLatestBloodwork(user.id).then(setBloodwork);
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  const dayOfWeek = new Date().getDay();
  const isTraining = ![0, 3].includes(dayOfWeek);
  const isTrtDay = userKey === "vincent" && TRT_DAYS.includes(dayOfWeek);

  const totalSlots = Object.keys(SUPPLEMENT_SCHEDULE).length - (isTraining ? 0 : 1);
  const takenCount = takenSlots.length;
  const compliancePct = totalSlots > 0 ? Math.round((takenCount / totalSlots) * 100) : 0;

  const categories = [...new Set(SUPPLEMENT_STACK.filter(s => !s.nur_maria || userKey === "maria").map(s => s.kategorie))];
  const monthlyCost = SUPPLEMENT_STACK
    .filter(s => !s.nur_maria || userKey === "maria")
    .reduce((sum, s) => sum + s.preis_monat, 0);

  async function markSlotTaken(slotKey: string, items: string[]) {
    if (takenSlots.includes(slotKey)) return;
    setSaving(slotKey);

    try {
      await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: user.id, zeitpunkt: slotKey, items }),
      });

      setTakenSlots((prev) => [...prev, slotKey]);
      setToast("Supplements geloggt!");
      setExpandedSlot(null);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Supplements</h1>
        <FamilySwitcher />
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === t ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"
            }`}>{t}</button>
        ))}
      </div>

      {tab === "Tagesplan" && (
        <div className="flex flex-col gap-2">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Heute</p>
              <p className="text-xs text-slate-500">{takenCount}/{totalSlots} Zeitpunkte</p>
            </div>
            <ScoreRing
              value={compliancePct}
              label=""
              color={compliancePct >= 80 ? COLORS.green : compliancePct >= 60 ? COLORS.amber : COLORS.red}
              size={56}
            />
          </Card>

          <Card>
            {Object.entries(SUPPLEMENT_SCHEDULE).map(([key, slot]) => {
              if (key === "pre_wo" && !isTraining) return null;
              const extra = key === "fruehstueck" && userKey === "maria" ? [...slot.items, "Kreatin"] : slot.items;
              const taken = takenSlots.includes(key);
              const expanded = expandedSlot === key;

              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedSlot(expanded ? null : key)}
                    className="flex gap-3 w-full text-left"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                        taken ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-400"
                      }`}>
                        {taken ? <Check size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{slot.time}</span>
                        <span className="text-sm font-medium">{slot.label}</span>
                        {!taken && (expanded ? <ChevronUp size={14} className="text-slate-400 ml-auto" /> : <ChevronDown size={14} className="text-slate-400 ml-auto" />)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {extra.map((item) => (
                          <span key={item} className={`text-xs px-2 py-0.5 rounded-full ${
                            taken ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                          }`}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </button>

                  {expanded && !taken && (
                    <div className="pl-11 pb-4">
                      <button
                        onClick={() => markSlotTaken(key, extra)}
                        disabled={saving === key}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: "var(--grad-teal)", color: "#0D1117" }}
                      >
                        {saving === key ? "..." : "Alle genommen"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isTrtDay && (
              <div className="flex items-center gap-2 mt-2 pl-11">
                <Syringe size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">TRT 0.2ml — Injektionstag</span>
              </div>
            )}
          </Card>

          {/* Peptides */}
          <PeptideTracker />

          {/* Adaptations */}
          <AdaptationsCard />

          {/* Supplement Advisor */}
          <SupplementAdvisor />
        </div>
      )}

      {tab === "Protokolle" && (
        <div className="flex flex-col gap-4">
          {/* TRT (Vincent only) */}
          {userKey === "vincent" && (
            <Card className="border-l-[3px] border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <Syringe size={16} style={{ color: "#F97316" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>TRT Protokoll</p>
              </div>
              <div className="text-sm flex flex-col gap-1.5" style={{ color: "var(--text2)" }}>
                <div className="flex justify-between"><span>Dosis</span><span style={{ color: "var(--text)" }}>120mg/Woche (2x 60mg)</span></div>
                <div className="flex justify-between"><span>Naechste Injektion</span><span style={{ color: "var(--text)" }}>
                  {(() => {
                    const now = new Date();
                    const day = now.getDay();
                    const nextTrt = day <= 3 ? 3 - day : day <= 6 ? 6 - day : 3 + 7 - day;
                    const nextDate = new Date(now.getTime() + nextTrt * 86400000);
                    return nextTrt === 0 ? "Heute" : nextDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" });
                  })()}
                </span></div>
                <div className="flex justify-between"><span>Schema</span><span style={{ color: "var(--text)" }}>Mi + Sa, SubQ</span></div>
              </div>
              {isTrtDay && (
                <div className="mt-3 flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: "rgba(249,115,22,0.08)" }}>
                  <Syringe size={14} style={{ color: "#F97316" }} />
                  <span className="text-xs font-medium" style={{ color: "#F97316" }}>Heute: Injektionstag — 0.2ml</span>
                </div>
              )}
            </Card>
          )}

          {/* Peptides */}
          <PeptideTracker />

          {/* Supplement Advisor */}
          <SupplementAdvisor />

          {/* Full Stack Reference */}
          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Vollstaendiger Stack</p>
            {categories.map((cat) => (
              <div key={cat} className="mb-3">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>{cat}</p>
                {SUPPLEMENT_STACK.filter(s => s.kategorie === cat && (!s.nur_maria || userKey === "maria")).map((s) => (
                  <div key={s.name} className="flex justify-between py-1">
                    <span className="text-xs" style={{ color: "var(--text)" }}>{s.name} — {s.dosis}</span>
                    <span className="text-[10px]" style={{ color: "var(--text3)" }}>{s.preis_monat} EUR</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--card-border)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>Monatskosten: ~{monthlyCost} EUR</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "Blutwerte" && (
        <div className="flex flex-col gap-4">
          {Object.keys(bloodwork).length > 0 ? (
            BLOODWORK_MARKERS.map((group) => {
              const visibleMarkers = group.markers.filter((m) => bloodwork[m.key]);
              if (visibleMarkers.length === 0) return null;
              return (
                <div key={group.group}>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 px-1">{group.group}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleMarkers.map((m) => (
                      <BloodworkMarkerCard
                        key={m.key}
                        label={m.label}
                        wert={bloodwork[m.key].wert}
                        einheit={m.einheit}
                        opt_min={m.opt_min}
                        opt_max={m.opt_max}
                        datum={bloodwork[m.key].datum}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <Card>
              <p className="text-sm text-slate-500 text-center py-8">
                Noch keine Blutwerte eingetragen.<br />
                Kommt in der naechsten Version: Formular + Analyse.
              </p>
            </Card>
          )}
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
