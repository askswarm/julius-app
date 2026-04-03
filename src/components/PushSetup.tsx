"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/UserContext";

export default function PushSetup() {
  const { user } = useUser();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });

        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: user.id, subscription: sub.toJSON() }),
        });
      } catch {
        // Push not supported or denied
      }
    }

    setup();
  }, [user.id]);

  return null;
}
