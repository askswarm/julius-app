interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  gradient: string;
  unit?: string;
}

export default function MacroBar({ label, current, target, gradient, unit = "g" }: MacroBarProps) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[1px] w-14" style={{ color: "var(--text2)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: gradient, transition: "width 1s ease-out" }} />
      </div>
      <span className="text-xs font-medium w-20 text-right" style={{ color: "var(--text2)" }}>
        {current}/{target}{unit}
      </span>
    </div>
  );
}
