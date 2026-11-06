import type { MetadataRoute } from "next";
import { RUTAS } from "@/lib/rutas";

// Solo /evento por ahora: el inicio (/) no se indexa hasta el 25/11 (DECISIONES.md D17).
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [{ url: `${site}${RUTAS.evento}`, changeFrequency: "daily", priority: 1 }];
}
