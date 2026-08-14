import { LegacyPage } from "@/components/legacy-page";
import { pages, type PageSlug } from "@/generated/pages";

export function PageContent({ slug }: { slug: PageSlug }) {
  const page = pages[slug];
  const withData = slug === "equipa" || slug === "projetos" || slug === "riseuplegends";
  return (
    <>
      {page.structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.structuredData }} />
      ) : null}
      <LegacyPage body={page.body} bodyPage={page.bodyPage} kind={slug === "backoffice" ? "backoffice" : "public"} withData={withData} />
    </>
  );
}
