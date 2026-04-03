"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X, Play, Pause, Send } from "lucide-react";

type VoiceState = "idle" | "recording" | "preview" | "sending";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onError?: (msg: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
  return "";
}

function fileExtForMime(mime: string): string {
  if (mime.includes("mp4")) return "voice.m4a";
  if (mime.includes("ogg")) return "voice.ogg";
  return "voice.webm";
}

export default function VoiceRecorder({ onTranscript, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef(pickMimeType());
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<VoiceState>("idle");

  stateRef.current = state;

  // Cleanup stream on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Global release listeners — pointer + touch for cross-device support
  useEffect(() => {
    function handleGlobalRelease() {
      if (stateRef.current === "recording") {
        doStopRecording();
      }
    }
    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("pointercancel", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("touchcancel", handleGlobalRelease);
    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("pointercancel", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("touchcancel", handleGlobalRelease);
    };
  }, []);

  async function getStream(): Promise<MediaStream> {
    if (streamRef.current && streamRef.current.getTracks().every((t) => t.readyState === "live")) {
      return streamRef.current;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    return stream;
  }

  async function doStartRecording() {
    if (stateRef.current !== "idle") return;

    try {
      const stream = await getStream();
      const mime = mimeRef.current;

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        blobRef.current = blob;

        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);

        setState("preview");
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setDuration(0);
      setState("recording");

      if (navigator.vibrate) navigator.vibrate(50);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      onError?.("Mikrofon-Zugriff erforderlich. Bitte in den Browser-Einstellungen erlauben.");
    }
  }

  function doStopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function cancelRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    blobRef.current = null;
    setDuration(0);
    setPlaying(false);
    setState("idle");
  }

  function togglePlayback() {
    if (!urlRef.current) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    const audio = new Audio(urlRef.current);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  }

  async function sendVoice() {
    if (!blobRef.current) return;

    setState("sending");

    try {
      const formData = new FormData();
      formData.append("audio", blobRef.current, fileExtForMime(mimeRef.current));

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();

      if (data.text) {
        onTranscript(data.text);
      } else if (data.error) {
        onError?.(data.error);
      }
    } catch {
      onError?.("Transkription fehlgeschlagen");
    } finally {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      blobRef.current = null;
      setDuration(0);
      setPlaying(false);
      setState("idle");
    }
  }

  // Shared press handler — works for both pointer and touch
  function handlePressStart(e: React.TouchEvent | React.PointerEvent) {
    e.preventDefault();
    doStartRecording();
  }

  // IDLE — mic button
  if (state === "idle") {
    return (
      <button
        type="button"
        onTouchStart={handlePressStart}
        onPointerDown={handlePressStart}
        onContextMenu={(e) => e.preventDefault()}
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ color: "var(--text2)", touchAction: "none", userSelect: "none", minWidth: 48, minHeight: 48, padding: 12 }}
      >
        <Mic size={22} />
      </button>
    );
  }

  // RECORDING — pulsing red mic + timer
  if (state === "recording") {
    return (
      <div className="flex items-center gap-2" style={{ touchAction: "none", userSelect: "none" }}>
        <span className="text-xs font-mono font-medium" style={{ color: "#EF4444" }}>
          {formatTime(duration)}
        </span>
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                background: "#EF4444",
                height: `${8 + Math.random() * 14}px`,
                animation: "pulse-dot 0.6s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", minWidth: 48, minHeight: 48, padding: 12 }}
        >
          <Mic size={22} className="animate-pulse" />
        </div>
      </div>
    );
  }

  // PREVIEW — delete, play, send
  if (state === "preview") {
    return (
      <div className="flex items-center gap-2 flex-1">
        <button type="button" onClick={cancelRecording}
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: "var(--subtle-bg)", color: "var(--text3)", minWidth: 44, minHeight: 44, padding: 10 }}>
          <X size={18} />
        </button>

        <button type="button" onClick={togglePlayback}
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-2xl"
          style={{ background: "var(--subtle-bg)", border: "1px solid var(--card-border)", minHeight: 44 }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--grad-teal)" }}>
            {playing ? <Pause size={12} style={{ color: "#0D1117" }} /> : <Play size={12} style={{ color: "#0D1117", marginLeft: 1 }} />}
          </div>
          <div className="flex items-end gap-px flex-1 h-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  background: playing ? "var(--accent)" : "var(--text3)",
                  height: `${4 + Math.sin(i * 0.7) * 12 + Math.random() * 8}px`,
                  opacity: playing ? 1 : 0.6,
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text3)" }}>
            {formatTime(duration)}
          </span>
        </button>

        <button type="button" onClick={sendVoice}
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: "var(--grad-teal)", minWidth: 48, minHeight: 48, padding: 12 }}>
          <Send size={18} style={{ color: "#0D1117" }} />
        </button>
      </div>
    );
  }

  // SENDING
  return (
    <div className="flex items-center gap-2 flex-1 px-3 py-2">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      <span className="text-xs" style={{ color: "var(--text2)" }}>Transkribiere...</span>
    </div>
  );
}
