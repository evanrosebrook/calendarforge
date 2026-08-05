import { absoluteSiteUrl } from "./site-url";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function breadcrumbList(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path),
    })),
  };
}
