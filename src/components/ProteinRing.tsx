"use client";

interface Props {
  current: number;
  goal: number;
  size?: number;
  color?: string;
}

export default function ProteinRing({ current, goal, size = 100, color = "#E8893C" }: Props) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
      <div style={{ position: "relative" as const, width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#e8e8ec", lineHeight: 1 }}>{current}</div>
          <div style={{ fontSize: 11, color: "#5a5a62", marginTop: 2 }}>/ {goal}g</div>
        </div>
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#5a5a62", textTransform: "uppercase" as const, marginTop: 8 }}>Protein</div>
    </div>
  );
}
