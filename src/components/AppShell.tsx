"use client";

import { useState, type ReactNode } from "react";
import SplashScreen from "./SplashScreen";

export default function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      <SplashScreen onComplete={() => setReady(true)} />
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }}>
        {children}
      </div>
    </>
  );
}
