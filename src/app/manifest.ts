import type { MetadataRoute } from "next";
import { isHalflife, appName } from "@/lib/appConfig";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: isHalflife ? "halflife" : "Julius",
    short_name: isHalflife ? "halflife" : "Julius",
    description: isHalflife ? "your protocol, optimized" : "Longevity Coach fuer die ganze Familie",
    start_url: "/",
    display: "standalone",
    background_color: isHalflife ? "#0a0a0c" : "#E8F0F0",
    theme_color: isHalflife ? "#0a0a0c" : "#3B82F6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
