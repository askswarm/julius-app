"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic, Bell, Camera, Moon, Sun, Download, Trash2, LogOut, ChevronRight, Shield, BellRing, BellOff } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { useTheme } from "@/lib/ThemeContext";
import { supabase } from "@/lib/supabase";
import Card from "@/components/Card";
import Toast from "@/components/Toast";

type PermStatus = "granted" | "denied" | "prompt" | "unknown";

function PermissionRow({ icon: Icon, label, status, onRequest }: {
  icon: typeof Mic; label: string; status: PermStatus; onRequest: () => void;
}) {
  const colors: Record<PermStatus, { bg: string; text: string; label: string }> = {
    granted: { bg: "rgba(16,185,129,0.1)", text: "#10B981", label: "Erlaubt" },
    denied: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", label: "Blockiert" },
    prompt: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", label: "Nicht gefragt" },
    unknown: { bg: "var(--subtle-bg)", text: "var(--text3)", label: "Unbekannt" },
  };
  const c = colors[status];
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon size={18} style={{ color: "var(--text3)" }} />
        <span className="text-sm" style={{ color: "var(--text)" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>{c.label}</span>
        {status === "prompt" && (
          <button onClick={onRequest} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(126,226,184,0.1)", color: "var(--accent)" }}>Erlauben</button>
        )}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-emerald-500" : "bg-slate-400"}`}
      style={{ minWidth: 44 }}>
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function NotifToggle({ label, desc, enabled, onChange }: { label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 mr-3">
        <p className="text-sm" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-[10px]" style={{ color: "var(--text3)" }}>{desc}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

interface PushSettings {
  all_enabled: boolean;
  quiet_hours: boolean;
  oura_summary: boolean;
  supp_morning_nuechtern: boolean;
  supp_morning_fruehstueck: boolean;
  fruehstueck_vorschlag: boolean;
  mittag_vorschlaege: boolean;
  supp_mittag: boolean;
  protein_tracker: boolean;
  pre_workout: boolean;
  post_workout: boolean;
  training_reminder: boolean;
  abend_vorschlag: boolean;
  tagesbilanz: boolean;
  supp_abend: boolean;
  autophagie_reminder: boolean;
  wochen_report: boolean;
  einkaufsliste: boolean;
  schlaf_warnung: boolean;
  uebertraining_warnung: boolean;
  supp_anpassung: boolean;
  trt_reminder: boolean;
  peptide_reminder: boolean;
}

const DEFAULT_SETTINGS: PushSettings = {
  all_enabled: true,
  quiet_hours: true,
  oura_summary: true,
  supp_morning_nuechtern: true,
  supp_morning_fruehstueck: true,
  fruehstueck_vorschlag: false,
  mittag_vorschlaege: true,
  supp_mittag: true,
  protein_tracker: true,
  pre_workout: true,
  post_workout: true,
  training_reminder: false,
  abend_vorschlag: true,
  tagesbilanz: true,
  supp_abend: true,
  autophagie_reminder: false,
  wochen_report: true,
  einkaufsliste: false,
  schlaf_warnung: true,
  uebertraining_warnung: true,
  supp_anpassung: true,
  trt_reminder: true,
  peptide_reminder: true,
};

export default function EinstellungenPage() {
  const { user, userKey, setUserKey } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const [micPerm, setMicPerm] = useState<PermStatus>("unknown");
  const [pushPerm, setPushPerm] = useState<PermStatus>("unknown");
  const [camPerm, setCamPerm] = useState<PermStatus>("unknown");

  // Load settings from Supabase
  useEffect(() => {
    supabase
      .from("user_settings")
      .select("key, value")
      .eq("chat_id", user.id)
      .then(({ data }) => {
        if (data?.length) {
          const merged = { ...DEFAULT_SETTINGS };
          data.forEach((row) => {
            if (row.key in merged) {
              (merged as Record<string, boolean>)[row.key] = row.value === "true";
            }
          });
          setSettings(merged);
        }
        setLoaded(true);
      });
  }, [user.id]);

  // Auto-save on toggle
  const updateSetting = useCallback(async (key: keyof PushSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await supabase.from("user_settings").upsert(
      { chat_id: user.id, key, value: String(value) },
      { onConflict: "chat_id,key" }
    );
  }, [user.id]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((p) => {
        setMicPerm(p.state as PermStatus); p.onchange = () => setMicPerm(p.state as PermStatus);
      }).catch(() => {});
      navigator.permissions.query({ name: "camera" as PermissionName }).then((p) => {
        setCamPerm(p.state as PermStatus); p.onchange = () => setCamPerm(p.state as PermStatus);
      }).catch(() => {});
    }
    if (typeof Notification !== "undefined") {
      setPushPerm(Notification.permission === "default" ? "prompt" : Notification.permission as PermStatus);
    }
  }, []);

  const isVincent = userKey === "vincent";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Einstellungen</h1>

      {/* Profile */}
      <Link href="/profil">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--grad-teal)", color: "#0D1117" }}>{user.name[0]}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{user.name}</p>
                <p className="text-xs" style={{ color: "var(--text3)" }}>{user.alter_jahre}J · {user.gewicht_kg}kg</p>
              </div>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--text3)" }}>
              <span className="text-xs">Profil bearbeiten</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </Card>
      </Link>

      {/* Wearable */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">&#9201;</span>
          <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Wearable-Integration</p>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Oura Ring</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>Schlaf, Readiness, Aktivitaet</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Konfiguriert</span>
        </div>
        <button onClick={async () => {
          try {
            const res = await fetch("/api/oura/sync");
            const data = await res.json();
            setToast(data.success ? `Sync OK — Schlaf ${data.sleep || "?"}, Readiness ${data.readiness || "?"}` : (data.error || "Sync fehlgeschlagen"));
          } catch { setToast("Sync fehlgeschlagen"); }
        }}
          className="w-full py-2 rounded-xl text-xs font-medium mt-2"
          style={{ background: "var(--subtle-bg)", color: "var(--accent)", border: "1px solid var(--card-border)" }}>
          Jetzt synchronisieren
        </button>
      </Card>

      {/* Permissions */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: "var(--text2)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Berechtigungen</p>
        </div>
        <PermissionRow icon={Mic} label="Mikrofon" status={micPerm} onRequest={async () => {
          try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); setMicPerm("granted"); } catch { setMicPerm("denied"); }
        }} />
        <PermissionRow icon={Bell} label="Push-Benachrichtigungen" status={pushPerm} onRequest={async () => {
          try { const r = await Notification.requestPermission(); setPushPerm(r === "default" ? "prompt" : r as PermStatus); } catch { setPushPerm("denied"); }
        }} />
        <PermissionRow icon={Camera} label="Kamera" status={camPerm} onRequest={async () => {
          try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach((t) => t.stop()); setCamPerm("granted"); } catch { setCamPerm("denied"); }
        }} />
      </Card>

      {/* Notifications — Granular */}
      {loaded && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <BellRing size={16} style={{ color: "var(--text2)" }} />
            <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Benachrichtigungen</p>
          </div>

          {/* Master toggles */}
          <div className="flex items-center justify-between py-2 mb-2" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: settings.all_enabled ? "var(--accent)" : "var(--text3)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Alle Benachrichtigungen</p>
            </div>
            <Toggle enabled={settings.all_enabled} onChange={(v) => updateSetting("all_enabled", v)} />
          </div>
          <div className="flex items-center justify-between py-2 mb-3" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2">
              <BellOff size={16} style={{ color: "var(--text3)" }} />
              <div>
                <p className="text-sm" style={{ color: "var(--text)" }}>Ruhezeit</p>
                <p className="text-[10px]" style={{ color: "var(--text3)" }}>Keine Push 22:00 – 06:30</p>
              </div>
            </div>
            <Toggle enabled={settings.quiet_hours} onChange={(v) => updateSetting("quiet_hours", v)} />
          </div>

          {settings.all_enabled && (
            <>
              {/* Morgen */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-2 mb-1" style={{ color: "var(--text3)" }}>Morgen (06:45 – 09:00)</p>
              <NotifToggle label="Oura-Zusammenfassung" desc="Schlaf-Score, Readiness, HRV" enabled={settings.oura_summary} onChange={(v) => updateSetting("oura_summary", v)} />
              <NotifToggle label="Supplements Nuechtern" desc="Spermidin, NAC — vor dem Fruehstueck" enabled={settings.supp_morning_nuechtern} onChange={(v) => updateSetting("supp_morning_nuechtern", v)} />
              <NotifToggle label="Supplements Fruehstueck" desc="Omega-3, D3, B-Komplex — zum Essen" enabled={settings.supp_morning_fruehstueck} onChange={(v) => updateSetting("supp_morning_fruehstueck", v)} />
              <NotifToggle label="Fruehstueck-Vorschlag" desc="Was soll ich fruehstuecken?" enabled={settings.fruehstueck_vorschlag} onChange={(v) => updateSetting("fruehstueck_vorschlag", v)} />

              {/* Mittag */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-3 mb-1" style={{ color: "var(--text3)" }}>Mittag (12:00)</p>
              <NotifToggle label="Mittagessen-Vorschlaege" desc="2-3 Rezepte passend zu deinem Ziel" enabled={settings.mittag_vorschlaege} onChange={(v) => updateSetting("mittag_vorschlaege", v)} />
              <NotifToggle label="Supplements Mittag" desc="Selen + Vitamin C" enabled={settings.supp_mittag} onChange={(v) => updateSetting("supp_mittag", v)} />
              <NotifToggle label="Protein-Tracker" desc="Aktueller Stand vs. Tagesziel" enabled={settings.protein_tracker} onChange={(v) => updateSetting("protein_tracker", v)} />

              {/* Training */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-3 mb-1" style={{ color: "var(--text3)" }}>Training</p>
              <NotifToggle label="Pre-Workout Reminder" desc="Citrullin, Glutamin, EAA — 30 Min vorher" enabled={settings.pre_workout} onChange={(v) => updateSetting("pre_workout", v)} />
              <NotifToggle label="Post-Workout Tipps" desc="Wasser, EAA, Protein-Ziel" enabled={settings.post_workout} onChange={(v) => updateSetting("post_workout", v)} />
              <NotifToggle label="Training-Erinnerung" desc="Heute ist Kraft-Tag — wann trainierst du?" enabled={settings.training_reminder} onChange={(v) => updateSetting("training_reminder", v)} />

              {/* Abend */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-3 mb-1" style={{ color: "var(--text3)" }}>Abend (17:30 – 19:00)</p>
              <NotifToggle label="Abendessen-Vorschlag" desc="Rezeptvorschlag vor Essensfenster-Ende" enabled={settings.abend_vorschlag} onChange={(v) => updateSetting("abend_vorschlag", v)} />
              <NotifToggle label="Tagesbilanz" desc="Kalorien, Protein, Training zusammengefasst" enabled={settings.tagesbilanz} onChange={(v) => updateSetting("tagesbilanz", v)} />
              <NotifToggle label="Supplements Abend" desc="Glycin, Magnesium, Ashwagandha" enabled={settings.supp_abend} onChange={(v) => updateSetting("supp_abend", v)} />
              <NotifToggle label="Autophagie-Reminder" desc="Essensfenster geschlossen" enabled={settings.autophagie_reminder} onChange={(v) => updateSetting("autophagie_reminder", v)} />

              {/* Woche */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-3 mb-1" style={{ color: "var(--text3)" }}>Woche</p>
              <NotifToggle label="Wochen-Report Sonntag" desc="Zusammenfassung der Woche" enabled={settings.wochen_report} onChange={(v) => updateSetting("wochen_report", v)} />
              <NotifToggle label="Einkaufsliste Samstag" desc="Einkaufsliste fuer naechste Woche" enabled={settings.einkaufsliste} onChange={(v) => updateSetting("einkaufsliste", v)} />

              {/* Gesundheit */}
              <p className="text-[10px] font-semibold uppercase tracking-[1px] mt-3 mb-1" style={{ color: "var(--text3)" }}>Gesundheit</p>
              <NotifToggle label="Schlaf-Warnung" desc="Wenn Schlaf-Score unter 65" enabled={settings.schlaf_warnung} onChange={(v) => updateSetting("schlaf_warnung", v)} />
              <NotifToggle label="Uebertraining-Warnung" desc="3+ Sessions RPE 8+ in Folge" enabled={settings.uebertraining_warnung} onChange={(v) => updateSetting("uebertraining_warnung", v)} />
              <NotifToggle label="Supplement-Anpassung" desc="Wenn Julius Dosen aendert" enabled={settings.supp_anpassung} onChange={(v) => updateSetting("supp_anpassung", v)} />
              {isVincent && (
                <NotifToggle label="TRT-Reminder" desc="Mi + Sa Injektions-Erinnerung" enabled={settings.trt_reminder} onChange={(v) => updateSetting("trt_reminder", v)} />
              )}
              <NotifToggle label="Peptide-Reminder" desc="Taegliche Injektion + Vial-Restmenge" enabled={settings.peptide_reminder} onChange={(v) => updateSetting("peptide_reminder", v)} />
            </>
          )}
        </Card>
      )}

      {/* App */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>App</p>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm" style={{ color: "var(--text)" }}>Erscheinungsbild</span>
          <div className="flex rounded-full p-0.5" style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)" }}>
            <button onClick={() => theme === "dark" && toggleTheme()}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{ background: theme === "light" ? "var(--accent)" : "transparent", color: theme === "light" ? "#0D1117" : "var(--text3)" }}>
              <Sun size={12} /> Light
            </button>
            <button onClick={() => theme === "light" && toggleTheme()}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{ background: theme === "dark" ? "var(--accent)" : "transparent", color: theme === "dark" ? "#0D1117" : "var(--text3)" }}>
              <Moon size={12} /> Dark
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm" style={{ color: "var(--text)" }}>Sprache</span>
          <span className="text-xs" style={{ color: "var(--text3)" }}>Deutsch</span>
        </div>
        <button onClick={() => {
          const data = { user: userKey, exportedAt: new Date().toISOString() };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `julius-export-${userKey}.json`; a.click();
          URL.revokeObjectURL(url); setToast("Export gestartet");
        }} className="flex items-center gap-2 py-2.5 w-full text-left">
          <Download size={18} style={{ color: "var(--text3)" }} />
          <span className="text-sm" style={{ color: "var(--text)" }}>Daten exportieren</span>
        </button>
        <button onClick={() => {
          if ("caches" in window) caches.keys().then((n) => n.forEach((k) => caches.delete(k)));
          localStorage.clear(); setToast("Cache geleert");
        }} className="flex items-center gap-2 py-2.5 w-full text-left">
          <Trash2 size={18} style={{ color: "var(--text3)" }} />
          <span className="text-sm" style={{ color: "var(--text)" }}>Cache leeren</span>
        </button>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm" style={{ color: "var(--text3)" }}>Version</span>
          <span className="text-xs" style={{ color: "var(--text3)" }}>Julius v1.0</span>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Account</p>
        <button onClick={() => { setUserKey("vincent"); setToast("Abgemeldet"); }} className="flex items-center gap-2 py-2.5 w-full text-left">
          <LogOut size={18} style={{ color: "var(--text3)" }} />
          <span className="text-sm" style={{ color: "var(--text)" }}>Abmelden</span>
        </button>
        <button onClick={() => {
          if (confirm("Wirklich ALLE Daten loeschen?")) { if (confirm("Letzte Bestaetigung")) { setToast("Feature kommt in v1.1"); } }
        }} className="flex items-center gap-2 py-2.5 w-full text-left">
          <Trash2 size={18} style={{ color: "#EF4444" }} />
          <span className="text-sm" style={{ color: "#EF4444" }}>Alle Daten loeschen</span>
        </button>
      </Card>

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
