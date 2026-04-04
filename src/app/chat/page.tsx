"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import ChatInput from "@/components/ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  created_at: string;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const msgDate = d.toISOString().split("T")[0];

  if (msgDate === today) return "Heute";
  if (msgDate === yesterday) return "Gestern";
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: "rgba(245,158,11,0.3)", color: "inherit", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
      : part
  );
}

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  // Load history on mount
  const loadHistory = useCallback(async (off: number, prepend: boolean) => {
    try {
      const res = await fetch(`/api/chat?chatId=${user.id}&offset=${off}&limit=50`);
      const data = await res.json();
      const msgs: Message[] = (data.messages || []).map((m: { id: number; role: string; content: string; created_at: string }) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      }));

      if (prepend) {
        setMessages((prev) => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
      }
      setHasMore(data.hasMore);
      setOffset(off + msgs.length);
    } catch { /* ignore */ }
    setLoadingHistory(false);
  }, [user.id]);

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    setLoadingHistory(true);
    initialScrollDone.current = false;
    loadHistory(0, false);
  }, [user.id, loadHistory]);

  // Auto-scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!loadingHistory && scrollRef.current) {
      if (!initialScrollDone.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        initialScrollDone.current = true;
      } else {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages, loading, loadingHistory]);

  async function loadOlder() {
    setLoadingHistory(true);
    const scrollEl = scrollRef.current;
    const prevHeight = scrollEl?.scrollHeight || 0;
    await loadHistory(offset, true);
    // Keep scroll position after prepending
    if (scrollEl) {
      requestAnimationFrame(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight;
      });
    }
  }

  async function sendMessage(text: string) {
    const msg = text.trim();
    if (!msg) return;

    const now = new Date().toISOString();
    const userMsg: Message = {
      id: "tmp-" + crypto.randomUUID(),
      role: "user",
      content: msg,
      created_at: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          chatId: user.id,
        }),
      });

      const data = await res.json();

      // Replace temp msg and add assistant response using server-returned data
      setMessages((prev) => {
        const updated = [...prev];
        // Update temp user msg with server id if available
        if (data.saved?.length >= 2) {
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === userMsg.id) {
            updated[lastIdx] = { ...updated[lastIdx], id: String(data.saved[0].id), created_at: data.saved[0].created_at };
          }
          updated.push({
            id: String(data.saved[1].id),
            role: "assistant",
            content: data.saved[1].content,
            created_at: data.saved[1].created_at,
          });
        } else {
          updated.push({
            id: "tmp-" + crypto.randomUUID(),
            role: "assistant",
            content: data.response || data.error || "Fehler bei der Antwort",
            created_at: new Date().toISOString(),
          });
        }
        return updated;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: "tmp-err", role: "assistant", content: "Verbindungsfehler. Versuche es erneut.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Scroll to bottom on focus (keyboard open) with delay for animation
  useEffect(() => {
    function onFocus() {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 300);
    }
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  // Filter messages by search
  const displayed = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Group messages by date for separators
  let lastDate = "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:left-[72px]" style={{ background: "var(--bg)", touchAction: "manipulation", height: "100dvh", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--card-border)", background: "var(--card)", paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <Link href="/" className="p-1">
          <ArrowLeft size={20} style={{ color: "var(--text2)" }} />
        </Link>

        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
            <Search size={16} style={{ color: "var(--text3)" }} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nachrichten durchsuchen..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--input-text)", fontSize: "16px" }}
            />
            <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-0.5">
              <X size={16} style={{ color: "var(--text3)" }} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--grad-teal)", color: "#0D1117" }}>
              J
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Julius</p>
              <p className="text-[10px]" style={{ color: "var(--accent)" }}>Longevity Coach</p>
            </div>
            <button type="button" onClick={() => setSearchOpen(true)} className="p-1.5">
              <Search size={18} style={{ color: "var(--text3)" }} />
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-4 flex flex-col gap-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Load older button */}
        {hasMore && !searchQuery && (
          <button type="button" onClick={loadOlder} disabled={loadingHistory}
            className="self-center px-4 py-2 rounded-full text-xs font-medium mb-2 transition-colors"
            style={{ background: "var(--subtle-bg)", color: "var(--text3)", border: "1px solid var(--card-border)" }}>
            {loadingHistory ? <Loader2 size={14} className="animate-spin" /> : "Aeltere Nachrichten laden"}
          </button>
        )}

        {/* Loading initial */}
        {loadingHistory && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}

        {/* Empty state */}
        {!loadingHistory && messages.length === 0 && !searchQuery && (
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

        {/* Search empty */}
        {searchQuery && displayed.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: "var(--text3)" }}>Keine Treffer fuer "{searchQuery}"</p>
        )}

        {/* Messages with date separators */}
        {displayed.map((msg) => {
          const msgDate = msg.created_at ? new Date(msg.created_at).toISOString().split("T")[0] : "";
          let showSeparator = false;
          if (msgDate && msgDate !== lastDate) {
            lastDate = msgDate;
            showSeparator = true;
          }

          return (
            <div key={msg.id}>
              {showSeparator && (
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
                  <span className="text-[10px] font-medium px-2" style={{ color: "var(--text3)" }}>
                    {formatDateLabel(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
                </div>
              )}
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] md:max-w-[70%] px-4 py-3 text-sm whitespace-pre-wrap"
                  style={{
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user" ? "var(--bubble-user)" : "var(--bubble-bot)",
                    color: "var(--text)",
                  }}
                >
                  {msg.image && (
                    <img src={msg.image} alt="" className="rounded-xl mb-2 max-h-48 object-cover" />
                  )}
                  {highlightText(msg.content, searchQuery)}
                  <p className="text-[10px] mt-1 opacity-40">
                    {msg.created_at ? formatTime(msg.created_at) : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-[18px] rounded-bl-[4px]" style={{ background: "var(--bubble-bot)" }}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0s" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput onSend={sendMessage} isLoading={loading} />
    </div>
  );
}
