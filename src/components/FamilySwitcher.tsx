"use client";

import { useUser } from "@/lib/UserContext";

export default function FamilySwitcher() {
  const { userKey, setUserKey } = useUser();
  return (
    <div className="flex rounded-full p-1" style={{ background: "var(--subtle-bg)" }}>
      {(["vincent", "maria"] as const).map((key) => (
        <button key={key} onClick={() => setUserKey(key)}
          className="px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
          style={{
            background: userKey === key ? "var(--grad-teal)" : "transparent",
            color: userKey === key ? "#0D1117" : "var(--text3)",
          }}>
          {key === "vincent" ? "Vincent" : "Maria"}
        </button>
      ))}
    </div>
  );
}
