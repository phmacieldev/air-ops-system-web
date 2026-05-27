const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("asd_token");
}

// Deduplicates concurrent refresh attempts
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const { token: newToken } = await res.json();
    localStorage.setItem("asd_token", newToken);
    return newToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
    const newToken = await refreshing;
    if (newToken) {
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      if (retry.ok) {
        if (retry.status === 204) return undefined as T;
        return retry.json();
      }
    }
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:unauthorized"));
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Erro desconhecido");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
