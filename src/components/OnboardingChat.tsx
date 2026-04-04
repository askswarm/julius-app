"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Msg {
  role: "ai" | "user";
  content: string;
  chips?: string[];
  multiSelect?: boolean;
  parsedCard?: Record<string, string>;
  summaryCard?: boolean;
  finishButton?: boolean;
}

interface Props {
  chatId: number;
  onComplete: () => void;
}

const FOCUS_CHIPS = ["TRT Tracking", "Peptide Protokolle", "Supplement Stack", "Blutwerte", "Training", "Ernaehrung", "Longevity"];
const COMPOUND_CHIPS = ["Test Cypionate", "Test Enanthate", "Test Propionate", "Sustanon", "Undecanoat"];
const PEPTIDE_CHIPS = ["BPC-157", "TB-500", "CJC/Ipa", "Semaglutid", "GHK-Cu", "Epitalon", "NAD+", "PT-141", "Noch nicht"];
const WEARABLE_CHIPS = ["Oura Ring", "Apple Watch", "Whoop", "Garmin", "Keins"];

export default function OnboardingChat({ chatId, onComplete }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Collected data
  const dataRef = useRef<{
    focus: string[]; compound: string; weekly_dose_mg: number; frequency: number; method: string;
    concentration: number | null; peptides: string[]; wearable: string;
  }>({ focus: [], compound: "", weekly_dose_mg: 0, frequency: 2, method: "subcutaneous", concentration: null, peptides: [], wearable: "" });

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  }, []);

  function addAI(content: string, opts?: Partial<Msg>) {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", content, ...opts }]);
      setTyping(false);
      setSelected([]);
      scrollDown();
    }, 600);
  }

  function addUser(content: string) {
    setMessages((prev) => [...prev, { role: "user", content }]);
    scrollDown();
  }

  // Start flow
  useEffect(() => {
    addAI("Was bringt dich zu Julius? Waehle alles was dich interessiert.", { chips: FOCUS_CHIPS, multiSelect: true });
    setStep(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { scrollDown(); }, [messages, typing, scrollDown]);

  function toggleChip(chip: string) {
    setSelected((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]);
  }

  async function confirmSelection() {
    if (selected.length === 0) return;

    if (step === 1) {
      // Focus selected
      dataRef.current.focus = selected;
      addUser(selected.join(", "));
      const hasTRT = selected.some((s) => s.includes("TRT"));
      const hasPeptides = selected.some((s) => s.includes("Peptid"));

      if (hasTRT) {
        setTimeout(() => addAI("Erzaehl mir von deinem TRT Protokoll — Wirkstoff, Dosis, Frequenz. Oder waehle unten.", { chips: COMPOUND_CHIPS }), 800);
        setStep(2);
      } else if (hasPeptides) {
        setTimeout(() => addAI("Welche Peptide nimmst du aktuell?", { chips: PEPTIDE_CHIPS, multiSelect: true }), 800);
        setStep(3);
      } else {
        setTimeout(() => addAI("Nutzt du einen Oura Ring oder ein anderes Wearable?", { chips: WEARABLE_CHIPS }), 800);
        setStep(4);
      }
    } else if (step === 2) {
      // TRT compound selected via chips
      dataRef.current.compound = selected[0];
      addUser(selected[0]);
      setTimeout(() => addAI("Wie sieht dein Schema aus? Z.B. '120mg 2x pro Woche SubQ'"), 600);
      setStep(2.5);
    } else if (step === 3) {
      // Peptides selected
      const peptides = selected.filter((s) => s !== "Noch nicht");
      dataRef.current.peptides = peptides;
      addUser(peptides.length > 0 ? peptides.join(", ") : "Noch keine");
      setTimeout(() => addAI("Nutzt du einen Oura Ring oder ein anderes Wearable?", { chips: WEARABLE_CHIPS }), 800);
      setStep(4);
    } else if (step === 4) {
      // Wearable selected
      dataRef.current.wearable = selected[0];
      addUser(selected[0]);
      showSummary();
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addUser(text);

    if (step === 2 || step === 2.5) {
      // Parse TRT protocol via API
      setTyping(true);
      try {
        const res = await fetch("/api/onboarding/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const parsed = await res.json();
        if (parsed.compound) {
          dataRef.current.compound = parsed.compound;
          dataRef.current.weekly_dose_mg = parsed.weekly_dose_mg || 0;
          dataRef.current.frequency = parsed.frequency_per_week || 2;
          dataRef.current.method = parsed.method || "subcutaneous";
          dataRef.current.concentration = parsed.concentration_mg_ml || null;

          const perInj = dataRef.current.frequency > 0 ? Math.round(dataRef.current.weekly_dose_mg / dataRef.current.frequency) : 0;
          const card: Record<string, string> = {
            Wirkstoff: parsed.compound,
            "Wochendosis": `${parsed.weekly_dose_mg}mg`,
            Frequenz: `${parsed.frequency_per_week}x pro Woche`,
            "Pro Injektion": `${perInj}mg`,
            Methode: parsed.method || "SubQ",
          };
          if (parsed.concentration_mg_ml) {
            card["Konzentration"] = `${parsed.concentration_mg_ml}mg/ml`;
            card["Volumen"] = `${(perInj / parsed.concentration_mg_ml).toFixed(2)}ml`;
          }

          setTyping(false);
          setMessages((prev) => [...prev, { role: "ai", content: "So hab ich es verstanden:", parsedCard: card }]);
          scrollDown();

          const hasPeptides = dataRef.current.focus.some((s) => s.includes("Peptid"));
          setTimeout(() => {
            if (hasPeptides) {
              addAI("Welche Peptide nimmst du aktuell?", { chips: PEPTIDE_CHIPS, multiSelect: true });
              setStep(3);
            } else {
              addAI("Nutzt du einen Oura Ring oder ein anderes Wearable?", { chips: WEARABLE_CHIPS });
              setStep(4);
            }
          }, 1500);
        } else {
          setTyping(false);
          addAI("Ich konnte das nicht ganz parsen. Versuche es nochmal, z.B. '120mg Test Cyp 2x pro Woche SubQ'");
        }
      } catch {
        setTyping(false);
        addAI("Fehler beim Parsen. Versuche es nochmal.");
      }
    } else {
      // Free text for any other step — just acknowledge and continue
      addAI("Verstanden. Weiter geht's!");
    }
  }

  function showSummary() {
    const d = dataRef.current;
    const summaryLines: string[] = [];
    summaryLines.push(`Fokus: ${d.focus.join(", ")}`);
    if (d.compound) summaryLines.push(`TRT: ${d.compound}, ${d.weekly_dose_mg}mg/Woche, ${d.frequency}x, ${d.method}`);
    if (d.peptides.length > 0) summaryLines.push(`Peptide: ${d.peptides.join(", ")}`);
    summaryLines.push(`Wearable: ${d.wearable}`);

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "ai",
        content: "Dein Protokoll ist eingerichtet!",
        parsedCard: Object.fromEntries(summaryLines.map((l) => { const [k, ...v] = l.split(": "); return [k, v.join(": ")]; })),
        finishButton: true,
      }]);
      setStep(5);
      scrollDown();
    }, 800);
  }

  async function finish() {
    setSaving(true);
    const d = dataRef.current;

    const settings: Record<string, string> = {
      onboarding_completed: "true",
      focus: JSON.stringify(d.focus),
      wearable: d.wearable,
    };
    if (d.compound) {
      settings.trt_schema = JSON.stringify({
        compound: d.compound,
        weekly_dose_mg: d.weekly_dose_mg,
        frequency: d.frequency,
        method: d.method,
        concentration: d.concentration,
      });
    }
    if (d.peptides.length > 0) {
      settings.peptides_selected = JSON.stringify(d.peptides);
    }

    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("user_settings").upsert({ chat_id: chatId, key, value }, { onConflict: "chat_id,key" });
    }

    onComplete();
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "24px";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  }, [input]);

  // Last AI message chips
  const lastAI = [...messages].reverse().find((m) => m.role === "ai" && m.chips);

  return (
    <>
      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 py-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 h-0.5 rounded-full" style={{
            background: step >= s ? "#2dd4a0" : "#1a1a1e",
            opacity: step === s ? 0.5 : 1,
          }} />
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] px-4 py-3 text-sm" style={{
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "rgba(45,212,160,0.1)" : "#111114",
                color: "#e4e4e7",
              }}>
                {msg.content}
              </div>
            </div>

            {/* Parsed card */}
            {msg.parsedCard && (
              <div className="mt-2 mx-1 p-3 rounded-xl" style={{ background: "#0f1a16", border: "1px solid #1a2e24" }}>
                {Object.entries(msg.parsedCard).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-xs" style={{ color: "#6b7280" }}>{k}</span>
                    <span className="text-xs font-medium" style={{ color: "#2dd4a0" }}>{v}</span>
                  </div>
                ))}
                {!msg.finishButton && step !== 5 && (
                  <button onClick={() => {
                    addUser("Stimmt so");
                    const hasPeptides = dataRef.current.focus.some((s) => s.includes("Peptid"));
                    if (step === 2.5 || step === 2) {
                      if (hasPeptides) {
                        setTimeout(() => { addAI("Welche Peptide nimmst du aktuell?", { chips: PEPTIDE_CHIPS, multiSelect: true }); setStep(3); }, 600);
                      } else {
                        setTimeout(() => { addAI("Nutzt du einen Oura Ring?", { chips: WEARABLE_CHIPS }); setStep(4); }, 600);
                      }
                    }
                  }}
                    className="mt-2 w-full py-2 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(45,212,160,0.1)", color: "#2dd4a0", border: "1px solid rgba(45,212,160,0.2)" }}>
                    <Check size={14} className="inline mr-1" /> Stimmt so
                  </button>
                )}
                {msg.finishButton && (
                  <button onClick={finish} disabled={saving}
                    className="mt-3 w-full py-3 rounded-xl text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #2EA67A, #7EE2B8)", color: "#0a0a0c" }}>
                    {saving ? "Wird eingerichtet..." : "Los geht's"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Chips for last AI message */}
        {lastAI && lastAI.chips && step < 5 && (
          <div className="flex flex-col gap-2 ml-1">
            <div className="flex flex-wrap gap-1.5">
              {lastAI.chips.map((chip) => {
                const active = selected.includes(chip);
                return (
                  <button key={chip} onClick={() => toggleChip(chip)}
                    className="text-xs py-1.5 px-3.5 rounded-full transition-all"
                    style={{
                      background: active ? "rgba(45,212,160,0.06)" : "#111114",
                      border: `0.5px solid ${active ? "rgba(45,212,160,0.4)" : "#1a1a1e"}`,
                      color: active ? "#2dd4a0" : "#a1a1aa",
                    }}>
                    {chip}
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <button onClick={confirmSelection}
                className="self-start text-xs py-1.5 px-4 rounded-full font-medium"
                style={{ background: "rgba(45,212,160,0.1)", color: "#2dd4a0", border: "1px solid rgba(45,212,160,0.2)" }}>
                Weiter
              </button>
            )}
            <p className="text-[10px] ml-1" style={{ color: "#4a4a50" }}>oder tippe frei</p>
          </div>
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl" style={{ background: "#111114" }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {step < 5 && (
        <div className="flex items-end gap-2 px-3 py-2" style={{ borderTop: "1px solid rgba(128,128,128,0.1)", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <div className="flex-1 flex items-end rounded-2xl px-3 py-1.5" style={{ background: "#111114", border: "1px solid #1a1a1e" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tippe frei..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none"
              style={{ color: "#e4e4e7", fontSize: 16, lineHeight: "1.4", maxHeight: 96, height: 24 }}
            />
          </div>
          {input.trim() && (
            <button onClick={handleSend} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
              style={{ background: "linear-gradient(135deg, #2EA67A, #7EE2B8)" }}>
              <Send size={16} style={{ color: "#0a0a0c" }} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
