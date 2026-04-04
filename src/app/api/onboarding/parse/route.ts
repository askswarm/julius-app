import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({});

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: `Du bist ein Parser fuer TRT und Peptide Protokolle. Extrahiere aus dem folgenden Text strukturierte Daten. Antworte NUR mit JSON ohne Markdown.
Format: {"compound": "Testosterone Cypionate", "weekly_dose_mg": 120, "frequency_per_week": 2, "method": "subcutaneous", "concentration_mg_ml": null}
Wenn ein Feld nicht erwaehnt wird, setze es auf null. compound muss der volle englische Name sein.`,
      messages: [{ role: "user", content: text }],
    });

    const responseText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({});

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({});
  }
}
