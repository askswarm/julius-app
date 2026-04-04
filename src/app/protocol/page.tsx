"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Syringe, Check, Clock, ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useUser } from "@/lib/UserContext";
import { getTodaySupplements, getLatestBloodwork } from "@/lib/queries";
import { SUPPLEMENT_SCHEDULE, COLORS } from "@/lib/constants";
import { appAccent, halflifeTheme as ht } from "@/lib/appConfig";
import { analyzeProtocol } from "@/lib/protocolEngine";
import Card from "@/components/Card";
import Toast from "@/components/Toast";
import PeptideTracker from "@/components/PeptideTracker";
import BodyMap, { getRecommendedSite, SITE_LABELS, SITE_COLORS } from "@/components/BodyMap";

export default function ProtocolPage() {
  const { user, userKey } = useUser();
  const [toast, setToast] = useState("");
  const [trtLogs, setTrtLogs] = useState<{ datum: string; dosis_mg: number; injection_site: string; notizen: string }[]>([]);
  const [showTrtLog, setShowTrtLog] = useState(false);
  const [trtSite, setTrtSite] = useState<string | null>(null);
  const [trtDose, setTrtDose] = useState(60);
  const [trtNotes, setTrtNotes] = useState("");
  const [trtSaving, setTrtSaving] = useState(false);
  const [alerts, setAlerts] = useState<{ type: string; message: string; action: string }[]>([]);

  const reload = useCallback(() => {
    fetch(`/api/trt?chatId=${user.id}`).then((r) => r.json()).then((d) => setTrtLogs(d.logs || [])).catch(() => {});
    getLatestBloodwork(user.id).then((bw) => setAlerts(analyzeProtocol(bw, true, null, user.geschlecht)));
  }, [user.id, user.geschlecht]);

  useEffect(() => { reload(); }, [reload]);

  const dayOfWeek = new Date().getDay();
  const isTrtDay = [3, 6].includes(dayOfWeek);
  const lastTrtSites = trtLogs.slice(0, 6).map((l) => l.injection_site);
  const recSite = getRecommendedSite(lastTrtSites);

  async function logTrt() {
    if (!trtSite) return;
    setTrtSaving(true);
    await fetch("/api/trt", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: user.id, dosis_mg: trtDose, volume_ml: Math.round((trtDose / 300) * 100) / 100, stelle: trtSite, notizen: trtNotes }) });
    setToast("TRT geloggt!"); setShowTrtLog(false); setTrtNotes(""); setTrtSite(null); setTrtSaving(false); reload();
  }

  const inputStyle = { background: ht.card, color: ht.text, borderColor: ht.border };

  return (
    <div className="flex flex-col gap-4">
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text }}>Protocol</h1>

      {/* TRT */}
      <div>
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>TRT</p>
        <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Syringe size={16} style={{ color: ht.accent }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: ht.text }}>TRT Protokoll</span>
            </div>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: ht.accentDim, color: ht.accent }}>Aktiv</span>
          </div>
          <div style={{ fontSize: 13, color: ht.text2 }} className="flex flex-col gap-1">
            <div className="flex justify-between"><span>Schema</span><span style={{ color: ht.text }}>120mg/Woche (2x 60mg, Mi+Sa, SubQ)</span></div>
            <div className="flex justify-between"><span>Volumen</span><span style={{ color: ht.text }}>0.2ml (300mg/ml)</span></div>
            {trtLogs[0] && <div className="flex justify-between"><span>Letzte</span><span style={{ color: ht.text }}>{trtLogs[0].datum?.slice(5)} — {trtLogs[0].dosis_mg}mg, {SITE_LABELS[trtLogs[0].injection_site] || trtLogs[0].injection_site}</span></div>}
            <div className="flex justify-between"><span>Naechste</span><span style={{ color: isTrtDay ? ht.accent : ht.text }}>{isTrtDay ? "Heute" : `In ${dayOfWeek <= 3 ? 3 - dayOfWeek : 6 - dayOfWeek || 7} Tagen`}</span></div>
          </div>
          <button onClick={() => { setShowTrtLog(true); setTrtSite(null); }}
            className="w-full py-3 rounded-xl text-sm font-bold mt-3"
            style={{ background: ht.accentDim, color: ht.accent, border: `1px solid ${ht.accentBorder}` }}>
            Injektion loggen
          </button>
        </div>
      </div>

      {/* PK Curve */}
      <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>Spiegel-Verlauf</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={(() => {
            const HL = 8; const DOSE = 60; const points = [];
            const now = new Date();
            for (let d = 0; d < 14; d++) {
              let level = 0;
              for (let inj = 0; inj < 8; inj++) { const t = d - inj * 3.5; if (t >= 0) level += DOSE * Math.exp(-0.693 * t / HL); }
              const date = new Date(now.getTime() - (13 - d) * 86400000);
              points.push({ day: `${date.getDate()}.${date.getMonth() + 1}`, level: Math.round(level * 10) / 10 });
            }
            return points;
          })()}>
            <defs><linearGradient id="hlPk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ht.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={ht.accent} stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: ht.text3 }} />
            <YAxis tick={{ fontSize: 9, fill: ht.text3 }} />
            <Tooltip />
            <Area type="monotone" dataKey="level" stroke={ht.accent} fill="url(#hlPk)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* TRT History */}
      {trtLogs.length > 0 && (
        <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>Verlauf</p>
          {trtLogs.slice(0, 8).map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < 7 ? `1px solid ${ht.border}` : "none" }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: SITE_COLORS[l.injection_site] || ht.text3 }} />
              <span className="text-xs flex-1" style={{ color: ht.text }}>{l.datum?.slice(5)}</span>
              <span className="text-xs" style={{ color: ht.text2 }}>{l.dosis_mg}mg</span>
              <span style={{ fontSize: 10, color: ht.text3 }}>{SITE_LABELS[l.injection_site] || l.injection_site}</span>
            </div>
          ))}
        </div>
      )}

      {/* Peptides */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3 }}>Peptide</p>
      <PeptideTracker />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>Alerts</p>
          {alerts.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl mb-2" style={{ background: ht.accentDim }}>
              <AlertTriangle size={14} style={{ color: ht.accent, marginTop: 2, flexShrink: 0 }} />
              <div><p className="text-xs font-medium" style={{ color: ht.text }}>{a.message}</p><p style={{ fontSize: 10, color: ht.text3 }}>{a.action}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* TRT Log Modal */}
      {showTrtLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 overflow-y-auto" style={{ background: ht.card, maxHeight: "85vh", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: ht.text }}>TRT Injektion loggen</p>
              <button onClick={() => setShowTrtLog(false)} className="text-xs" style={{ color: ht.text3 }}>Abbrechen</button>
            </div>
            <div className="mb-4">
              <label style={{ fontSize: 10, color: ht.text3 }}>Dosis (mg)</label>
              <input type="number" value={trtDose} onChange={(e) => setTrtDose(Number(e.target.value))}
                className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
              <p style={{ fontSize: 10, marginTop: 4, color: ht.accent }}>= {(trtDose / 300).toFixed(2)}ml</p>
            </div>
            <p style={{ fontSize: 10, color: ht.text3, marginBottom: 8 }}>Injektionsstelle</p>
            <BodyMap selectedSite={trtSite} lastSite={trtLogs[0]?.injection_site} recommendedSite={recSite} onSelect={setTrtSite} />
            <div className="mt-4">
              <label style={{ fontSize: 10, color: ht.text3 }}>Notizen</label>
              <input value={trtNotes} onChange={(e) => setTrtNotes(e.target.value)} placeholder="Problemlos..."
                className="w-full mt-0.5 px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            </div>
            <button onClick={logTrt} disabled={!trtSite || trtSaving}
              className="w-full py-3 rounded-xl text-sm font-bold mt-4"
              style={{ background: trtSite ? ht.accentDim : ht.border, color: trtSite ? ht.accent : ht.text3, border: `1px solid ${trtSite ? ht.accentBorder : ht.border}` }}>
              {trtSaving ? "Speichern..." : "TRT loggen"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
