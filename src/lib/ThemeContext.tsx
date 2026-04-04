"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isHalflife } from "./appConfig";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (isHalflife) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }
    const saved = localStorage.getItem("julius-theme") as "light" | "dark" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    if (isHalflife) return; // locked to dark
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("julius-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
