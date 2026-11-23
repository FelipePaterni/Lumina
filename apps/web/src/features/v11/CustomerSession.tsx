"use client";

import { useCallback } from "react";
import { useAuthSession } from "../dashboard/DashboardSessionProvider";

export function useCustomerSession() {
  const { session, hydrated, setAuthSession } = useAuthSession();
  const token = session?.role === "CUSTOMER" ? session.token : null;
  const setToken = useCallback((nextToken: string | null) => {
    setAuthSession((current) => {
      if (nextToken) return { token: nextToken, role: "CUSTOMER" };
      return current?.role === "CUSTOMER" ? null : current;
    });
  }, [setAuthSession]);
  return { token, setToken, hydrated };
}
