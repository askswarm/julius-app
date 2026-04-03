"use client";

interface ScoreRingProps {
  value: number | null;
  max?: number;
  label: string;
  color: string;
  size?: number;
}

export default function ScoreRing({ value, max = 100, label, color, size = 96 }: ScoreRingProps) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = value != null ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);
  const id = `glow-${label.replace(/\s/g, "")}`;

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={id}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-bg)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          filter={value != null ? `url(#${id})` : undefined}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
      </svg>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[36px] font-bold tracking-tight"
        style={{ color: value != null ? color : "var(--text3)", marginTop: -8 }}>
        {value ?? "—"}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>{label}</span>
    </div>
  );
}
