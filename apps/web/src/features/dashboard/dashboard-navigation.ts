import type { DashboardRole, DashboardSection } from "./dashboard-api";

export const dashboardSectionRoutes: Record<DashboardSection, string> = {
  admin: "/dashboard",
  catalog: "/catalog/dashboard",
  warehouse: "/warehouse/dashboard",
  operations: "/operations/dashboard",
};

export const dashboardSectionsForRole: Record<Exclude<DashboardRole, "CUSTOMER">, DashboardSection[]> = {
  ADMIN: ["admin", "catalog", "warehouse", "operations"],
  CATALOG: ["catalog"],
  STOCK: ["warehouse"],
};

export function landingRouteForRole(role: Exclude<DashboardRole, "CUSTOMER">): string {
  return dashboardSectionRoutes[dashboardSectionsForRole[role][0]];
}
