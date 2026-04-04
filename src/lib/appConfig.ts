export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "julius";
export const isHalflife = APP_MODE === "halflife";
export const isJulius = APP_MODE !== "halflife";
export const appName = isHalflife ? "halflife" : "Julius";
export const appTagline = isHalflife ? "your protocol, optimized" : "Your Protocol Coach";
export const appAccent = isHalflife ? "#E8893C" : "#10b981";
export const appAccentColor = appAccent;

export const halflifeTheme = {
  bg: "#050506",
  card: "#0c0c0f",
  cardHover: "#111114",
  border: "#1a1a1e",
  text: "#e8e8ec",
  text2: "#a0a0a8",
  text3: "#5a5a62",
  text4: "#3a3a42",
  accent: "#E8893C",
  accentDim: "rgba(232,137,60,0.10)",
  accentBorder: "rgba(232,137,60,0.20)",
  success: "#34d399",
  warning: "#E8893C",
  danger: "#e05050",
};
