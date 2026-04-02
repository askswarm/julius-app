"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { USERS } from "./constants";
import type { UserProfile } from "./types";

interface UserContextType {
  user: UserProfile;
  userKey: string;
  setUserKey: (key: string) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userKey, setUserKey] = useState("vincent");
  const user = USERS[userKey] || USERS.vincent;

  return (
    <UserContext.Provider value={{ user, userKey, setUserKey }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}
