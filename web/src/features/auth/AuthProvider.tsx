"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginResponse } from "@/types/api";
import {
  apiRequest,
  getToken,
  hasBackend,
  setToken,
} from "@/services/apiClient";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  /** True when a backend URL is configured (auth required). */
  backendEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const backendEnabled = hasBackend();

  // On mount, validate any stored token against /me.
  useEffect(() => {
    if (!backendEnabled) {
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest<AuthUser>("/api/v1/me")
      .then((me) => setUser(me))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [backendEnabled]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async ({ email, password, firstName, lastName }: RegisterInput) => {
      await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        },
        auth: false,
      });
      // Backend returns the user (not a token) on register; log in right after.
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, backendEnabled, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
