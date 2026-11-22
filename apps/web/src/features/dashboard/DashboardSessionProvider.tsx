"use client";

import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";
import { DashboardRole } from "./dashboard-api";

export interface DashboardSession {
  token: string;
  role: Exclude<DashboardRole, "CUSTOMER">;
}

interface DashboardSessionContextValue {
  session: DashboardSession | null;
  setSession: Dispatch<SetStateAction<DashboardSession | null>>;
}

const DashboardSessionContext = createContext<DashboardSessionContextValue | null>(null);

export function DashboardSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const [session, setSession] = useState<DashboardSession | null>(null);

  return (
    <DashboardSessionContext.Provider value={{ session, setSession }}>
      {children}
    </DashboardSessionContext.Provider>
  );
}

export function useDashboardSession(): DashboardSessionContextValue {
  const context = useContext(DashboardSessionContext);
  if (!context) {
    throw new Error("DashboardSessionProvider ausente.");
  }
  return context;
}
