import type { MetadataRoute } from "next";

// Rutas privadas o personales fuera del índice. /evento/entrada lleva datos de la orden en la URL.
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/panel", "/evento/entrada", "/entrada", "/baja", "/prueba"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
