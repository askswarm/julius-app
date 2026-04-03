import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase-server";
import { USERS } from "@/lib/constants";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text, image, chatId, mealType } = await req.json();

    const userKey = Object.entries(USERS).find(([, u]) => u.id === chatId)?.[0] || "vincent";
    const user = USERS[userKey];
    const datum = new Date().toISOString().split("T")[0];

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

    const prompt = text || "Analysiere dieses Gericht.";
    content.push({
      type: "text",
      text: `${prompt}

Analysiere das Gericht und gib die Naehrwerte als JSON zurueck. Format:
{"gericht_name": "...", "kalorien": 0, "protein_g": 0, "kohlenhydrate_g": 0, "fett_g": 0, "ballaststoffe_g": 0}

User: ${user.name}, Ziele: ${user.protein_ziel_g}g Protein/Tag, ${user.kcal_training} kcal/Tag.
Antworte NUR mit dem JSON, keine Erklaerung.`,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content }],
    });

    const responseText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Konnte Naehrwerte nicht analysieren", raw: responseText }, { status: 422 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Save to nutrition_log
    const { data, error } = await supabaseServer
      .from("nutrition_log")
      .insert({
        chat_id: chatId,
        datum,
        mahlzeit_typ: mealType || "snack",
        gericht_name: analysis.gericht_name || "Unbekannt",
        kalorien: analysis.kalorien || 0,
        protein_g: analysis.protein_g || 0,
        kohlenhydrate_g: analysis.kohlenhydrate_g || 0,
        fett_g: analysis.fett_g || 0,
        ballaststoffe_g: analysis.ballaststoffe_g || 0,
        quelle: "app",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meal: data, analysis });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
