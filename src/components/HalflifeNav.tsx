"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "home", d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { href: "/protocol", label: "protocol", d: "M12 2v20M2 12h20", extra: <circle cx="12" cy="12" r="3" /> },
  { href: "/blood", label: "blood", d: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/stack", label: "stack", d: "M12 6v6l4 2", extra: <circle cx="12" cy="12" r="10" /> },
];

export default function HalflifeNav() {
  const path = usePathname();
  if (path === "/coach") return null;

  const coachActive = path.startsWith("/coach");

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 72, paddingBottom: "env(safe-area-inset-bottom, 0px)",
      background: "#050506", display: "flex", justifyContent: "space-around", alignItems: "center",
    }}>
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.label} href={t.href} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: active ? "#E8893C" : "#3a3a42", textDecoration: "none", transition: "color 0.2s",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.d} />{t.extra}
            </svg>
            <span style={{ fontSize: 9, letterSpacing: 0.5, fontWeight: 500 }}>{t.label}</span>
          </Link>
        );
      })}
      {/* Prominent Coach FAB */}
      <Link href="/coach" style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        textDecoration: "none", transform: "translateY(-4px)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "#E8893C",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(232,137,60,0.3)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050506" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <span style={{ fontSize: 9, letterSpacing: 0.5, fontWeight: 500, color: "#E8893C", opacity: coachActive ? 1 : 0.9 }}>coach</span>
      </Link>
    </nav>
  );
}
