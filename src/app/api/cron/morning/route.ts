import { NextResponse } from "next/server";
import { USERS, TRAINING_SCHEDULE, SUPPLEMENT_SCHEDULE } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";

export async function GET() {
  const dayOfWeek = new Date().getDay();

  for (const [key, user] of Object.entries(USERS)) {
    const training = TRAINING_SCHEDULE[dayOfWeek]?.[key as "vincent" | "maria"] || "Ruhetag";
    const firstSupps = SUPPLEMENT_SCHEDULE.nuechtern.items.join(", ");

    await sendPushToUser(
      user.id,
      `Guten Morgen ${user.name}`,
      `Heute: ${training}. Nuechtern-Supps: ${firstSupps}. Essensfenster ab ${user.essensfenster_start}.`
    );
  }

  return NextResponse.json({ sent: true });
}
