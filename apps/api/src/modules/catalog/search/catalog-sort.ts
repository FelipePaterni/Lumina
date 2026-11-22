export const catalogSortOptions = ["BEST_SELLING", "TOP_RATED"] as const;

export type CatalogSort = (typeof catalogSortOptions)[number];

export function isCatalogSort(value: string): value is CatalogSort {
  return catalogSortOptions.includes(value as CatalogSort);
}
