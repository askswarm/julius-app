"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Dumbbell, Moon, Pill, Settings, MessageCircle, Activity, Heart, Clock } from "lucide-react";
import { isHalflife } from "@/lib/appConfig";

const juliusTabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/ernaehrung", icon: UtensilsCrossed, label: "Essen" },
  { href: "/training", icon: Dumbbell, label: "Training" },
  { href: "/schlaf", icon: Moon, label: "Schlaf" },
  { href: "/supplements", icon: Pill, label: "Supps" },
  { href: "/einstellungen", icon: Settings, label: "Settings" },
];

const halflifeTabs = [
  { href: "/", icon: Home, label: "home" },
  { href: "/supplements", icon: Activity, label: "protocol" },
  { href: "/supplements?tab=Blutwerte", icon: Heart, label: "blood" },
  { href: "/supplements?tab=Supplements", icon: Clock, label: "stack" },
  { href: "/chat", icon: MessageCircle, label: "coach" },
];

const tabs = isHalflife ? halflifeTabs : juliusTabs;

export default function BottomNav() {
  const path = usePathname();
  const isChat = path === "/chat";
  const activeIdx = tabs.findIndex((t) => t.href === path || (t.href.startsWith(path) && t.href.includes("?")));

  // Halflife: hide nav on chat (coach is fullscreen)
  if (isHalflife && isChat) return null;
  // Julius: hide nav on chat
  if (!isHalflife && isChat) return null;

  const navBg = isHalflife ? "linear-gradient(to top, #0a0a0c 60%, transparent)" : undefined;
  const navBgFallback = isHalflife ? "#0a0a0c" : "var(--nav-bg)";

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{ background: navBg || navBgFallback, backdropFilter: isHalflife ? undefined : "blur(20px)", borderTop: isHalflife ? "none" : "1px solid var(--nav-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around py-1.5 relative">
          {!isHalflife && activeIdx >= 0 && (
            <div className="absolute top-0 h-0.5 rounded-full transition-all duration-300 ease-out"
              style={{ background: "var(--nav-active)", width: `${100 / tabs.length}%`, left: `${(activeIdx / tabs.length) * 100}%` }} />
          )}
          {tabs.map((t) => {
            const active = path === t.href || (t.href.includes("?") && path === t.href.split("?")[0]);
            const activeColor = isHalflife ? "#2dd4a0" : "var(--nav-active)";
            const inactiveColor = isHalflife ? "#6b6b70" : "var(--nav-inactive)";
            return (
              <Link key={t.label} href={t.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 relative transition-all duration-200"
                style={{ transform: active ? "translateY(-2px)" : "translateY(0)" }}>
                <t.icon size={active ? 22 : 20} style={{ color: active ? activeColor : inactiveColor, transition: "all 0.2s ease" }} />
                <span className="font-medium transition-all duration-200"
                  style={{ color: active ? activeColor : inactiveColor, fontSize: active ? 10 : 9, opacity: active ? 1 : 0.7 }}>
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar — Julius only */}
      {!isHalflife && (
        <nav className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-[72px] md:flex-col md:items-center md:gap-1 md:py-6 md:z-40"
          style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderRight: "1px solid var(--nav-border)" }}>
          <div className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center text-lg font-bold"
            style={{ background: "var(--grad-teal)", color: "#0D1117" }}>J</div>
          {juliusTabs.map((t) => {
            const active = path === t.href;
            return (
              <Link key={t.href} href={t.href}
                className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-all duration-200 relative"
                style={{ background: active ? "rgba(126,226,184,0.08)" : "transparent", borderLeft: active ? "2px solid var(--nav-active)" : "2px solid transparent" }}>
                <t.icon size={20} style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }} />
                <span className="text-[9px] font-medium" style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }}>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
