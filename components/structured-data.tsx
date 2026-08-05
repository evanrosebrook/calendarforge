import { breadcrumbList, type BreadcrumbItem } from "@/lib/seo";

export function BreadcrumbStructuredData({ items }: { items: readonly BreadcrumbItem[] }) {
  const json = JSON.stringify(breadcrumbList(items)).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
