import type { Metadata } from "next";
import { pages, type PageSlug } from "@/generated/pages";

export function buildMetadata(slug: PageSlug): Metadata {
  const page = pages[slug];
  const path = slug === "home" ? "/" : `/${slug}`;
  const isBackoffice = slug === "backoffice";
  return {
    title: page.title,
    description: page.description || undefined,
    robots: isBackoffice ? { index: false, follow: false } : { index: true, follow: true },
    alternates: isBackoffice ? undefined : { canonical: path, languages: { "pt-PT": path, "x-default": path } },
    openGraph: isBackoffice ? undefined : {
      type: "website",
      locale: "pt_PT",
      siteName: "Rise Up",
      title: page.title,
      description: page.description,
      url: path,
      images: [{ url: "/img/seo-share.png", width: 1200, height: 630, alt: "Logótipo Rise Up" }]
    },
    twitter: isBackoffice ? undefined : {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/img/seo-share.png"]
    }
  };
}
