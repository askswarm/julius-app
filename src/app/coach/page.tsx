"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import ChatInput from "@/components/ChatInput";
import { halflifeTheme as ht } from "@/lib/appConfig";

interface Message { id: string; role: "user" | "assistant"; content: string; created_at: string }

export default function CoachPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?chatId=${user.id}&offset=0&limit=50`).then((r) => r.json()).then((d) => {
      setMessages((d.messages || []).map((m: { id: number; role: string; content: string; created_at: string }) => ({ id: String(m.id), role: m.role, content: m.content, created_at: m.created_at })));
      setLoadingHistory(false);
    }).catch(() => setLoadingHistory(false));
  }, [user.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    setMessages((prev) => [...prev, { id: "tmp-" + crypto.randomUUID(), role: "user", content: text, created_at: now }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, chatId: user.id }) });
      const data = await res.json();
      if (data.saved?.length >= 2) {
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], id: String(data.saved[0].id) }; u.push({ id: String(data.saved[1].id), role: "assistant", content: data.saved[1].content, created_at: data.saved[1].created_at }); return u; });
      } else {
        setMessages((prev) => [...prev, { id: "tmp-r", role: "assistant", content: data.response || data.error || "Fehler", created_at: now }]);
      }
    } catch { setMessages((prev) => [...prev, { id: "tmp-e", role: "assistant", content: "Verbindungsfehler", created_at: now }]); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: ht.bg, height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: ht.card, paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <Link href="/"><ArrowLeft size={20} style={{ color: ht.text3 }} /></Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ht.accentDim, color: ht.accent }}>h</div>
        <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 600, color: ht.text }}>Coach</p><p style={{ fontSize: 10, color: ht.text3 }}>AI Protocol Assistant</p></div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {loadingHistory && <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin" style={{ color: ht.accent }} /></div>}
        {!loadingHistory && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: ht.accentDim, color: ht.accent }}>h</div>
            <p style={{ fontSize: 14, fontWeight: 500, color: ht.text }}>Ask your coach</p>
            <p style={{ fontSize: 12, color: ht.text3, maxWidth: 280 }}>TRT dosing, peptide timing, supplement stacking, bloodwork analysis</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["TRT timing", "Bloodwork analysis", "Peptide stacking"].map((q) => (
                <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, background: ht.card, border: `0.5px solid ${ht.border}`, color: ht.text2 }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap" style={{
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user" ? ht.accentDim : ht.card, color: ht.text,
            }}>
              {msg.content}
              <p style={{ fontSize: 10, marginTop: 4, opacity: 0.4 }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{ background: ht.card }}>
              <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full pulse-dot" style={{ background: ht.accent, animationDelay: `${i * 0.2}s` }} />)}</div>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} isLoading={loading} />
    </div>
  );
}
