import type { DashboardRole } from "./dashboard-api";

export type StaffRole = Exclude<DashboardRole, "CUSTOMER">;

export interface LoginSessions {
  customerToken: string | null;
  staffSession: { token: string; role: StaffRole } | null;
}

export function sessionsForLogin(
  token: string,
  role: DashboardRole,
): LoginSessions {
  if (role === "CUSTOMER") {
    return { customerToken: token, staffSession: null };
  }
  return { customerToken: null, staffSession: { token, role } };
}
