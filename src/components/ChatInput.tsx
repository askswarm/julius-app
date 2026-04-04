"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Mic, Plus, X, Square } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    };
  }, []);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function toggleRecording() {
    if (recording) {
      // Stop
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
      setRecording(false);
      return;
    }

    // Start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, mime.includes("mp4") ? "voice.m4a" : "voice.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) setText((prev) => (prev ? prev + " " : "") + data.text);
        } catch { /* ignore */ }
        setTranscribing(false);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setRecSec(0);
      setRecording(true);
      timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      // Mic not available
    }
  }

  function cancelRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current.stop();
    }
    setRecording(false);
    setRecSec(0);
  }

  const hasText = text.trim().length > 0;

  return (
    <div className="flex items-end gap-2 px-3 pt-2" style={{
      borderTop: "1px solid rgba(128,128,128,0.15)",
      paddingBottom: "max(8px, var(--safe-bottom))",
      background: "var(--card)",
    }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        // Photo handling delegated to parent via future prop
        e.target.value = "";
      }} />

      {/* Plus/Attachment */}
      <button type="button" onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mb-0.5"
        style={{ color: "var(--text3)" }}>
        <Plus size={20} />
      </button>

      {recording ? (
        /* Recording indicator */
        <div className="flex-1 flex items-center gap-2 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono" style={{ color: "#EF4444" }}>{formatTimer(recSec)}</span>
          <div className="flex-1" />
          <button type="button" onClick={cancelRecording} className="p-1.5 rounded-full" style={{ color: "var(--text3)" }}>
            <X size={18} />
          </button>
          <button type="button" onClick={toggleRecording} className="p-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
            <Square size={16} />
          </button>
        </div>
      ) : (
        /* Textarea */
        <div className="flex-1 flex items-end rounded-2xl px-3 py-1.5"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", minHeight: 36 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={transcribing ? "Transkribiere..." : "Nachricht..."}
            rows={1}
            disabled={transcribing}
            className="flex-1 bg-transparent resize-none outline-none"
            style={{ color: "var(--input-text)", fontSize: 16, lineHeight: "1.4", maxHeight: 144, height: 24 }}
          />
        </div>
      )}

      {/* Send or Mic */}
      {hasText ? (
        <button type="button" onClick={handleSend} disabled={isLoading}
          className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mb-0.5"
          style={{ background: "var(--grad-teal)" }}>
          <Send size={16} style={{ color: "#0D1117" }} />
        </button>
      ) : !recording ? (
        <button type="button" onClick={toggleRecording}
          className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mb-0.5"
          style={{ color: "var(--text3)" }}>
          <Mic size={20} />
        </button>
      ) : null}
    </div>
  );
}
