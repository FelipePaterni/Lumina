"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DashboardRole } from "./dashboard-api";
import {
  loadPersistedSession,
  savePersistedSession,
} from "./session-storage";

export interface DashboardSession {
  token: string;
  role: Exclude<DashboardRole, "CUSTOMER">;
}
type WebAuthSession = { token: string; role: "CUSTOMER" } | DashboardSession;

interface SessionContextValue {
  session: WebAuthSession | null;
  hydrated: boolean;
  setAuthSession: Dispatch<SetStateAction<WebAuthSession | null>>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function DashboardSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const [session, setSessionState] = useState<WebAuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef<WebAuthSession | null>(null);

  useEffect(() => {
    try {
      const restored = loadPersistedSession(window.sessionStorage);
      const validRestored = restored as WebAuthSession | null;
      sessionRef.current = validRestored;
      setSessionState(validRestored);
    } catch {
      sessionRef.current = null;
      setSessionState(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setAuthSession = useCallback<SessionContextValue["setAuthSession"]>((update) => {
    const next = typeof update === "function" ? update(sessionRef.current) : update;
    sessionRef.current = next;
    setSessionState(next);
    try {
      savePersistedSession(window.sessionStorage, next);
    } catch {
      // Keep the in-memory session usable when browser storage is unavailable.
    }
  }, []);

  return (
    <SessionContext.Provider value={{ session, hydrated, setAuthSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAuthSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("DashboardSessionProvider ausente.");
  return context;
}

export function useDashboardSession(): {
  session: DashboardSession | null;
  hydrated: boolean;
  setSession: Dispatch<SetStateAction<DashboardSession | null>>;
} {
  const { session, hydrated, setAuthSession } = useAuthSession();
  const staffSession = session && session.role !== "CUSTOMER" ? session : null;
  const setSession = useCallback<Dispatch<SetStateAction<DashboardSession | null>>>(
    (update) => {
      setAuthSession((current) => {
        const currentStaff = current && current.role !== "CUSTOMER" ? current : null;
        const next = typeof update === "function" ? update(currentStaff) : update;
        return next ?? (current?.role === "CUSTOMER" ? current : null);
      });
    },
    [setAuthSession],
  );
  return { session: staffSession, hydrated, setSession };
}
