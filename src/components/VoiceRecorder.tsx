"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export default function VoiceRecorder({ onTranscript, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;

        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);

        setState("preview");
      };

      recorder.start(100);
      mediaRef.current = recorder;
      setDuration(0);
      setState("recording");

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      startedRef.current = false;
      onError?.("Mikrofon-Zugriff erforderlich. Bitte in den Browser-Einstellungen erlauben.");
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    startedRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    stopRecording();

    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    blobRef.current = null;
    setDuration(0);
    setPlaying(false);
    setState("idle");
  }, [stopRecording]);

  const togglePlayback = useCallback(() => {
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
  }, [playing]);

  const sendVoice = useCallback(async () => {
    if (!blobRef.current) return;

    setState("sending");

    try {
      const formData = new FormData();
      formData.append("audio", blobRef.current, "voice.webm");

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
  }, [onTranscript, onError]);

  // Touch/mouse handlers for press-and-hold
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (state === "idle") {
        startRecording();
      }
    },
    [state, startRecording],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (state === "recording") {
        stopRecording();
      }
    },
    [state, stopRecording],
  );

  const handlePointerCancel = useCallback(() => {
    if (state === "recording") {
      cancelRecording();
    }
  }, [state, cancelRecording]);

  // IDLE — mic button
  if (state === "idle") {
    return (
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="p-2.5 rounded-full transition-colors flex-shrink-0"
        style={{ color: "var(--text2)", touchAction: "none" }}
      >
        <Mic size={22} />
      </button>
    );
  }

  // RECORDING — pulsing red mic + timer
  if (state === "recording") {
    return (
      <div className="flex items-center gap-2" onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} style={{ touchAction: "none" }}>
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
        <button
          type="button"
          onPointerUp={handlePointerUp}
          className="p-2.5 rounded-full flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", touchAction: "none" }}
        >
          <Mic size={22} className="animate-pulse" />
        </button>
      </div>
    );
  }

  // PREVIEW — play, delete, send
  if (state === "preview") {
    return (
      <div className="flex items-center gap-2 flex-1">
        {/* Delete */}
        <button type="button" onClick={cancelRecording} className="p-2 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text3)" }}>
          <X size={18} />
        </button>

        {/* Waveform + play */}
        <button type="button" onClick={togglePlayback}
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--card-border)" }}>
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

        {/* Send */}
        <button type="button" onClick={sendVoice} className="p-2.5 rounded-full flex-shrink-0" style={{ background: "var(--grad-teal)" }}>
          <Send size={18} style={{ color: "#0D1117" }} />
        </button>
      </div>
    );
  }

  // SENDING — spinner
  return (
    <div className="flex items-center gap-2 flex-1 px-3 py-2">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      <span className="text-xs" style={{ color: "var(--text2)" }}>Transkribiere...</span>
    </div>
  );
}
