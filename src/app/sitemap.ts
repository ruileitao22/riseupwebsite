import type { MetadataRoute } from "next";
import { pages } from "@/generated/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicSlugs = Object.keys(pages).filter((slug) => slug !== "backoffice");
  return publicSlugs
    .map((slug) => ({
      url: `https://riseupmaia.pt${slug === "home" ? "" : `/${slug}`}`,
      lastModified: new Date(),
      changeFrequency: slug === "home" || slug === "projetos" ? "weekly" : "monthly",
      priority: slug === "home" ? 1 : 0.8
    }));
}
