import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase-server";
import { USERS } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  // Count total
  const { count } = await supabaseServer
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId);

  // Fetch page (newest first for offset, then reverse for display order)
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

    const assistantText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Save both messages
    const userContent = message || "[Foto]";
    const { data: inserted } = await supabaseServer.from("conversations").insert([
      { chat_id: chatId, role: "user", content: userContent },
      { chat_id: chatId, role: "assistant", content: assistantText },
    ]).select("id, role, content, created_at");

    return NextResponse.json({ response: assistantText, saved: inserted });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
