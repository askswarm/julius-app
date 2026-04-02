"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, Dumbbell, Moon, Pill, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/ernaehrung", icon: Utensils, label: "Essen" },
  { href: "/training", icon: Dumbbell, label: "Training" },
  { href: "/schlaf", icon: Moon, label: "Schlaf" },
  { href: "/supplements", icon: Pill, label: "Supps" },
  { href: "/profil", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 md:hidden">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  active ? "text-blue-500" : "text-slate-400"
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-20 md:flex-col md:items-center md:gap-2 md:py-6 md:bg-white md:dark:bg-slate-900 md:border-r md:border-slate-200 md:dark:border-slate-700 md:z-50">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs ${
                active
                  ? "text-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
