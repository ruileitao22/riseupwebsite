import type { Metadata } from "next";
import { PageContent } from "@/components/page-content";
import { buildMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildMetadata("home");

export default function HomePage() {
  return <PageContent slug="home" />;
}
