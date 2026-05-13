import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PetCura",
    short_name: "PetCura",
    description: "Chat with your clinic, manage your pet's care, and request services.",
    start_url: "/o",
    scope: "/o",
    id: "/o",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f4ef",
    theme_color: "#4a6b3f",
    lang: "en",
    icons: [
      { src: "/icons/owner-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/owner-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/owner-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    categories: ["medical", "lifestyle"]
  };
}
