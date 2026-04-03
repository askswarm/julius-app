import { NextResponse } from "next/server";
import { USERS, SUPPLEMENT_SCHEDULE } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";

export async function GET() {
  const abendSupps = SUPPLEMENT_SCHEDULE.abend.items.join(", ");

  for (const [, user] of Object.entries(USERS)) {
    await sendPushToUser(
      user.id,
      "Abend-Supplements",
      `${abendSupps}. Essensfenster schliesst um ${user.essensfenster_ende}.`
    );
  }

  return NextResponse.json({ sent: true });
}
