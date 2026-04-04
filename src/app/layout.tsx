import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import BottomNav from "@/components/BottomNav";
import HalflifeNav from "@/components/HalflifeNav";
import ChatFAB from "@/components/ChatFAB";
import PushSetup from "@/components/PushSetup";
import AppShell from "@/components/AppShell";
import { isHalflife } from "@/lib/appConfig";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: isHalflife ? "halflife — your protocol, optimized" : "Julius — Longevity Dashboard",
  description: isHalflife ? "TRT, Peptide & Supplement Protocol Tracker" : "Longevity & Sport Tracking fuer die Familie Busch",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: isHalflife ? "halflife" : "Julius" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full" data-theme={isHalflife ? "dark" : undefined}>
      <head>
        <meta name="theme-color" content={isHalflife ? "#0a0a0c" : "#E8F0F0"} />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${font.className} min-h-full${isHalflife ? " halflife-mode" : ""}`}>
        <ThemeProvider>
          <UserProvider>
            <AppShell>
              <main className={`max-w-lg mx-auto px-4 py-5 md:max-w-2xl ${isHalflife ? "" : "md:ml-20"}`} style={isHalflife ? { paddingBottom: 90 } : undefined}>{children}</main>
              {isHalflife ? <HalflifeNav /> : <BottomNav />}
              {!isHalflife && <ChatFAB />}
              <PushSetup />
            </AppShell>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
