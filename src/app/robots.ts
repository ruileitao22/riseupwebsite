import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/backoffice" }],
    sitemap: "https://riseupmaia.pt/sitemap.xml"
  };
}
