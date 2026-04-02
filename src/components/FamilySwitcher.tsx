"use client";

import { useUser } from "@/lib/UserContext";

export default function FamilySwitcher() {
  const { userKey, setUserKey } = useUser();

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
      {(["vincent", "maria"] as const).map((key) => (
        <button
          key={key}
          onClick={() => setUserKey(key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            userKey === key
              ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {key === "vincent" ? "Vincent" : "Maria"}
        </button>
      ))}
    </div>
  );
}
