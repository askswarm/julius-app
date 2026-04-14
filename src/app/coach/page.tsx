"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { isHalflife } from "@/lib/appConfig";
import { parseAndSaveData } from "@/lib/halflifeDataStore";

interface Msg { role: "bot" | "user"; text: string; image?: string }

function getGreetingWithName() {
  const hour = new Date().getHours();
  const name = typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("halflife-protocol") || "{}").name || "dort") : "dort";
  if (hour < 12) return `Guten Morgen, ${name}!`;
  if (hour < 17) return `Hey ${name}!`;
  if (hour < 21) return `Guten Abend, ${name}!`;
  return `Hey ${name},`;
}

function getGreetingSuffix() {
  const hour = new Date().getHours();
  if (hour < 12) return " Was kann ich fuer dich tun?";
  if (hour < 17) return " Was steht an?";
  if (hour < 21) return " Wie war dein Tag?";
  return " noch was auf dem Herzen?";
}

const QUICK_ACTIONS = ["Blutwerte eintragen", "Injektion loggen", "Supplement Check", "Protokoll Frage"];

function CoachInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hideQuick, setHideQuick] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [image, setImage] = useState<string | null>(null);
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
    const greeting = getGreetingWithName() + getGreetingSuffix();
    setMsgs([{ role: "bot", text: greeting }]);
    if (initialPrompt) {
      setHideQuick(true);
      setTimeout(() => sendMessage(initialPrompt), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  async function sendMessage(text: string, imgOverride?: string) {
    const imgToSend = imgOverride || image;
    if (!text.trim() && !imgToSend) return;

    setMsgs((p) => [...p, { role: "user", text, image: imgToSend || undefined }]);
    setInput("");
    setImage(null);
    setHideQuick(true);
    setTyping(true);

    try {
      const protocol = JSON.parse(localStorage.getItem("halflife-protocol") || "{}");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatId: 1349433042,
          image: imgToSend || null,
          stream: true,
          messages: msgs.filter(m => m.role === "bot" || m.role === "user").slice(-20).map(m => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
          userName: protocol.name || "User",
          userProtocol: protocol,
        }),
      });

      if (!res.ok) throw new Error("API Fehler");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setTyping(false);
      setMsgs((p) => [...p, { role: "bot", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        const displayContent = assistantContent.replace(/\[DATA:\w+\][\s\S]*?\[\/DATA\]/g, "").trim();
        setMsgs((p) => {
          const updated = [...p];
          updated[updated.length - 1] = { role: "bot", text: displayContent };
          return updated;
        });
      }

      // Parse and save DATA tags
      parseAndSaveData(assistantContent);

    } catch {
      setTyping(false);
      setMsgs((p) => [...p, { role: "bot", text: "Entschuldigung, da ist etwas schiefgelaufen. Bitte versuch es nochmal." }]);
    }
  }

  function handleSend() {
    if (input.trim() || image) sendMessage(input.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function adjustTextarea() {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 100) + "px";
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
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

  const hasInput = input.trim().length > 0 || image !== null;

  return (
    <div style={{ background: "#050506", display: "flex", flexDirection: "column" as const, height: "100dvh", margin: "-20px -16px -90px" }}>
      {/* Header */}
      <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Link href="/" style={{ color: "#5a5a62", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a5a62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e8ec" }}>Companion</span>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(232,137,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#E8893C", fontWeight: 600 }}>
          {(typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("halflife-protocol") || "{}").name || "U") : "U").charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "16px 16px 120px 16px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{
              background: m.role === "bot" ? "#0c0c0f" : "rgba(232,137,60,0.08)",
              borderRadius: m.role === "bot" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
              padding: "12px 16px", maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : 0, marginBottom: 8,
              fontSize: 14, color: m.role === "bot" ? "#c8c8d0" : "#E8893C", lineHeight: 1.6,
            }}>
              {m.image && (
                <img src={m.image.startsWith("data:") ? m.image : `data:image/jpeg;base64,${m.image}`} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 12, display: "block", marginBottom: 6 }} />
              )}
              {m.text && <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>}
            </div>
            {/* Quick chips under first message */}
            {i === 0 && !hideQuick && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 10 }}>
                {QUICK_ACTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 20, background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", color: "#E8893C", cursor: "pointer" }}>{q}</button>
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
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))", background: "#050506", borderTop: "0.5px solid rgba(255,255,255,0.06)", zIndex: 50 }}>
        {/* Image preview */}
        {image && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <img src={`data:image/jpeg;base64,${image}`} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
            <button onClick={() => setImage(null)} style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1a1e", border: "none", color: "#5a5a62", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        )}

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
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#0c0c0f", borderRadius: 24, padding: "8px 14px", border: "0.5px solid #1a1a1e" }}>
            <textarea ref={textareaRef} value={input} onChange={(e) => { setInput(e.target.value); adjustTextarea(); }} onKeyDown={onKeyDown}
              placeholder="Nachricht eingeben..." rows={1}
              style={{ flex: 1, background: "transparent", border: "none", color: "#e8e8ec", fontSize: 14, outline: "none", resize: "none", maxHeight: 100, overflowY: "auto", fontFamily: "inherit", padding: "6px 0", lineHeight: 1.4 }} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8893C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </button>
              {hasInput ? (
                <button onClick={handleSend} style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8893C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050506" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
                </button>
              ) : (
                <button onClick={toggleRec} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,137,60,0.06)", border: "0.5px solid rgba(232,137,60,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
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
  if (!isHalflife) {
    // Julius mode — return minimal placeholder (Julius coach handled elsewhere)
    return (
      <Suspense fallback={<div />}>
        <CoachInner />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div style={{ background: "#050506", minHeight: "100vh" }} />}>
      <CoachInner />
    </Suspense>
  );
}
