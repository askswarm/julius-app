"use client";

interface ScoreRingProps {
  value: number | null;
  max?: number;
  label: string;
  color: string;
  size?: number;
}

export default function ScoreRing({ value, max = 100, label, color, size = 90 }: ScoreRingProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value != null ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-700"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span
        className="absolute text-xl font-semibold"
        style={{ color: value != null ? color : "#94a3b8", marginTop: size / 2 - 14 }}
      >
        {value ?? "--"}
      </span>
      <span className="text-xs text-slate-500 mt-1">{label}</span>
    </div>
  );
}
