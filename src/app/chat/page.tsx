"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import VoiceRecorder from "@/components/VoiceRecorder";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string, image?: string) {
    const msg = text || input.trim();
    if (!msg && !image) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg || "[Foto]",
      image: image || pendingImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg || undefined,
          chatId: user.id,
          image: image || pendingImage || undefined,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response || data.error || "Fehler bei der Antwort",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Verbindungsfehler. Versuche es erneut.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handlePhoto() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleVoiceTranscript(text: string) {
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:left-[72px]" style={{ background: "#0D1117", touchAction: "manipulation" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--card-border)", background: "#161B22", paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <Link href="/" className="p-1">
          <ArrowLeft size={20} style={{ color: "var(--text2)" }} />
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
          J
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Julius</p>
          <p className="text-[10px]" style={{ color: "var(--accent)" }}>Longevity Coach</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
              J
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Hallo {user.name}</p>
            <p className="text-xs max-w-xs" style={{ color: "var(--text3)" }}>
              Frag mich zu Training, Ernaehrung, Supplements oder schick ein Foto deines Essens.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Was soll ich heute essen?", "Supplement-Check", "Trainingsplan heute"].map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: "var(--card-border)", color: "var(--accent)", background: "rgba(126,226,184,0.06)" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] md:max-w-[70%] px-4 py-3 text-sm whitespace-pre-wrap"
              style={{
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "rgba(126,226,184,0.15)" : "#161B22",
                color: "var(--text)",
              }}
            >
              {msg.image && (
                <img src={msg.image} alt="" className="rounded-xl mb-2 max-h-48 object-cover" />
              )}
              {msg.content}
              <p className="text-[10px] mt-1 opacity-40">
                {msg.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-[18px] rounded-bl-[4px]" style={{ background: "#161B22" }}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0s" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice error toast */}
      {voiceError && (
        <div className="px-4 md:px-6 py-2" style={{ background: "rgba(239,68,68,0.1)" }}>
          <p className="text-xs" style={{ color: "#EF4444" }}>{voiceError}</p>
        </div>
      )}

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-4 md:px-6 py-2" style={{ background: "#161B22", borderTop: "1px solid var(--card-border)" }}>
          <div className="relative inline-block">
            <img src={pendingImage} alt="" className="h-16 rounded-lg object-cover" />
            <button type="button" onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              x
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 md:px-6 pt-3 flex items-end gap-2" style={{ background: "#161B22", borderTop: "1px solid var(--card-border)", paddingBottom: "max(12px, env(safe-area-inset-bottom))", position: "relative", zIndex: 10 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

        <button type="button" onClick={handlePhoto} className="p-2.5 rounded-full transition-colors flex-shrink-0" style={{ color: "var(--text2)" }}>
          <Camera size={22} />
        </button>

        <div className="flex-1 flex items-end rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--card-border)" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag Julius..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none max-h-32"
            style={{ color: "var(--text)", fontSize: "16px", lineHeight: "1.4", touchAction: "manipulation" }}
          />
        </div>

        {/* Voice Recorder or Send Button */}
        {input.trim() || pendingImage ? (
          <button type="button" onClick={() => sendMessage()} className="p-2.5 rounded-full flex-shrink-0" style={{ background: "var(--grad-teal)" }}>
            <Send size={18} style={{ color: "#0D1117" }} />
          </button>
        ) : (
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            onError={(msg) => { setVoiceError(msg); setTimeout(() => setVoiceError(""), 3000); }}
          />
        )}
      </div>
    </div>
  );
}
