import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import BottomNav from "@/components/BottomNav";
import ChatFAB from "@/components/ChatFAB";
import PushSetup from "@/components/PushSetup";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Julius — Longevity Dashboard",
  description: "Longevity & Sport Tracking fuer die Familie Busch",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Julius" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <head>
        <meta name="theme-color" content="#E8F0F0" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${font.className} min-h-full`}>
        <ThemeProvider>
          <UserProvider>
            <main className="max-w-lg mx-auto px-4 py-5 md:max-w-2xl md:ml-20">{children}</main>
            <BottomNav />
            <ChatFAB />
            <PushSetup />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
