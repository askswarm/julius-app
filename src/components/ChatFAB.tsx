"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function ChatFAB() {
  const path = usePathname();
  // Hide on chat page and pages with full-screen modals
  if (path === "/chat") return null;

  return (
    <Link href="/chat"
      className="fixed z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 glow-pulse md:bottom-6 md:right-6"
      style={{ background: "var(--grad-teal)", bottom: "calc(70px + env(safe-area-inset-bottom))", right: "16px" }}>
      <MessageCircle size={24} style={{ color: "#0D1117" }} />
    </Link>
  );
}
