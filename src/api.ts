/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ROOT = API_URL.replace(/\/api\/?$/, "");

let accessToken = localStorage.getItem("accessToken");
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) throw new Error(body?.message || "Erreur de communication avec le serveur.");
  return (body?.data ?? body) as T;
}

export async function uploadFile<T>(path: string, formData: FormData, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "POST",
    body: formData,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) throw new Error(body?.message || "Erreur de communication avec le serveur.");
  return (body?.data ?? body) as T;
}

export async function login(email: string, motDePasse: string) {
  const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, motDePasse }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Email ou mot de passe incorrect.");
  setAccessToken(body.data.accessToken);
  return body.data.user;
}

export { API_URL };
