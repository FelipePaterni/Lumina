import { API_URL } from "../auth/services/auth-api";

export type FulfillmentStatus = "PENDING" | "PICKING" | "SHIPPED" | "DELIVERED" | "NOT_REQUIRED" | "CANCELLED";

export interface WarehouseSummary {
  orders: { pending: number; picking: number; shipped: number; delivered: number };
  inventory: { editionCount: number; totalUnits: number; outOfStockCount: number };
  alerts: Array<{ editionId: string; workTitle: string; physicalStock: number | null; type: "OUT_OF_STOCK" | "INVENTORY_NOT_CONFIGURED" }>;
}

export interface WarehouseOrder {
  id: string;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    postalCode: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
  } | null;
  items: Array<{ workTitle: string; quantity: number; releaseAt: string }>;
  trackingCode: string | null;
}

export interface WarehouseOrderPage {
  items: WarehouseOrder[];
  page: number;
  limit: number;
  total: number;
}

async function warehouseRequest<T>(token: string, path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.message === "string" ? result.message : "Não foi possível carregar a operação de estoque");
  }
  return result as T;
}

export const getWarehouseSummary = (token: string) =>
  warehouseRequest<WarehouseSummary>(token, "/admin/warehouse/summary");

export const getWarehouseOrders = (token: string, page: number) =>
  warehouseRequest<WarehouseOrderPage>(token, `/admin/logistics/orders?page=${page}&limit=10`);

export const updateWarehouseOrder = (token: string, orderId: string, status: "PICKING" | "SHIPPED" | "DELIVERED", trackingCode?: string) =>
  warehouseRequest(token, `/admin/logistics/orders/${encodeURIComponent(orderId)}/status`, "POST", { status, trackingCode });
