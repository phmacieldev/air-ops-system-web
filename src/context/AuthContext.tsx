"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch { return null; }
}

async function refreshToken(current: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${current}` },
    });
    if (!res.ok) return null;
    const { token } = await res.json();
    return token;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount, auto-refresh if token expires within 2h
  useEffect(() => {
    const stored = localStorage.getItem("asd_token");
    if (!stored) { setIsLoading(false); return; }

    (async () => {
      let active = stored;
      const expiry = getTokenExpiry(stored);
      if (expiry && expiry - Date.now() < 2 * 60 * 60 * 1000) {
        const refreshed = await refreshToken(stored);
        if (refreshed) {
          localStorage.setItem("asd_token", refreshed);
          active = refreshed;
        }
      }

      const profile = await fetchProfile(active);
      if (profile) {
        setToken(active);
        setUser(profile);
      } else {
        localStorage.removeItem("asd_token");
      }
      setIsLoading(false);
    })();
  }, []);

  // Force logout when api.ts detects an unrecoverable 401
  useEffect(() => {
    function onUnauthorized() {
      localStorage.removeItem("asd_token");
      setToken(null);
      setUser(null);
      window.location.href = "/login";
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  async function login(newToken: string) {
    localStorage.setItem("asd_token", newToken);
    const profile = await fetchProfile(newToken);
    if (!profile) {
      localStorage.removeItem("asd_token");
      throw new Error("Não foi possível carregar o perfil do usuário.");
    }
    setToken(newToken);
    setUser(profile);
  }

  function logout() {
    localStorage.removeItem("asd_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
