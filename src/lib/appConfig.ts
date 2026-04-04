export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "julius";
export const isHalflife = APP_MODE === "halflife";
export const isJulius = APP_MODE === "julius" || APP_MODE === "";
export const appName = isHalflife ? "halflife" : "Julius";
export const appTagline = isHalflife ? "your protocol, optimized" : "Your Protocol Coach";
export const appAccentColor = isHalflife ? "#E8893C" : "#2dd4a0";
