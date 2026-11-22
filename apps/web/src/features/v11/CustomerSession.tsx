"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface CustomerSessionValue {
  token: string | null;
  setToken: (token: string | null) => void;
}
const CustomerSession = createContext<CustomerSessionValue | null>(null);

export function CustomerSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const value = useMemo(() => ({ token, setToken }), [token]);
  return (
    <CustomerSession.Provider value={value}>
      {children}
    </CustomerSession.Provider>
  );
}

export function useCustomerSession() {
  const value = useContext(CustomerSession);
  if (!value) throw new Error("CustomerSessionProvider ausente.");
  return value;
}
