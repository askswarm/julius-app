import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

    const match = image.match(/^data:(image\/\w+|application\/pdf);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "invalid format" }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: match[2] } },
          { type: "text", text: `Extrahiere alle Blutwerte aus diesem Laborbericht. Antworte NUR als JSON Array:
[{"marker": "testosteron_gesamt", "wert": 650, "einheit": "ng/dL"}, ...]
Verwende diese Marker-Keys: testosteron_gesamt, testosteron_frei, shbg, oestradiol, lh, fsh, prolaktin, psa, haematokrit, haemoglobin, got, gpt, hscrp, homocystein, vitamin_d, b12, ferritin, tsh, ft3, ft4, zink, selen, magnesium` },
        ],
      }],
    });

    const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "Konnte Blutwerte nicht erkennen", raw: text }, { status: 422 });

    return NextResponse.json({ success: true, markers: JSON.parse(jsonMatch[0]) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
