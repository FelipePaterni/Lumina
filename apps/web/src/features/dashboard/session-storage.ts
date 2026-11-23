import type { DashboardRole } from "./dashboard-api";

export const WEB_SESSION_KEY = "lumina.session.v1";

export interface PersistedWebSession {
  token: string;
  role: DashboardRole;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const roles = new Set<DashboardRole>(["CUSTOMER", "ADMIN", "CATALOG", "STOCK"]);

function tokenClaims(token: string): { exp?: unknown; role?: unknown } | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  try {
    const base64 = segments[1].replaceAll("-", "+").replaceAll("_", "/");
    const binary = globalThis.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as { exp?: unknown; role?: unknown };
  } catch {
    return null;
  }
}

export function parsePersistedSession(
  raw: string | null,
  nowMilliseconds = Date.now(),
): PersistedWebSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PersistedWebSession>;
    if (typeof value.token !== "string" || !value.token || !roles.has(value.role as DashboardRole)) return null;
    const claims = tokenClaims(value.token);
    if (
      !claims ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 <= nowMilliseconds ||
      claims.role !== value.role
    ) return null;
    return { token: value.token, role: value.role as DashboardRole };
  } catch {
    return null;
  }
}

export function loadPersistedSession(
  storage: KeyValueStorage,
  nowMilliseconds = Date.now(),
): PersistedWebSession | null {
  const raw = storage.getItem(WEB_SESSION_KEY);
  const session = parsePersistedSession(raw, nowMilliseconds);
  if (raw && !session) storage.removeItem(WEB_SESSION_KEY);
  return session;
}

export function savePersistedSession(
  storage: KeyValueStorage,
  session: PersistedWebSession | null,
): void {
  if (session) storage.setItem(WEB_SESSION_KEY, JSON.stringify(session));
  else storage.removeItem(WEB_SESSION_KEY);
}
