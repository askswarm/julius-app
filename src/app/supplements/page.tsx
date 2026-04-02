"use client";

import { useEffect, useState } from "react";
import { Syringe, Check, Info, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodaySupplements, getLatestBloodwork } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE, SUPPLEMENT_STACK, BLOODWORK_MARKERS, COLORS } from "@/lib/constants";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import ScoreRing from "@/components/ScoreRing";

const TABS = ["Tagesplan", "Mein Stack", "Blutwerte"] as const;
type Tab = (typeof TABS)[number];

const TRT_DAYS = [3, 6]; // Mi=3, Sa=6

function SupplementSlot({ slotKey, time, label, items, taken }: {
  slotKey: string; time: string; label: string; items: string[]; taken: boolean;
}) {
  return (
    <div className="flex gap-3">
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
          <span className="text-xs text-slate-500">{time}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {items.map((item) => (
            <span key={item} className={`text-xs px-2 py-0.5 rounded-full ${
              taken ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
            }`}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    getTodaySupplements(user.id).then(setTakenSlots);
    getLatestBloodwork(user.id).then(setBloodwork);
  }, [user.id]);

  const dayOfWeek = new Date().getDay();
  const isTraining = ![0, 3].includes(dayOfWeek); // Mi=3, So=0 sind keine Trainingstage
  const isTrtDay = userKey === "vincent" && TRT_DAYS.includes(dayOfWeek);

  // Compliance
  const totalSlots = Object.keys(SUPPLEMENT_SCHEDULE).length - (isTraining ? 0 : 1);
  const takenCount = takenSlots.length;
  const compliancePct = totalSlots > 0 ? Math.round((takenCount / totalSlots) * 100) : 0;

  // Stack grouped
  const categories = [...new Set(SUPPLEMENT_STACK.filter(s => !s.nur_maria || userKey === "maria").map(s => s.kategorie))];

  // Monthly cost
  const monthlyCost = SUPPLEMENT_STACK
    .filter(s => !s.nur_maria || userKey === "maria")
    .reduce((sum, s) => sum + s.preis_monat, 0);

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
          {/* Compliance Ring */}
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

          {/* Timeline */}
          <Card>
            {Object.entries(SUPPLEMENT_SCHEDULE).map(([key, slot]) => {
              if (key === "pre_wo" && !isTraining) return null;
              const extra = key === "fruehstueck" && userKey === "maria" ? [...slot.items, "Kreatin"] : slot.items;
              return (
                <SupplementSlot
                  key={key}
                  slotKey={key}
                  time={slot.time}
                  label={slot.label}
                  items={extra}
                  taken={takenSlots.includes(key)}
                />
              );
            })}

            {/* TRT Badge */}
            {isTrtDay && (
              <div className="flex items-center gap-2 mt-2 pl-11">
                <Syringe size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">TRT 0.2ml — Injektionstag</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Mein Stack" && (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 px-1">{cat}</h3>
              <div className="flex flex-col gap-2">
                {SUPPLEMENT_STACK.filter(s => s.kategorie === cat && (!s.nur_maria || userKey === "maria")).map((s) => (
                  <Card key={s.name} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.dosis} · {s.produkt}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{s.warum}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{s.preis_monat} EUR</span>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <Card className="bg-blue-50 dark:bg-blue-950">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Monatskosten: ~{monthlyCost} EUR</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Sunday Natural, APOrtha, Supplera PUR, Kaneka
            </p>
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
    </div>
  );
}
