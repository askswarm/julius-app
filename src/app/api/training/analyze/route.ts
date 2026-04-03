import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "invalid image format" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: match[2] },
          },
          {
            type: "text",
            text: `Analysiere dieses Workout-Foto. Extrahiere wenn moeglich: Sportart, Uebungen mit Saetzen/Wdh/Gewicht, geschaetzte Dauer, RPE.
Antworte NUR als JSON:
{"sport": "Kraft", "name": "Oberkoerper Kraft", "dauer_min": 45, "rpe": 7, "uebungen": [{"name": "Bankdruecken", "saetze": 3, "wdh": 10, "gewicht": 80}]}
Wenn du die Details nicht erkennen kannst, schaetze basierend auf dem was du siehst.`,
          },
        ],
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Konnte Workout nicht analysieren", raw: text }, { status: 422 });
    }

    return NextResponse.json({ success: true, analysis: JSON.parse(jsonMatch[0]) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
