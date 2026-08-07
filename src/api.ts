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

export async function sendEmail(data: { leadId: string; expediteurId?: string; sujet: string; corps: string; emailId?: number }) {
  return api<{ success: boolean; data: { messageId: string; emailId: number; activiteId: string; to: string; subject: string } }>("/emails/send", { method: "POST", body: JSON.stringify(data) });
}

export async function saveDraft(data: { leadId: string; expediteurId?: string; sujet: string; corps: string; emailId?: number }) {
  return api<{ success: boolean; data: any }>("/emails/draft", { method: "POST", body: JSON.stringify(data) });
}

export async function getEmailLeads() {
  return api<{ success: boolean; data: Array<{ id: string; nom: string; prenom: string; email: string; societe: string }> }>("/emails/leads");
}

export async function getEmails(params?: { statut?: string; leadId?: string; priorite?: string; etat?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.statut) qs.set("statut", params.statut);
  if (params?.leadId) qs.set("leadId", params.leadId);
  if (params?.priorite) qs.set("priorite", params.priorite);
  if (params?.etat) qs.set("etat", params.etat);
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return api<{ success: boolean; data: any[] }>(`/emails${query ? `?${query}` : ""}`);
}

export async function updateDraft(emailId: number, data: { sujet?: string; corps?: string }) {
  return api<{ success: boolean; data: any }>(`/emails/${emailId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteEmail(emailId: number) {
  return api<{ success: boolean; data: { id: number } }>(`/emails/${emailId}`, { method: "DELETE" });
}

export async function getEmailConfig() {
  return api<{ gmailUser: string; hasPassword: boolean }>("/emails/config");
}

export async function saveEmailConfig(data: { gmailUser: string; gmailPass: string }) {
  const response = await fetch(`${API_URL}/emails/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Erreur de communication avec le serveur.");
  return body as { success: boolean; message?: string; data: { gmailUser: string; hasPassword: boolean } };
}

export async function testEmailConfig() {
  return api<{ success: boolean; message?: string }>("/emails/test-smtp", { method: "POST", body: JSON.stringify({}) });
}

export { API_URL };
