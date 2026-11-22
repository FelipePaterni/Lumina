import { API_URL } from "../auth/services/auth-api";

export type DashboardRole = "ADMIN" | "CATALOG" | "STOCK" | "CUSTOMER";
export type DashboardSection = "admin" | "catalog" | "warehouse";

export interface AdminDashboard {
  netSalesCents: number;
  activeCustomers: number;
  confirmedOrders: number;
  bestsellers: Array<{ workId: string; workTitle: string; netUnits: number }>;
}

export interface CatalogDashboard {
  licenses: {
    digitalEditionCount: number;
    allocated: number;
    finiteLimit: number;
    finiteAllocated: number;
    finiteAvailable: number;
    unlimitedEditionCount: number;
    exhausted: Array<{
      editionId: string;
      workTitle: string;
      allocated: number;
      limit: number;
    }>;
  };
  coupons: {
    availableCount: number;
    usageCount: number;
    quota: number;
    remainingUses: number;
  };
}

export interface WarehouseDashboard {
  orders: { pending: number; picking: number; shipped: number; delivered: number };
  inventory: { editionCount: number; totalUnits: number; outOfStockCount: number };
  alerts: Array<{
    editionId: string;
    workTitle: string;
    physicalStock: number | null;
    type: "OUT_OF_STOCK" | "INVENTORY_NOT_CONFIGURED";
  }>;
}

const dashboardPaths: Record<DashboardSection, string> = {
  admin: "/admin/dashboard",
  catalog: "/catalog/dashboard",
  warehouse: "/warehouse/dashboard",
};

export async function getDashboard<T>(
  token: string,
  section: DashboardSection,
): Promise<T> {
  const response = await fetch(`${API_URL}${dashboardPaths[section]}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : "Não foi possível carregar o painel.",
    );
  }
  return result as T;
}
