import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { markers, gender, hasTRT } = await req.json();

    const markerText = markers.map((m: { marker: string; wert: number; einheit: string }) =>
      `${m.marker}: ${m.wert} ${m.einheit}`
    ).join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Analysiere diese Blutwerte eines ${gender === "F" ? "weiblichen" : "maennlichen"} Patienten${hasTRT ? " auf TRT" : ""}:

${markerText}

Gib 3-5 konkrete Empfehlungen als JSON Array:
[{"marker": "haematokrit", "status": "warning", "text": "Haematokrit 53% erhoeht. TRT-bedingt. Blutspende erwaegen."}]
status: "optimal" | "warning" | "critical"
Fokus auf TRT-relevante und Longevity-Marker. Deutsch.`,
      }],
    });

    const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    return NextResponse.json({ recommendations: jsonMatch ? JSON.parse(jsonMatch[0]) : [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
