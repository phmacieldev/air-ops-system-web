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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("asd_token");
    if (!stored) {
      setIsLoading(false);
      return;
    }

    fetchProfile(stored)
      .then((profile) => {
        if (profile) {
          setToken(stored);
          setUser(profile);
        } else {
          localStorage.removeItem("asd_token");
        }
      })
      .finally(() => setIsLoading(false));
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
