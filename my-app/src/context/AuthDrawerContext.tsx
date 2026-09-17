import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { AuthDrawer } from "@/components/auth/AuthDrawer";
import type { UserRole } from "@/types/user";
import { markPostLogoutRedirect } from "@/lib/authStorage";

export type AuthDrawerMode = "login" | "signup";

export type AuthDrawerOptions = {
  from?: string;
  defaultRole?: UserRole;
  feedState?: unknown;
};

type AuthDrawerContextValue = {
  isOpen: boolean;
  mode: AuthDrawerMode;
  options: AuthDrawerOptions;
  openAuthDrawer: (mode: AuthDrawerMode, opts?: AuthDrawerOptions) => void;
  closeAuthDrawer: () => void;
  setMode: (mode: AuthDrawerMode) => void;
};

const AuthDrawerContext = createContext<AuthDrawerContextValue | null>(null);

const emptyOptions: AuthDrawerOptions = {};

export function AuthDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setModeState] = useState<AuthDrawerMode>("login");
  const [options, setOptions] = useState<AuthDrawerOptions>(emptyOptions);

  const openAuthDrawer = useCallback((nextMode: AuthDrawerMode, opts?: AuthDrawerOptions) => {
    setModeState(nextMode);
    setOptions(opts ?? emptyOptions);
    setIsOpen(true);
  }, []);

  const closeAuthDrawer = useCallback(() => {
    setIsOpen(false);
    setOptions(emptyOptions);
  }, []);

  const setMode = useCallback((nextMode: AuthDrawerMode) => {
    setModeState(nextMode);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      options,
      openAuthDrawer,
      closeAuthDrawer,
      setMode,
    }),
    [isOpen, mode, options, openAuthDrawer, closeAuthDrawer, setMode]
  );

  return (
    <AuthDrawerContext.Provider value={value}>
      {children}
      <AuthDrawer />
    </AuthDrawerContext.Provider>
  );
}

export function useAuthDrawer(): AuthDrawerContextValue {
  const ctx = useContext(AuthDrawerContext);
  if (!ctx) throw new Error("useAuthDrawer must be used within AuthDrawerProvider");
  return ctx;
}

/** Clears session and returns to the public marketing page. */
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { closeAuthDrawer, isOpen } = useAuthDrawer();

  return useCallback(() => {
    markPostLogoutRedirect();
    if (isOpen) closeAuthDrawer();
    logout();
    queryClient.clear();
    navigate("/", { replace: true });
  }, [logout, queryClient, closeAuthDrawer, isOpen, navigate]);
}
