import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContent } from "@/components/page-content";
import { buildMetadata } from "@/lib/page-metadata";
import { pages, type PageSlug } from "@/generated/pages";

type PageProps = { params: Promise<{ slug: string }> };

function isPageSlug(value: string): value is Exclude<PageSlug, "home"> {
  return value !== "home" && value in pages;
}

export function generateStaticParams() {
  return Object.keys(pages).filter((slug) => slug !== "home").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return isPageSlug(slug) ? buildMetadata(slug) : {};
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  return <PageContent slug={slug} />;
}
