"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, UtensilsCrossed, Dumbbell, Moon, Pill, Settings, MessageCircle, Heart, Clock, Syringe } from "lucide-react";
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
  { href: "/", matchPath: "/", icon: Home, label: "home" },
  { href: "/supplements?tab=Protokolle", matchPath: "/supplements", matchTab: "Protokolle", icon: Syringe, label: "protocol" },
  { href: "/supplements?tab=Blutwerte", matchPath: "/supplements", matchTab: "Blutwerte", icon: Heart, label: "blood" },
  { href: "/supplements?tab=Supplements", matchPath: "/supplements", matchTab: "Supplements", icon: Clock, label: "stack" },
  { href: "/chat", matchPath: "/chat", icon: MessageCircle, label: "coach" },
];

function BottomNavInner() {
  const path = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  if (path === "/chat") return null;

  if (isHalflife) {
    // Determine active halflife tab
    let activeLabel = "";
    if (path === "/") activeLabel = "home";
    else if (path === "/supplements") {
      if (currentTab === "Blutwerte") activeLabel = "blood";
      else if (currentTab === "Supplements") activeLabel = "stack";
      else activeLabel = "protocol"; // default supplements = protocol
    }

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ background: "linear-gradient(to top, #050506 70%, transparent)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around" style={{ height: 56 }}>
          {halflifeTabs.map((t) => {
            const active = t.label === activeLabel;
            return (
              <Link key={t.label} href={t.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative transition-all duration-200">
                <t.icon size={20} strokeWidth={1.5} style={{ color: active ? "#E8893C" : "#3a3a42", transition: "color 0.2s" }} />
                <span style={{ fontSize: 9, letterSpacing: 0.3, color: active ? "#E8893C" : "#3a3a42", fontWeight: 500, transition: "color 0.2s" }}>
                  {t.label}
                </span>
                {active && <div className="absolute bottom-0 w-1 h-1 rounded-full" style={{ background: "#E8893C" }} />}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Julius nav
  const activeIdx = juliusTabs.findIndex((t) => t.href === path);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--nav-border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around py-1.5 relative">
          {activeIdx >= 0 && (
            <div className="absolute top-0 h-0.5 rounded-full transition-all duration-300 ease-out"
              style={{ background: "var(--nav-active)", width: `${100 / juliusTabs.length}%`, left: `${(activeIdx / juliusTabs.length) * 100}%` }} />
          )}
          {juliusTabs.map((t) => {
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
    </>
  );
}

export default function BottomNav() {
  return <Suspense fallback={null}><BottomNavInner /></Suspense>;
}
