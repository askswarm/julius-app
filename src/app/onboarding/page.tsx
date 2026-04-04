"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingChat from "@/components/OnboardingChat";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.from("user_settings").select("value").eq("chat_id", user.id).eq("key", "onboarding_completed").maybeSingle()
      .then(({ data }) => {
        if (data?.value === "true") router.replace("/");
        else setChecking(false);
      });
  }, [user.id, router]);

  if (checking) return <div className="fixed inset-0" style={{ background: "#0a0a0c" }} />;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0a0a0c" }}>
      {/* Logo */}
      <div className="flex items-center justify-center pt-4 pb-2" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #2EA67A, #7EE2B8)", color: "#0a0a0c" }}>J</div>
      </div>

      {/* Chat */}
      <OnboardingChat chatId={user.id} onComplete={() => router.replace("/")} />
    </div>
  );
}
