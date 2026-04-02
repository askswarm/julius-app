import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Julius — Longevity Dashboard",
  description: "Longevity & Sport Tracking fuer die Familie Busch",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Julius",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#3B82F6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} min-h-full`}>
        <UserProvider>
          <main className="max-w-lg mx-auto px-4 py-4 md:max-w-2xl md:ml-24">{children}</main>
          <BottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
