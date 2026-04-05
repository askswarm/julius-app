"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Msg { role: "bot" | "user"; text: string; image?: string }

function getGreetingWithName() {
  const hour = new Date().getHours();
  const name = typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("halflife-protocol") || "{}").name || "dort") : "dort";
  if (hour < 12) return "Guten Morgen, " + name;
  if (hour < 17) return "Hallo, " + name;
  if (hour < 21) return "Guten Abend, " + name;
  return "Gute Nacht, " + name;
}

const CHAT_ID = 1349433042;
const QUICK_ACTIONS = ["Blutwerte eintragen", "Mahlzeit loggen", "Supplement checken", "TRT Frage"];

function CoachInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hideQuick, setHideQuick] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const greeting = getGreetingWithName() + "! Was kann ich fuer dich tun?";
    setMsgs([{ role: "bot", text: greeting }]);
    if (initialPrompt) {
      setHideQuick(true);
      setTimeout(() => sendMessage(initialPrompt), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  async function sendMessage(text: string, image?: string) {
    if (!text.trim() && !image) return;
    setMsgs((p) => [...p, { role: "user", text, image }]);
    setInput("");
    setHideQuick(true);
    setTyping(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chatId: CHAT_ID, image }),
      });
      const data = await r.json();
      setMsgs((p) => [...p, { role: "bot", text: data.response || "Sorry, da ist was schiefgelaufen." }]);
    } catch {
      setMsgs((p) => [...p, { role: "bot", text: "Verbindungsfehler. Bitte nochmal versuchen." }]);
    } finally {
      setTyping(false);
    }
  }

  function handleSend() {
    if (input.trim()) sendMessage(input.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function adjustTextarea() {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      sendMessage("Hier ist ein Foto. Bitte analysiere es.", dataUrl);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "memo.webm");
        setTyping(true);
        try {
          const r = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await r.json();
          if (data.text) await sendMessage(data.text);
          else setTyping(false);
        } catch { setTyping(false); }
      };
      rec.start(5000);
      recorderRef.current = rec;
      setRecording(true);
      setRecordSec(0);
      recordTimerRef.current = window.setInterval(() => setRecordSec((s) => s + 1), 1000);
    } catch {
      alert("Mikrofon-Zugriff verweigert");
    }
  }

  function stopRec() {
    recorderRef.current?.stop();
    setRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
  }

  function toggleRec() { recording ? stopRec() : startRec(); }

  const hasInput = input.trim().length > 0;

  return (
    <div style={{ background: "#050506", display: "flex", flexDirection: "column" as const, height: "100dvh", margin: "-20px -16px -90px" }}>
      {/* Header */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "0.5px solid #111114", flexShrink: 0 }}>
        <Link href="/" style={{ color: "#5a5a62", textDecoration: "none", fontSize: 18 }}>←</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e8ec" }}>Companion</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ec" }}>halflife<span style={{ color: "#E8893C", fontWeight: 300 }}>.</span></div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: 16, display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{
              background: m.role === "bot" ? "#0c0c0f" : "rgba(232,137,60,0.1)",
              borderRadius: m.role === "bot" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
              padding: m.image ? 4 : "12px 14px", maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : 0,
              fontSize: 14, color: m.role === "bot" ? "#c8c8d0" : "#E8893C", lineHeight: 1.55,
            }}>
              {m.image && <img src={m.image} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 12, display: "block" }} />}
              {m.text && <div style={{ padding: m.image ? "8px 10px 4px" : 0 }}>{m.text}</div>}
            </div>
            {/* Quick actions under first message */}
            {i === 0 && !hideQuick && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 10 }}>
                {QUICK_ACTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 20, background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", color: "#E8893C", cursor: "pointer" }}>{q}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ background: "#0c0c0f", borderRadius: "16px 16px 16px 4px", padding: "12px 14px", maxWidth: 60, display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a5a62", animation: `hlDot 1.4s infinite ${i * 0.2}s` }} />
            ))}
            <style>{`@keyframes hlDot { 0%,60%,100% { opacity: 0.3 } 30% { opacity: 1 } }`}</style>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <div style={{ flexShrink: 0, padding: "8px 16px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        {recording ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0c0c0f", borderRadius: 24, padding: "12px 16px", border: "0.5px solid #1a1a1e" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e05050", animation: "hlRec 1s infinite" }} />
            <style>{`@keyframes hlRec { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
            <span style={{ flex: 1, fontSize: 13, color: "#e8e8ec" }}>Aufnahme laeuft... {String(Math.floor(recordSec / 60)).padStart(2, "0")}:{String(recordSec % 60).padStart(2, "0")}</span>
            <button onClick={stopRec} style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8893C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, background: "#050506", borderRadius: 2 }} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#0c0c0f", borderRadius: 24, padding: "8px 10px 8px 14px", border: "0.5px solid #1a1a1e" }}>
            <textarea ref={textareaRef} value={input} onChange={(e) => { setInput(e.target.value); adjustTextarea(); }} onKeyDown={onKeyDown}
              placeholder="Nachricht, Foto oder Sprachmemo..." rows={1}
              style={{ flex: 1, background: "transparent", border: "none", color: "#e8e8ec", fontSize: 14, outline: "none", resize: "none", maxHeight: 120, fontFamily: "inherit", padding: "6px 0", lineHeight: 1.4 }} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8893C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </button>
              {hasInput ? (
                <button onClick={handleSend} style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8893C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050506" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
                </button>
              ) : (
                <button onClick={toggleRec} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8893C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><path d="M12 19v4" /><path d="M8 23h8" /></svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div style={{ background: "#050506", minHeight: "100vh" }} />}>
      <CoachInner />
    </Suspense>
  );
}
