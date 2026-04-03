import webpush from "web-push";
import { supabaseServer } from "./supabase-server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:julius@busch.family", VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function sendPushToUser(chatId: number, title: string, body: string) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const { data } = await supabaseServer
    .from("push_subscriptions")
    .select("subscription")
    .eq("chat_id", chatId);

  if (!data?.length) return;

  const payload = JSON.stringify({ title, body });

  for (const row of data) {
    try {
      await webpush.sendNotification(row.subscription, payload);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await supabaseServer
          .from("push_subscriptions")
          .delete()
          .eq("chat_id", chatId)
          .eq("subscription", row.subscription);
      }
    }
  }
}
