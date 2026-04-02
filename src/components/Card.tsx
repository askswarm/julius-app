import type { ReactNode } from "react";

export default function Card({ children, className = "", glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`rounded-[20px] px-6 py-5 transition-all duration-300 hover:scale-[1.005] ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
        ...(glow ? { boxShadow: "var(--glow)" } : {}),
      }}>
      {children}
    </div>
  );
}
