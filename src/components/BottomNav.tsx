"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Dumbbell, Moon, Pill, Settings } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/ernaehrung", icon: UtensilsCrossed, label: "Essen" },
  { href: "/training", icon: Dumbbell, label: "Training" },
  { href: "/schlaf", icon: Moon, label: "Schlaf" },
  { href: "/supplements", icon: Pill, label: "Supps" },
  { href: "/einstellungen", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const path = usePathname();
  const isChat = path === "/chat";
  const activeIdx = tabs.findIndex((t) => t.href === path);

  return (
    <>
      {!isChat && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--nav-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex justify-around py-1.5 relative">
            {/* Sliding indicator */}
            {activeIdx >= 0 && (
              <div className="absolute top-0 h-0.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  background: "var(--nav-active)",
                  width: `${100 / tabs.length}%`,
                  left: `${(activeIdx / tabs.length) * 100}%`,
                }} />
            )}
            {tabs.map((t) => {
              const active = path === t.href;
              return (
                <Link key={t.href} href={t.href}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 relative transition-all duration-200"
                  style={{ transform: active ? "translateY(-2px)" : "translateY(0)" }}>
                  <t.icon size={active ? 22 : 20} style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)", transition: "all 0.2s ease" }} />
                  <span className="font-medium transition-all duration-200"
                    style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)", fontSize: active ? 10 : 9, opacity: active ? 1 : 0.7 }}>
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <nav className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-[72px] md:flex-col md:items-center md:gap-1 md:py-6 md:z-40"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderRight: "1px solid var(--nav-border)" }}>
        <div className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center text-lg font-bold"
          style={{ background: "var(--grad-teal)", color: "#0D1117" }}>J</div>
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Link key={t.href} href={t.href}
              className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-all duration-200 relative"
              style={{
                background: active ? "rgba(126,226,184,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--nav-active)" : "2px solid transparent",
              }}>
              <t.icon size={20} style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }} />
              <span className="text-[9px] font-medium" style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
