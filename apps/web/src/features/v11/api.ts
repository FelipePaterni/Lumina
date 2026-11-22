import { API_URL } from "../auth/services/auth-api";

export async function apiRequest<T>(
  path: string,
  options: {
    token?: string;
    method?: string;
    body?: unknown;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result && typeof result.message === "string"
        ? result.message
        : "Não foi possível concluir a solicitação.";
    throw new Error(message);
  }
  return result as T;
}

export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const displayDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
