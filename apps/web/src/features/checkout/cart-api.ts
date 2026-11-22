import { API_URL, loginRequest } from "../auth/services/auth-api";

export { loginRequest };

export interface CartView {
  items: Array<{
    editionId: string;
    workTitle: string;
    format: "PHYSICAL" | "DIGITAL";
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    unitPriceAmount: string;
    lineTotalAmount: string;
  }>;
  bundles: Array<{
    bundleId: string;
    name: string;
    available: boolean;
    items: Array<{
      workId: string;
      title: string;
      editionId: string | null;
      releaseAt: string;
      preorderStatus: string;
    }>;
    listPriceCents: number;
    ownershipAdjustmentCents: number;
    priceCents: number;
  }>;
  coupon: { code: string; discountCents: number } | null;
  couponError: string | null;
  subtotalCents: number;
  subtotalAmount: string;
  discountCents: number;
  discountAmount: string;
  shippingCents: number;
  shippingAmount: string;
  totalCents: number;
  totalAmount: string;
}

async function cartRequest<T>(
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
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
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : "Não foi possível atualizar o carrinho",
    );
  }
  return result as T;
}

export const getCart = (token: string) => cartRequest<CartView>(token, "/cart");
export const addCartItem = (token: string, editionId: string, quantity = 1) =>
  cartRequest<CartView>(token, "/cart/items", "POST", { editionId, quantity });
export const removeCartItem = (token: string, editionId: string) =>
  cartRequest<CartView>(
    token,
    `/cart/items/${encodeURIComponent(editionId)}`,
    "DELETE",
  );
export const applyCartCoupon = (token: string, code: string) =>
  cartRequest<CartView>(token, "/cart/coupon", "POST", { code });
export const removeCartCoupon = (token: string) =>
  cartRequest<CartView>(token, "/cart/coupon", "DELETE");
export const quoteCartShipping = (
  token: string,
  address: Record<string, string>,
) =>
  cartRequest<{
    shippingAmount: string;
    totalAmount: string;
    physicalQuantity: number;
  }>(token, "/cart/shipping-quote", "POST", { address });
