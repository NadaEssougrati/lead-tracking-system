import { LoginFormState, RegisterFormState, UserProfile } from "../types";

export const authApi = {
  async me(token: string): Promise<UserProfile> {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Session invalide ou expirée");
    }
    const data = await res.json();
    return data.user;
  },

  async login(credentials: LoginFormState): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
    return data;
  },

  async register(data: RegisterFormState): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Échec de l'inscription.");
    }
    return result;
  },

  async logout(token: string): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Logout report failed", e);
    }
  },
};
