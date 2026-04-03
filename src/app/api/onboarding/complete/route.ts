import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const answers = await req.json();
    const chatId = answers.gender === "F" ? 1497724240 : 1349433042;

    // Upsert user
    await supabaseServer.from("users").upsert({
      id: chatId,
      name: answers.name || "User",
      geschlecht: answers.gender || "M",
      alter_jahre: answers.birthdate ? Math.floor((Date.now() - new Date(answers.birthdate).getTime()) / 31557600000) : 35,
      gewicht_kg: answers.weight_kg || 75,
      groesse_cm: answers.height_cm || 175,
      protein_ziel_g: answers.gender === "F" ? 100 : 145,
      kcal_training: answers.gender === "F" ? 1650 : 2400,
      kcal_ruhe: answers.gender === "F" ? 1500 : 2100,
      wasser_ziel_ml: answers.gender === "F" ? 2500 : 3500,
      essensfenster_start: answers.nutrition_fasting ? answers.nutrition_window_start || "09:00" : "08:00",
      essensfenster_ende: answers.nutrition_fasting ? answers.nutrition_window_end || "18:30" : "20:00",
    }, { onConflict: "id" });

    // Save all settings
    const settings: Record<string, string> = {
      onboarding_complete: "true",
      language: answers.language || "de",
      focus: JSON.stringify(answers.focus || []),
      notifications: answers.notifications || "all",
    };

    if (answers.trt_active) {
      settings.trt_schema = JSON.stringify({
        dose_mg: answers.trt_dose_mg,
        frequency: answers.trt_frequency,
        days: answers.trt_days,
        concentration: answers.trt_concentration,
        method: answers.trt_method,
      });
    }

    if (answers.peptides_active) {
      settings.peptides_selected = JSON.stringify(answers.peptides_selected);
    }

    if (answers.training_experience) {
      settings.training_profile = JSON.stringify({
        experience: answers.training_experience,
        equipment: answers.training_equipment,
        sports: answers.training_sports,
        days: answers.training_days,
        goal: answers.training_goal,
      });
    }

    if (answers.longevity_stack?.length) {
      settings.longevity_stack = JSON.stringify(answers.longevity_stack);
    }

    if (answers.oura_token) {
      settings.oura_token = answers.oura_token;
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await supabaseServer.from("user_settings").upsert(
        { chat_id: chatId, key, value },
        { onConflict: "chat_id,key" }
      );
    }

    return NextResponse.json({ success: true, chatId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
