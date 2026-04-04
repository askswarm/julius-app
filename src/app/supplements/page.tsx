"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Syringe, Check, Clock, ChevronDown, ChevronUp, Camera, FileText, Edit3, Share2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getTodaySupplements, getLatestBloodwork } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE, SUPPLEMENT_STACK, BLOODWORK_MARKERS, COLORS } from "@/lib/constants";
import { analyzeProtocol } from "@/lib/protocolEngine";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import Toast from "@/components/Toast";
import SupplementAdvisor from "@/components/SupplementAdvisor";
import AdaptationsCard from "@/components/AdaptationsCard";
import Disclaimer from "@/components/Disclaimer";
import PeptideTracker from "@/components/PeptideTracker";
import BodyMap, { getRecommendedSite, SITE_LABELS, SITE_COLORS } from "@/components/BodyMap";

const TABS = ["Supplements", "Protokolle", "Blutwerte"] as const;
type Tab = (typeof TABS)[number];

const TRT_DAYS = [3, 6];
const SLOT_TIMES: Record<string, number> = { nuechtern: 7, fruehstueck: 9, pre_wo: 11.5, mittag: 13, abend: 19 };

// Bloodwork reference ranges
const BW_MARKERS = [
  { key: "testosteron_gesamt", label: "Testosteron gesamt", einheit: "ng/dL", min: 300, max: 1000, group: "Hormone" },
  { key: "testosteron_frei", label: "Testosteron frei", einheit: "pg/mL", min: 9, max: 30, group: "Hormone" },
  { key: "shbg", label: "SHBG", einheit: "nmol/L", min: 10, max: 57, group: "Hormone" },
  { key: "oestradiol", label: "Oestradiol", einheit: "pg/mL", min: 20, max: 40, group: "Hormone" },
  { key: "psa", label: "PSA", einheit: "ng/mL", min: 0, max: 4, group: "Hormone" },
  { key: "haematokrit", label: "Haematokrit", einheit: "%", min: 38, max: 52, group: "Blutbild" },
  { key: "haemoglobin", label: "Haemoglobin", einheit: "g/dL", min: 13, max: 17, group: "Blutbild" },
  { key: "got", label: "GOT/AST", einheit: "U/L", min: 10, max: 40, group: "Leber" },
  { key: "gpt", label: "GPT/ALT", einheit: "U/L", min: 10, max: 40, group: "Leber" },
  { key: "hscrp", label: "hsCRP", einheit: "mg/L", min: 0, max: 1, group: "Entzuendung" },
  { key: "homocystein", label: "Homocystein", einheit: "umol/L", min: 5, max: 12, group: "Entzuendung" },
  { key: "vitamin_d", label: "Vitamin D", einheit: "ng/mL", min: 40, max: 80, group: "Vitamine" },
  { key: "b12", label: "Vitamin B12", einheit: "pg/mL", min: 300, max: 900, group: "Vitamine" },
  { key: "ferritin", label: "Ferritin", einheit: "ng/mL", min: 30, max: 300, group: "Vitamine" },
  { key: "tsh", label: "TSH", einheit: "mIU/L", min: 0.4, max: 4, group: "Schilddruese" },
];

function getStatus(wert: number, min: number, max: number): "green" | "yellow" | "red" {
  if (wert >= min && wert <= max) return "green";
  if (wert < min * 0.9 || wert > max * 1.1) return "red";
  return "yellow";
}
const STATUS_COLORS = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444" };

export default function SupplementsPage() {
  const { user, userKey } = useUser();
  const [tab, setTab] = useState<Tab>("Supplements");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [bloodwork, setBloodwork] = useState<Record<string, { wert: number; datum: string }>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // TRT state
  const [trtLogs, setTrtLogs] = useState<{ datum: string; dosis_mg: number; injection_site: string; notizen: string }[]>([]);
  const [showTrtLog, setShowTrtLog] = useState(false);
  const [trtSite, setTrtSite] = useState<string | null>(null);
  const [trtDose, setTrtDose] = useState(60);
  const [trtNotes, setTrtNotes] = useState("");
  const [trtSaving, setTrtSaving] = useState(false);

  // Bloodwork input state
  const [bwMode, setBwMode] = useState<"view" | "manual" | "scan">("view");
  const [bwValues, setBwValues] = useState<Record<string, number>>({});
  const [bwDate, setBwDate] = useState(new Date().toISOString().split("T")[0]);
  const [bwSaving, setBwSaving] = useState(false);
  const [bwScanning, setBwScanning] = useState(false);
  const [bwRecs, setBwRecs] = useState<{ marker: string; status: string; text: string }[]>([]);
  const bwFileRef = useRef<HTMLInputElement>(null);

  // Protocol alerts
  const [alerts, setAlerts] = useState<{ type: string; message: string; action: string }[]>([]);

  const reload = useCallback(() => {
    getTodaySupplements(user.id).then(setTakenSlots);
    getLatestBloodwork(user.id).then((bw) => {
      setBloodwork(bw);
      const a = analyzeProtocol(bw, userKey === "vincent", null, user.geschlecht);
      setAlerts(a);
    });
    fetch(`/api/trt?chatId=${user.id}`).then((r) => r.json()).then((d) => setTrtLogs(d.logs || [])).catch(() => {});
  }, [user.id, userKey, user.geschlecht]);

  useEffect(() => { reload(); }, [reload]);

  const dayOfWeek = new Date().getDay();
  const isTraining = ![0, 3].includes(dayOfWeek);
  const isTrtDay = userKey === "vincent" && TRT_DAYS.includes(dayOfWeek);
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  // Next supplement slot
  const nextSlot = Object.entries(SLOT_TIMES).find(([key, time]) => {
    if (key === "pre_wo" && !isTraining) return false;
    return time > currentHour && !takenSlots.includes(key);
  });

  const categories = [...new Set(SUPPLEMENT_STACK.filter((s) => !s.nur_maria || userKey === "maria").map((s) => s.kategorie))];

  async function markSlotTaken(slotKey: string) {
    if (takenSlots.includes(slotKey)) return;
    setSaving(slotKey);
    await fetch("/api/supplements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: user.id, zeitpunkt: slotKey }) });
    setTakenSlots((prev) => [...prev, slotKey]);
    setToast("Supplements geloggt!");
    setExpandedSlot(null);
    setSaving(null);
  }

  async function logTrt() {
    if (!trtSite) return;
    setTrtSaving(true);
    const conc = 300;
    await fetch("/api/trt", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: user.id, dosis_mg: trtDose, volume_ml: Math.round((trtDose / conc) * 100) / 100, stelle: trtSite, notizen: trtNotes }) });
    setToast("TRT geloggt!");
    setShowTrtLog(false);
    setTrtNotes("");
    setTrtSite(null);
    setTrtSaving(false);
    reload();
  }

  async function saveBw() {
    setBwSaving(true);
    const markers = Object.entries(bwValues).filter(([, v]) => v > 0).map(([k, v]) => {
      const ref = BW_MARKERS.find((m) => m.key === k);
      return { marker: k, wert: v, einheit: ref?.einheit || "" };
    });
    await fetch("/api/bloodwork", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: user.id, datum: bwDate, markers }) });
    // AI analysis
    const aiRes = await fetch("/api/bloodwork/analyze-ai", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markers, gender: user.geschlecht, hasTRT: userKey === "vincent" }) });
    const aiData = await aiRes.json();
    setBwRecs(aiData.recommendations || []);
    setToast(`${markers.length} Blutwerte gespeichert!`);
    setBwMode("view");
    setBwSaving(false);
    reload();
  }

  async function scanBw(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBwScanning(true);
    setBwMode("manual");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/bloodwork/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result }) });
        const data = await res.json();
        if (data.success && data.markers) {
          const vals: Record<string, number> = {};
          data.markers.forEach((m: { marker: string; wert: number }) => { vals[m.marker] = m.wert; });
          setBwValues(vals);
          setToast(`${data.markers.length} Marker erkannt!`);
        }
      } catch { setToast("Scan fehlgeschlagen"); }
      setBwScanning(false);
    };
    reader.readAsDataURL(file);
  }

  const lastTrtSites = trtLogs.slice(0, 6).map((l) => l.injection_site);
  const recSite = getRecommendedSite(lastTrtSites);
  const inputStyle = { background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Protocol Stack</h1>
        <FamilySwitcher />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--subtle-bg)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm rounded-lg font-medium transition-all"
            style={{ background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--accent)" : "var(--text3)" }}>{t}</button>
        ))}
      </div>

      {/* === SUPPLEMENTS TAB === */}
      {tab === "Supplements" && (
        <div className="flex flex-col gap-3">
          {/* Next intake hero */}
          <Card glow={!!nextSlot}>
            {nextSlot ? (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text3)" }}>Naechste Einnahme</p>
                <p className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>{SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.time} {SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.label}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>
                  {(SUPPLEMENT_SCHEDULE[nextSlot[0] as keyof typeof SUPPLEMENT_SCHEDULE]?.items || []).join(", ")}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} style={{ color: "#10B981" }} />
                <p className="text-sm font-medium" style={{ color: "#10B981" }}>Alles erledigt fuer heute</p>
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            {Object.entries(SUPPLEMENT_SCHEDULE).map(([key, slot]) => {
              if (key === "pre_wo" && !isTraining) return null;
              const extra = key === "fruehstueck" && userKey === "maria" ? [...slot.items, "Kreatin"] : slot.items;
              const taken = takenSlots.includes(key);
              const pastTime = SLOT_TIMES[key] < currentHour;
              const expanded = expandedSlot === key;

              return (
                <div key={key}>
                  <button onClick={() => setExpandedSlot(expanded ? null : key)} className="flex gap-3 w-full text-left">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs ${taken ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>
                        {taken ? <Check size={12} /> : <Clock size={12} />}
                      </div>
                      <div className="w-0.5 flex-1 my-1" style={{ background: "var(--bar-bg)" }} />
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text3)" }}>{slot.time}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{slot.label}</span>
                        {!taken && (expanded ? <ChevronUp size={14} className="ml-auto" style={{ color: "var(--text3)" }} /> : <ChevronDown size={14} className="ml-auto" style={{ color: "var(--text3)" }} />)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extra.map((item) => (
                          <span key={item} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: taken ? "rgba(16,185,129,0.1)" : "var(--subtle-bg)", color: taken ? "#10B981" : "var(--text3)" }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                  {expanded && !taken && (
                    <div className="pl-10 pb-3">
                      <button onClick={() => markSlotTaken(key)} disabled={saving === key}
                        className="px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
                        {saving === key ? "..." : "Alle genommen"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isTrtDay && (
              <div className="flex items-center gap-2 mt-2 pl-10">
                <Syringe size={14} style={{ color: "#F97316" }} />
                <span className="text-xs font-medium" style={{ color: "#F97316" }}>TRT — Injektionstag</span>
              </div>
            )}
          </Card>

          <AdaptationsCard />
          <SupplementAdvisor />
          <Disclaimer />
        </div>
      )}

      {/* === PROTOKOLLE TAB === */}
      {tab === "Protokolle" && (
        <div className="flex flex-col gap-4">
          {/* TRT (Vincent only) */}
          {userKey === "vincent" && (
            <>
              <Card className="border-l-[3px] border-orange-400">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Syringe size={16} style={{ color: "#F97316" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>TRT Protokoll</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aktiv</span>
                  </div>
                </div>
                <div className="text-xs flex flex-col gap-1" style={{ color: "var(--text2)" }}>
                  <div className="flex justify-between"><span>Schema</span><span style={{ color: "var(--text)" }}>120mg/Woche (2x 60mg, Mi+Sa, SubQ)</span></div>
                  <div className="flex justify-between"><span>Volumen</span><span style={{ color: "var(--text)" }}>0.2ml (300mg/ml)</span></div>
                  {trtLogs[0] && <div className="flex justify-between"><span>Letzte</span><span style={{ color: "var(--text)" }}>{trtLogs[0].datum?.slice(5)} — {trtLogs[0].dosis_mg}mg, {SITE_LABELS[trtLogs[0].injection_site] || trtLogs[0].injection_site}</span></div>}
                  <div className="flex justify-between"><span>Naechste</span><span style={{ color: isTrtDay ? "#F97316" : "var(--text)" }}>
                    {isTrtDay ? "Heute" : (() => { const d = dayOfWeek; const next = d <= 3 ? 3 - d : d <= 6 ? 6 - d : 3 + 7 - d; return next === 0 ? "Heute" : `In ${next} Tagen`; })()}
                  </span></div>
                </div>

                <button onClick={() => { setShowTrtLog(true); setTrtSite(null); }}
                  className="w-full py-3 rounded-xl text-sm font-bold mt-3"
                  style={{ background: "var(--grad-teal)", color: "#0D1117", height: 48 }}>
                  Injektion loggen
                </button>
              </Card>

              {/* TRT History */}
              {trtLogs.length > 0 && (
                <Card>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>Verlauf</p>
                  {trtLogs.slice(0, 8).map((l, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < 7 ? "1px solid var(--card-border)" : "none" }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SITE_COLORS[l.injection_site] || "var(--text3)" }} />
                      <span className="text-xs flex-1" style={{ color: "var(--text)" }}>{l.datum?.slice(5)}</span>
                      <span className="text-xs" style={{ color: "var(--text2)" }}>{l.dosis_mg}mg</span>
                      <span className="text-[10px]" style={{ color: "var(--text3)" }}>{SITE_LABELS[l.injection_site] || l.injection_site}</span>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* Peptides */}
          <PeptideTracker />

          {/* Protocol Alerts */}
          {alerts.length > 0 && (
            <Card>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>Julius Empfiehlt</p>
              {alerts.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-2" style={{ borderBottom: i < 2 ? "1px solid var(--card-border)" : "none" }}>
                  <AlertTriangle size={14} style={{ color: a.type === "critical" ? "#EF4444" : "#F59E0B", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{a.message}</p>
                    <p className="text-[10px]" style={{ color: "var(--text3)" }}>{a.action}</p>
                  </div>
                </div>
              ))}
              <Disclaimer />
            </Card>
          )}
        </div>
      )}

      {/* === BLUTWERTE TAB === */}
      {tab === "Blutwerte" && (
        <div className="flex flex-col gap-3">
          <input ref={bwFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={scanBw} />

          {bwMode === "view" && (
            <>
              {Object.keys(bloodwork).length > 0 ? (
                <>
                  {/* Marker list with status dots */}
                  <Card>
                    {BW_MARKERS.filter((m) => bloodwork[m.key]).sort((a, b) => {
                      const sa = getStatus(bloodwork[a.key].wert, a.min, a.max);
                      const sb = getStatus(bloodwork[b.key].wert, b.min, b.max);
                      const order = { red: 0, yellow: 1, green: 2 };
                      return order[sa] - order[sb];
                    }).map((m) => {
                      const bw = bloodwork[m.key];
                      const status = getStatus(bw.wert, m.min, m.max);
                      return (
                        <div key={m.key} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                          <div className="flex-1">
                            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{m.label}</p>
                            <p className="text-[10px]" style={{ color: "var(--text3)" }}>Ref: {m.min}–{m.max} {m.einheit}</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color: STATUS_COLORS[status] }}>{bw.wert}</span>
                          <span className="text-[10px]" style={{ color: "var(--text3)" }}>{m.einheit}</span>
                        </div>
                      );
                    })}
                  </Card>
                  {bwRecs.length > 0 && (
                    <Card>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>AI-Analyse</p>
                      {bwRecs.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 py-2">
                          <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: r.status === "critical" ? "#EF4444" : r.status === "warning" ? "#F59E0B" : "#10B981" }} />
                          <p className="text-xs" style={{ color: "var(--text2)" }}>{r.text}</p>
                        </div>
                      ))}
                      <Disclaimer />
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <p className="text-sm font-medium text-center mb-1" style={{ color: "var(--text)" }}>Blutwerte hinzufuegen</p>
                  <p className="text-xs text-center mb-4" style={{ color: "var(--text3)" }}>Laborergebnisse hochladen oder manuell eintragen</p>
                </Card>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => bwFileRef.current?.click()} className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
                  <Camera size={18} style={{ color: "var(--accent)" }} />
                  <span className="text-[10px]" style={{ color: "var(--text2)" }}>Foto/Scan</span>
                </button>
                <button onClick={() => bwFileRef.current?.click()} className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
                  <FileText size={18} style={{ color: "var(--accent2)" }} />
                  <span className="text-[10px]" style={{ color: "var(--text2)" }}>PDF Upload</span>
                </button>
                <button onClick={() => setBwMode("manual")} className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
                  <Edit3 size={18} style={{ color: "var(--orange)" }} />
                  <span className="text-[10px]" style={{ color: "var(--text2)" }}>Manuell</span>
                </button>
              </div>

              {Object.keys(bloodwork).length > 0 && (
                <button onClick={() => {
                  const text = BW_MARKERS.filter((m) => bloodwork[m.key]).map((m) => `${m.label}: ${bloodwork[m.key].wert} ${m.einheit}`).join("\n");
                  if (navigator.share) navigator.share({ title: "Blutwerte", text }).catch(() => {});
                  else { navigator.clipboard.writeText(text); setToast("In Zwischenablage kopiert"); }
                }} className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: "var(--accent)" }}>
                  <Share2 size={14} /> An Arzt senden
                </button>
              )}
            </>
          )}

          {bwMode === "manual" && (
            <div className="flex flex-col gap-3">
              {bwScanning && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
                  <span className="text-sm" style={{ color: "var(--text2)" }}>Laborbericht wird analysiert...</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Blutwerte eingeben</p>
                <button onClick={() => setBwMode("view")} className="text-xs" style={{ color: "var(--text3)" }}>Abbrechen</button>
              </div>

              <div>
                <label className="text-[10px]" style={{ color: "var(--text3)" }}>Datum</label>
                <input type="date" value={bwDate} onChange={(e) => setBwDate(e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              </div>

              {["Hormone", "Blutbild", "Leber", "Entzuendung", "Vitamine", "Schilddruese"].map((group) => {
                const markers = BW_MARKERS.filter((m) => m.group === group);
                if (!markers.length) return null;
                return (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {markers.map((m) => {
                        const val = bwValues[m.key] || 0;
                        const status = val > 0 ? getStatus(val, m.min, m.max) : null;
                        return (
                          <div key={m.key} className="flex items-center gap-1">
                            {status && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[status] }} />}
                            <div className="flex-1">
                              <label className="text-[9px]" style={{ color: "var(--text3)" }}>{m.label}</label>
                              <input type="number" step="0.1" value={val || ""} placeholder="—"
                                onChange={(e) => setBwValues({ ...bwValues, [m.key]: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 rounded-lg text-xs border" style={inputStyle} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button onClick={saveBw} disabled={bwSaving}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
                {bwSaving ? "Speichern..." : "Blutwerte speichern"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TRT Log Modal */}
      {showTrtLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "var(--overlay)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 overflow-y-auto" style={{ background: "var(--card)", maxHeight: "85vh", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>TRT Injektion loggen</p>
              <button onClick={() => setShowTrtLog(false)} className="text-xs" style={{ color: "var(--text3)" }}>Abbrechen</button>
            </div>

            <div className="mb-4">
              <label className="text-[10px]" style={{ color: "var(--text3)" }}>Dosis (mg)</label>
              <input type="number" value={trtDose} onChange={(e) => setTrtDose(Number(e.target.value))}
                className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              <p className="text-[10px] mt-1" style={{ color: "var(--accent)" }}>= {(trtDose / 300).toFixed(2)}ml (300mg/ml)</p>
            </div>

            <p className="text-[10px] mb-2" style={{ color: "var(--text3)" }}>Injektionsstelle</p>
            <BodyMap selectedSite={trtSite} lastSite={trtLogs[0]?.injection_site} recommendedSite={recSite} onSelect={setTrtSite} />

            <div className="mt-4">
              <label className="text-[10px]" style={{ color: "var(--text3)" }}>Notizen</label>
              <input value={trtNotes} onChange={(e) => setTrtNotes(e.target.value)} placeholder="Problemlos, leichte Roetung..."
                className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>

            <button onClick={logTrt} disabled={!trtSite || trtSaving}
              className="w-full py-3 rounded-xl text-sm font-bold mt-4"
              style={{ background: trtSite ? "var(--grad-teal)" : "var(--bar-bg)", color: "#0D1117" }}>
              {trtSaving ? "Speichern..." : "TRT loggen"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
