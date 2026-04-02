import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
