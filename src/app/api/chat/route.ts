import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase-server";
import { USERS } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/prompts";
import { calculateMacroAdjustment } from "@/lib/macroAdjustment";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface LogAction {
  type: "meal" | "training" | "water" | "supplement" | "supplement_missed" | "adaptation" | "symptom";
  meal_type?: string;
  name?: string;
  kalorien?: number;
  protein_g?: number;
  kohlenhydrate_g?: number;
  fett_g?: number;
  sport?: string;
  dauer_min?: number;
  rpe?: number;
  menge_ml?: number;
  zeitpunkt?: string;
  items?: string[];
  trigger?: string;
  category?: string;
  description?: string;
  symptom?: string;
  severity?: string;
  resolved?: boolean;
}

async function executeLogActions(actions: LogAction[], chatId: number) {
  const datum = new Date().toISOString().split("T")[0];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "meal":
          await supabaseServer.from("nutrition_log").insert({
            chat_id: chatId,
            datum,
            mahlzeit_typ: action.meal_type || "snack",
            gericht_name: action.name || "Unbekannt",
            kalorien: action.kalorien || 0,
            protein_g: action.protein_g || 0,
            kohlenhydrate_g: action.kohlenhydrate_g || 0,
            fett_g: action.fett_g || 0,
            quelle: "chat",
          });
          break;

        case "training": {
          const sport = action.sport || "Kraft";
          const dauerMin = action.dauer_min || 45;
          await supabaseServer.from("training_log").insert({
            chat_id: chatId,
            datum,
            typ: sport,
            name: action.name || sport,
            dauer_min: dauerMin,
            rpe: action.rpe || null,
          });
          const adj = calculateMacroAdjustment(sport, dauerMin);
          await supabaseServer.from("macro_adjustments").upsert(
            { chat_id: chatId, datum, kcal_adjustment: adj.kcal, protein_adjustment: adj.protein, training_typ: sport },
            { onConflict: "chat_id,datum" }
          );
          break;
        }

        case "water":
          if (action.menge_ml) {
            await supabaseServer.from("hydration_log").insert({
              chat_id: chatId,
              datum,
              menge_ml: action.menge_ml,
              getraenk: "Wasser",
            });
          }
          break;

        case "supplement":
          if (action.zeitpunkt) {
            await supabaseServer.from("supplement_log").upsert(
              { chat_id: chatId, datum, zeitpunkt: action.zeitpunkt },
              { onConflict: "chat_id,datum,zeitpunkt" }
            );
          }
          break;

        case "supplement_missed":
          if (action.zeitpunkt) {
            await supabaseServer.from("supplement_log").upsert(
              { chat_id: chatId, datum, zeitpunkt: action.zeitpunkt, eingenommen: false },
              { onConflict: "chat_id,datum,zeitpunkt" }
            );
          }
          break;

        case "adaptation":
          await supabaseServer.from("adaptations_log").insert({
            chat_id: chatId,
            datum,
            trigger: action.trigger || "chat",
            category: action.category || "supplements",
            description: action.description || "",
          });
          break;

        case "symptom":
          if (action.resolved) {
            await supabaseServer.from("health_status")
              .update({ active: false, resolved_at: datum })
              .eq("chat_id", chatId)
              .eq("active", true)
              .ilike("symptom", `%${action.symptom || ""}%`);
          } else {
            await supabaseServer.from("health_status").insert({
              chat_id: chatId,
              symptom: action.symptom || "Unbekannt",
              severity: action.severity || "mild",
              active: true,
              started_at: datum,
            });
          }
          break;
      }
    } catch (e) {
      console.error(`Auto-log action ${action.type} failed:`, e);
    }
  }
}

function parseLogBlock(response: string): { clean: string; actions: LogAction[] } {
  const logMatch = response.match(/\|\|\|LOG\|\|\|([\s\S]*?)\|\|\|LOG\|\|\|/);
  const clean = response.replace(/\|\|\|LOG\|\|\|[\s\S]*?\|\|\|LOG\|\|\|/, "").trim();

  if (!logMatch) return { clean, actions: [] };

  try {
    const parsed = JSON.parse(logMatch[1]);
    return { clean, actions: Array.isArray(parsed.actions) ? parsed.actions : [] };
  } catch {
    return { clean, actions: [] };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const { count } = await supabaseServer
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId);

  const { data, error } = await supabaseServer
    .from("conversations")
    .select("id, role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data || []).reverse(),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, chatId, image } = await req.json();
    if (!message && !image) {
      return NextResponse.json({ error: "message or image required" }, { status: 400 });
    }

    const userKey = Object.entries(USERS).find(([, u]) => u.id === chatId)?.[0] || "vincent";
    const user = USERS[userKey];

    // Get conversation history
    const { data: history } = await supabaseServer
      .from("conversations")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(20);

    const messages: Anthropic.MessageParam[] = (history || [])
      .reverse()
      .map((h) => ({ role: h.role as "user" | "assistant", content: h.content }));

    // Build current message content
    const content: Anthropic.ContentBlockParam[] = [];
    if (image) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: match[2] },
        });
      }
    }
    if (message) {
      content.push({ type: "text", text: message });
    }

    messages.push({ role: "user", content });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildSystemPrompt(user, userKey),
      messages,
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse log actions and strip from visible response
    const { clean: assistantText, actions } = parseLogBlock(rawText);

    // Execute log actions in background
    if (actions.length > 0) {
      executeLogActions(actions, chatId).catch((e) => console.error("Auto-log error:", e));
    }

    // Save clean messages to conversations
    const userContent = message || "[Foto]";
    const { data: inserted } = await supabaseServer.from("conversations").insert([
      { chat_id: chatId, role: "user", content: userContent },
      { chat_id: chatId, role: "assistant", content: assistantText },
    ]).select("id, role, content, created_at");

    return NextResponse.json({
      response: assistantText,
      saved: inserted,
      logged: actions.length > 0 ? actions.map((a) => a.type) : undefined,
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
