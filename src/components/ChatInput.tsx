"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Mic, Plus, X, Square } from "lucide-react";
import { appAccentColor } from "@/lib/appConfig";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const MAX_RECORD_SEC = 300; // 5 minutes

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [micState, setMicState] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check mic permission on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((p) => { setMicState(p.state as typeof micState); p.onchange = () => setMicState(p.state as typeof micState); })
        .catch(() => setMicState("prompt"));
    } else {
      setMicState("prompt");
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "24px";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // Auto-stop at max duration
  useEffect(() => {
    if (recording && recSec >= MAX_RECORD_SEC) {
      stopAndTranscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recSec, recording]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText("");
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function startRecording() {
    setError("");

    // Request mic if needed (first time triggers browser dialog)
    if (micState === "denied") {
      setError("Mikrofon in Browser-Einstellungen aktivieren");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      setMicState("granted");

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => { /* handled by stopAndTranscribe */ };

      recorder.start(5000); // 5s chunks for robustness
      recorderRef.current = recorder;
      setRecSec(0);
      setRecording(true);

      // WakeLock to prevent sleep
      try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch { /* not supported */ }

      timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
      if (navigator.vibrate) navigator.vibrate(10);
    } catch {
      setError("Mikrofon nicht verfuegbar");
    }
  }

  async function stopAndTranscribe() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") { setRecording(false); return; }

    // Collect final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    if (blob.size < 1000) return; // too short, skip

    setTranscribing(true);
    try {
      const fd = new FormData();
      const ext = (recorder.mimeType || "").includes("mp4") ? "voice.m4a" : "voice.webm";
      fd.append("audio", blob, ext);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) {
        setText((prev) => (prev ? prev + " " : "") + data.text);
        // Cursor at end
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        });
      } else if (data.error) {
        setError("Transkription fehlgeschlagen");
      }
    } catch {
      setError("Transkription fehlgeschlagen");
    }
    setTranscribing(false);
  }

  function cancelRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    setRecording(false);
    setRecSec(0);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  const hasText = text.trim().length > 0;
  const accentBg = `${appAccentColor}1a`; // ~10% opacity hex

  return (
    <div className="flex-shrink-0">
      {/* Error message */}
      {error && (
        <div className="px-4 py-1.5 text-center">
          <p className="text-[11px]" style={{ color: "#a0a0a8" }}>{error}</p>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2" style={{ borderTop: "1px solid rgba(128,128,128,0.12)", paddingBottom: "env(safe-area-inset-bottom, 8px)", background: "var(--card)" }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={() => { fileRef.current && (fileRef.current.value = ""); }} />

        {recording ? (
          /* === RECORDING STATE === */
          <div className="flex-1 flex items-center gap-3 py-1" style={{ background: "rgba(239,68,68,0.04)", borderRadius: 12, padding: "8px 12px" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#ef4444", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
            <span className="text-base font-medium font-mono flex-1" style={{ color: "#e8e8ec" }}>{formatTimer(recSec)}</span>
            <button type="button" onTouchStart={cancelRecording} onClick={cancelRecording}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-125"
              style={{ color: "#6b6b70" }}>
              <X size={18} />
            </button>
            <button type="button" onTouchStart={stopAndTranscribe} onClick={stopAndTranscribe}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-125"
              style={{ background: accentBg, color: appAccentColor }}>
              <Square size={16} />
            </button>
          </div>
        ) : transcribing ? (
          /* === TRANSCRIBING STATE === */
          <div className="flex-1 flex items-center justify-center py-2">
            <p className="text-sm" style={{ color: "#a0a0a8" }}>Wird transkribiert...</p>
          </div>
        ) : (
          /* === NORMAL STATE === */
          <>
            <button type="button" onTouchStart={() => fileRef.current?.click()} onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-transform active:scale-125"
              style={{ color: "var(--text3)", opacity: 0.7 }}>
              <Plus size={20} />
            </button>

            <div className="flex-1 flex items-end rounded-2xl px-3 py-1.5" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", minHeight: 36 }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht..."
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none"
                style={{ color: "var(--input-text)", fontSize: 16, lineHeight: "1.4", maxHeight: 144, height: 24 }}
              />
            </div>

            {hasText ? (
              <button type="button" onTouchStart={handleSend} onClick={handleSend} disabled={isLoading}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-transform active:scale-115"
                style={{ background: appAccentColor, opacity: isLoading ? 0.5 : 0.9 }}>
                <Send size={16} style={{ color: "#0a0a0c" }} />
              </button>
            ) : (
              <button type="button" onTouchStart={startRecording} onClick={startRecording}
                disabled={micState === "denied"}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-transform active:scale-125"
                style={{ color: micState === "denied" ? "#3a3a42" : "var(--text3)", opacity: micState === "denied" ? 0.3 : 0.7 }}>
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
