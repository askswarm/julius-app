"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, FileText, Edit3, Share2, Loader2 } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { getLatestBloodwork } from "@/lib/queries";
import { halflifeTheme as ht, appAccent } from "@/lib/appConfig";
import Card from "@/components/Card";
import Toast from "@/components/Toast";

const BW_MARKERS = [
  { key: "testosteron_gesamt", label: "Testosteron gesamt", einheit: "ng/dL", min: 300, max: 1000, group: "Hormone" },
  { key: "testosteron_frei", label: "Testosteron frei", einheit: "pg/mL", min: 9, max: 30, group: "Hormone" },
  { key: "oestradiol", label: "Oestradiol", einheit: "pg/mL", min: 20, max: 40, group: "Hormone" },
  { key: "psa", label: "PSA", einheit: "ng/mL", min: 0, max: 4, group: "Hormone" },
  { key: "haematokrit", label: "Haematokrit", einheit: "%", min: 38, max: 52, group: "Blutbild" },
  { key: "haemoglobin", label: "Haemoglobin", einheit: "g/dL", min: 13, max: 17, group: "Blutbild" },
  { key: "hscrp", label: "hsCRP", einheit: "mg/L", min: 0, max: 1, group: "Entzuendung" },
  { key: "vitamin_d", label: "Vitamin D", einheit: "ng/mL", min: 40, max: 80, group: "Vitamine" },
  { key: "ferritin", label: "Ferritin", einheit: "ng/mL", min: 30, max: 300, group: "Vitamine" },
  { key: "tsh", label: "TSH", einheit: "mIU/L", min: 0.4, max: 4, group: "Schilddruese" },
];

function getStatus(wert: number, min: number, max: number) {
  if (wert >= min && wert <= max) return "green";
  if (wert < min * 0.9 || wert > max * 1.1) return "red";
  return "yellow";
}
const SC = { green: "#34d399", yellow: "#E8893C", red: "#e05050" };

export default function BloodPage() {
  const { user } = useUser();
  const [bloodwork, setBloodwork] = useState<Record<string, { wert: number; datum: string }>>({});
  const [mode, setMode] = useState<"view" | "manual">("view");
  const [values, setValues] = useState<Record<string, number>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [recs, setRecs] = useState<{ status: string; text: string }[]>([]);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getLatestBloodwork(user.id).then(setBloodwork); }, [user.id]);

  async function saveBw() {
    setSaving(true);
    const markers = Object.entries(values).filter(([, v]) => v > 0).map(([k, v]) => {
      const ref = BW_MARKERS.find((m) => m.key === k);
      return { marker: k, wert: v, einheit: ref?.einheit || "" };
    });
    await fetch("/api/bloodwork", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: user.id, datum: date, markers }) });
    const aiRes = await fetch("/api/bloodwork/analyze-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markers, gender: user.geschlecht, hasTRT: true }) });
    const aiData = await aiRes.json();
    setRecs(aiData.recommendations || []);
    setToast(`${markers.length} Blutwerte gespeichert!`);
    setMode("view");
    setSaving(false);
    getLatestBloodwork(user.id).then(setBloodwork);
  }

  async function scanBw(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setScanning(true); setMode("manual");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/bloodwork/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result }) });
        const data = await res.json();
        if (data.success && data.markers) {
          const vals: Record<string, number> = {};
          data.markers.forEach((m: { marker: string; wert: number }) => { vals[m.marker] = m.wert; });
          setValues(vals); setToast(`${data.markers.length} Marker erkannt!`);
        }
      } catch { setToast("Scan fehlgeschlagen"); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  }

  const inputStyle = { background: ht.card, color: ht.text, borderColor: ht.border };

  return (
    <div className="flex flex-col gap-4">
      <h1 style={{ fontSize: 18, fontWeight: 600, color: ht.text }}>Bloodwork</h1>
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={scanBw} />

      {mode === "view" && (
        <>
          {Object.keys(bloodwork).length > 0 ? (
            <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
              {BW_MARKERS.filter((m) => bloodwork[m.key]).sort((a, b) => {
                const sa = getStatus(bloodwork[a.key].wert, a.min, a.max);
                const sb = getStatus(bloodwork[b.key].wert, b.min, b.max);
                return ({ red: 0, yellow: 1, green: 2 }[sa]) - ({ red: 0, yellow: 1, green: 2 }[sb]);
              }).map((m) => {
                const bw = bloodwork[m.key]; const s = getStatus(bw.wert, m.min, m.max);
                return (
                  <div key={m.key} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${ht.border}` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: SC[s] }} />
                    <div className="flex-1"><p style={{ fontSize: 12, fontWeight: 500, color: ht.text }}>{m.label}</p><p style={{ fontSize: 10, color: ht.text3 }}>Ref: {m.min}–{m.max}</p></div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: SC[s] }}>{bw.wert}</span>
                    <span style={{ fontSize: 10, color: ht.text3 }}>{m.einheit}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: ht.card, borderRadius: 16, padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: ht.text }}>Blutwerte hinzufuegen</p>
              <p style={{ fontSize: 12, color: ht.text3, marginTop: 4 }}>Laborergebnisse hochladen oder manuell eintragen</p>
            </div>
          )}

          {recs.length > 0 && (
            <div style={{ background: ht.card, borderRadius: 16, padding: 16 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 8 }}>AI-Analyse</p>
              {recs.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-2">
                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: r.status === "critical" ? "#e05050" : r.status === "warning" ? "#E8893C" : "#34d399" }} />
                  <p style={{ fontSize: 12, color: ht.text2 }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[{ icon: Camera, label: "Foto/Scan", action: () => fileRef.current?.click() },
              { icon: FileText, label: "PDF Upload", action: () => fileRef.current?.click() },
              { icon: Edit3, label: "Manuell", action: () => setMode("manual") }
            ].map((b) => (
              <button key={b.label} onClick={b.action} className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                style={{ background: ht.card, border: `1px solid ${ht.border}` }}>
                <b.icon size={18} style={{ color: ht.accent }} />
                <span style={{ fontSize: 10, color: ht.text2 }}>{b.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-3">
          {scanning && <div className="flex items-center justify-center gap-2 py-4"><Loader2 size={20} className="animate-spin" style={{ color: ht.accent }} /><span style={{ fontSize: 13, color: ht.text2 }}>Wird analysiert...</span></div>}
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 14, fontWeight: 600, color: ht.text }}>Blutwerte eingeben</p>
            <button onClick={() => setMode("view")} style={{ fontSize: 12, color: ht.text3 }}>Abbrechen</button>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          {["Hormone", "Blutbild", "Entzuendung", "Vitamine", "Schilddruese"].map((group) => {
            const markers = BW_MARKERS.filter((m) => m.group === group);
            return (
              <div key={group}>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: ht.text3, marginBottom: 4 }}>{group}</p>
                <div className="grid grid-cols-2 gap-2">
                  {markers.map((m) => {
                    const val = values[m.key] || 0;
                    const status = val > 0 ? getStatus(val, m.min, m.max) : null;
                    return (
                      <div key={m.key} className="flex items-center gap-1">
                        {status && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SC[status] }} />}
                        <div className="flex-1">
                          <label style={{ fontSize: 9, color: ht.text3 }}>{m.label}</label>
                          <input type="number" step="0.1" value={val || ""} placeholder="—"
                            onChange={(e) => setValues({ ...values, [m.key]: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded-lg text-xs border" style={inputStyle} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button onClick={saveBw} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: ht.accentDim, color: ht.accent, border: `1px solid ${ht.accentBorder}` }}>
            {saving ? "Speichern..." : "Blutwerte speichern"}
          </button>
        </div>
      )}

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
