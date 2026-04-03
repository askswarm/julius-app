"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Dumbbell, Moon, Pill, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/ernaehrung", icon: UtensilsCrossed, label: "Essen" },
  { href: "/training", icon: Dumbbell, label: "Training" },
  { href: "/schlaf", icon: Moon, label: "Schlaf" },
  { href: "/supplements", icon: Pill, label: "Supps" },
  { href: "/profil", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const path = usePathname();

  const isChat = path === "/chat";

  // Hide mobile nav on chat page — chat has its own full-screen layout
  return (
    <>
      {/* Mobile — hidden on chat */}
      {!isChat && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{ background: "rgba(13,17,23,0.85)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--card-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex justify-around py-2.5">
            {tabs.map((t) => {
              const active = path === t.href;
              return (
                <Link key={t.href} href={t.href}
                  className="flex flex-col items-center gap-0.5 px-2 py-0.5 relative">
                  {active && <div className="absolute -top-1 w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />}
                  <t.icon size={20} style={{ color: active ? "var(--accent)" : "var(--text3)" }} />
                  <span className="text-[10px] font-medium" style={{ color: active ? "var(--accent)" : "var(--text3)" }}>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Desktop Sidebar — always visible, chat offsets itself via md:left-[72px] */}
      <nav className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-[72px] md:flex-col md:items-center md:gap-1 md:py-6 md:z-40"
        style={{ background: "rgba(13,17,23,0.9)", backdropFilter: "blur(20px)", borderRight: "1px solid var(--card-border)" }}>
        <div className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center text-lg font-bold"
          style={{ background: "var(--grad-teal)", color: "#0D1117" }}>J</div>
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Link key={t.href} href={t.href}
              className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-all relative"
              style={{
                background: active ? "rgba(126,226,184,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              <t.icon size={20} style={{ color: active ? "var(--accent)" : "var(--text3)" }} />
              <span className="text-[9px] font-medium" style={{ color: active ? "var(--accent)" : "var(--text3)" }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
