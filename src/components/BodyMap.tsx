"use client";

const SITES = [
  { id: "abdomen_left", label: "Bauch L", cx: 42, cy: 90, color: "#7EE2B8" },
  { id: "abdomen_right", label: "Bauch R", cx: 58, cy: 90, color: "#79C0FF" },
  { id: "thigh_left", label: "Oberschenkel L", cx: 40, cy: 140, color: "#F97316" },
  { id: "thigh_right", label: "Oberschenkel R", cx: 60, cy: 140, color: "#FBBF24" },
  { id: "deltoid_left", label: "Deltoid L", cx: 28, cy: 55, color: "#A78BFA" },
  { id: "deltoid_right", label: "Deltoid R", cx: 72, cy: 55, color: "#F472B6" },
];

interface Props {
  selectedSite: string | null;
  lastSite?: string | null;
  recommendedSite?: string | null;
  onSelect: (site: string) => void;
}

export const SITE_COLORS: Record<string, string> = Object.fromEntries(SITES.map((s) => [s.id, s.color]));
export const SITE_LABELS: Record<string, string> = Object.fromEntries(SITES.map((s) => [s.id, s.label]));

export function getRecommendedSite(lastSites: string[]): string {
  const ids = SITES.map((s) => s.id);
  for (const id of ids) {
    if (!lastSites.slice(0, ids.length - 1).includes(id)) return id;
  }
  return ids[0];
}

export default function BodyMap({ selectedSite, lastSite, recommendedSite, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 200" className="w-40 h-56">
        {/* Head */}
        <circle cx="50" cy="18" r="10" fill="none" stroke="var(--text3)" strokeWidth="1" />
        {/* Neck */}
        <rect x="46" y="28" width="8" height="6" fill="none" stroke="var(--text3)" strokeWidth="0.8" />
        {/* Torso */}
        <path d="M32 38 L32 100 L68 100 L68 38 Q60 34 50 34 Q40 34 32 38" fill="none" stroke="var(--text3)" strokeWidth="1" />
        {/* Arms */}
        <path d="M32 42 L22 80" fill="none" stroke="var(--text3)" strokeWidth="1" />
        <path d="M68 42 L78 80" fill="none" stroke="var(--text3)" strokeWidth="1" />
        {/* Legs */}
        <path d="M38 100 L36 170" fill="none" stroke="var(--text3)" strokeWidth="1" />
        <path d="M62 100 L64 170" fill="none" stroke="var(--text3)" strokeWidth="1" />

        {/* Injection sites */}
        {SITES.map((site) => {
          const isSelected = selectedSite === site.id;
          const isLast = lastSite === site.id;
          const isRec = recommendedSite === site.id;

          return (
            <g key={site.id} onClick={() => onSelect(site.id)} style={{ cursor: "pointer" }}>
              {isRec && !isSelected && (
                <circle cx={site.cx} cy={site.cy} r="10" fill="none" stroke={site.color} strokeWidth="1.5" opacity="0.5">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={site.cx} cy={site.cy} r="7"
                fill={isSelected ? site.color : isLast ? "#F59E0B" : "var(--bar-bg)"}
                stroke={isSelected ? site.color : isLast ? "#F59E0B" : "var(--text3)"}
                strokeWidth={isSelected ? "2" : "1"} opacity={isSelected ? 1 : 0.7} />
              {isLast && !isSelected && (
                <text x={site.cx} y={site.cy + 3} textAnchor="middle" fill="#F59E0B" fontSize="5" fontWeight="bold">!</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {SITES.map((site) => (
          <button key={site.id} onClick={() => onSelect(site.id)}
            className="text-[10px] px-2 py-1 rounded-full transition-all"
            style={{
              background: selectedSite === site.id ? site.color + "20" : "var(--subtle-bg)",
              color: selectedSite === site.id ? site.color : "var(--text3)",
              border: `1px solid ${selectedSite === site.id ? site.color : "var(--card-border)"}`,
            }}>
            {site.label}
          </button>
        ))}
      </div>

      {recommendedSite && selectedSite !== recommendedSite && (
        <p className="text-[10px] mt-2" style={{ color: "var(--accent)" }}>
          Empfohlen: {SITE_LABELS[recommendedSite]}
        </p>
      )}
    </div>
  );
}
