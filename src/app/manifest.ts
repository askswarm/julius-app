import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Julius",
    short_name: "Julius",
    description: "Longevity Coach fuer die ganze Familie",
    start_url: "/",
    display: "standalone",
    background_color: "#F0F7FF",
    theme_color: "#3B82F6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
