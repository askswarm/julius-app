"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function ChatFAB() {
  const path = usePathname();
  if (path === "/chat") return null;

  return (
    <Link href="/chat"
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 glow-pulse md:bottom-6"
      style={{ background: "var(--grad-teal)" }}>
      <MessageCircle size={24} style={{ color: "#0D1117" }} />
    </Link>
  );
}
