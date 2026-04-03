"use client";

import { useEffect, useState } from "react";
import { Mic, Bell, Camera, Moon, Sun, Download, Trash2, LogOut, ChevronRight, User, Shield, BellRing } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { useTheme } from "@/lib/ThemeContext";
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
    unknown: { bg: "rgba(255,255,255,0.04)", text: "var(--text3)", label: "Unbekannt" },
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
          <button onClick={onRequest} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(126,226,184,0.1)", color: "var(--accent)" }}>
            Erlauben
          </button>
        )}
        {status === "denied" && (
          <span className="text-[10px]" style={{ color: "var(--text3)" }}>Browser-Einstellungen</span>
        )}
      </div>
    </div>
  );
}

function SettingsToggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm" style={{ color: "var(--text)" }}>{label}</span>
      <button onClick={() => onChange(!enabled)}
        className={`w-11 h-6 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-600"}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function EinstellungenPage() {
  const { user, userKey, setUserKey } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [toast, setToast] = useState("");

  // Permissions
  const [micPerm, setMicPerm] = useState<PermStatus>("unknown");
  const [pushPerm, setPushPerm] = useState<PermStatus>("unknown");
  const [camPerm, setCamPerm] = useState<PermStatus>("unknown");

  // Notification toggles
  const [notifs, setNotifs] = useState({
    oura_check: true,
    morgen_supps: true,
    mittag: true,
    abend: true,
    tagesbilanz: true,
  });

  useEffect(() => {
    // Check permissions
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((p) => {
        setMicPerm(p.state as PermStatus);
        p.onchange = () => setMicPerm(p.state as PermStatus);
      }).catch(() => {});
      navigator.permissions.query({ name: "camera" as PermissionName }).then((p) => {
        setCamPerm(p.state as PermStatus);
        p.onchange = () => setCamPerm(p.state as PermStatus);
      }).catch(() => {});
    }

    if (typeof Notification !== "undefined") {
      const np = Notification.permission;
      setPushPerm(np === "default" ? "prompt" : np as PermStatus);
    }
  }, []);

  async function requestMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPerm("granted");
    } catch { setMicPerm("denied"); }
  }

  async function requestCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCamPerm("granted");
    } catch { setCamPerm("denied"); }
  }

  async function requestPush() {
    try {
      const result = await Notification.requestPermission();
      setPushPerm(result === "default" ? "prompt" : result as PermStatus);
    } catch { setPushPerm("denied"); }
  }

  function exportData() {
    const data = { user: userKey, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `julius-export-${userKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Export gestartet");
  }

  function clearCache() {
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
    localStorage.clear();
    setToast("Cache geleert");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Einstellungen</h1>

      {/* Profile link */}
      <Link href="/profil">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
                {user.name[0]}
              </div>
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

      {/* Wearable Integration */}
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
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
            Konfiguriert
          </span>
        </div>
        <button onClick={async () => {
          try {
            const res = await fetch("/api/oura/sync");
            const data = await res.json();
            setToast(data.success ? `Sync OK — Schlaf ${data.sleep || "?"}, Readiness ${data.readiness || "?"}` : (data.error || "Sync fehlgeschlagen"));
          } catch { setToast("Sync fehlgeschlagen"); }
        }}
          className="w-full py-2 rounded-xl text-xs font-medium mt-2 transition-all"
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
        <PermissionRow icon={Mic} label="Mikrofon" status={micPerm} onRequest={requestMic} />
        <PermissionRow icon={Bell} label="Push-Benachrichtigungen" status={pushPerm} onRequest={requestPush} />
        <PermissionRow icon={Camera} label="Kamera" status={camPerm} onRequest={requestCam} />
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BellRing size={16} style={{ color: "var(--text2)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Taegliche Nachrichten</p>
        </div>
        <SettingsToggle label="06:45 Oura-Check" enabled={notifs.oura_check} onChange={(v) => setNotifs({ ...notifs, oura_check: v })} />
        <SettingsToggle label="07:00 Morgen-Supplements" enabled={notifs.morgen_supps} onChange={(v) => setNotifs({ ...notifs, morgen_supps: v })} />
        <SettingsToggle label="12:00 Mittag-Check" enabled={notifs.mittag} onChange={(v) => setNotifs({ ...notifs, mittag: v })} />
        <SettingsToggle label="17:30 Abend-Reminder" enabled={notifs.abend} onChange={(v) => setNotifs({ ...notifs, abend: v })} />
        <SettingsToggle label="19:00 Tagesbilanz" enabled={notifs.tagesbilanz} onChange={(v) => setNotifs({ ...notifs, tagesbilanz: v })} />
      </Card>

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

        <button onClick={exportData} className="flex items-center gap-2 py-2.5 w-full text-left">
          <Download size={18} style={{ color: "var(--text3)" }} />
          <span className="text-sm" style={{ color: "var(--text)" }}>Daten exportieren (JSON)</span>
        </button>

        <button onClick={clearCache} className="flex items-center gap-2 py-2.5 w-full text-left">
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

        <button onClick={() => { setUserKey("vincent"); setToast("Abgemeldet"); }}
          className="flex items-center gap-2 py-2.5 w-full text-left">
          <LogOut size={18} style={{ color: "var(--text3)" }} />
          <span className="text-sm" style={{ color: "var(--text)" }}>Abmelden</span>
        </button>

        <button onClick={() => {
          if (confirm("Wirklich ALLE Daten loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.")) {
            if (confirm("Letzte Bestaetigung: Alle Daten werden unwiderruflich geloescht.")) {
              setToast("Feature kommt in v1.1");
            }
          }
        }} className="flex items-center gap-2 py-2.5 w-full text-left">
          <Trash2 size={18} style={{ color: "#EF4444" }} />
          <span className="text-sm" style={{ color: "#EF4444" }}>Alle Daten loeschen</span>
        </button>
      </Card>

      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />
    </div>
  );
}
