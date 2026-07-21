import { 
  LoginFormState, 
  RegisterFormState, 
  NewUserFormState, 
  EditUserFormState, 
  UserProfile, 
  ActivityLog 
} from "../types";

export const authApi = {
  async me(token: string): Promise<UserProfile> {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Invalid or expired session");
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

export const adminApi = {
  async getUsers(token: string): Promise<UserProfile[]> {
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement de la liste des utilisateurs.");
    }
    return data;
  },

  async getLogs(token: string): Promise<ActivityLog[]> {
    const res = await fetch("/api/admin/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement du journal d'activité.");
    }
    return data;
  },

  async createUser(token: string, newUser: NewUserFormState): Promise<UserProfile> {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la création de l'utilisateur.");
    }
    return data;
  },

  async updateUser(token: string, userId: number, updateData: Partial<EditUserFormState>): Promise<UserProfile> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la mise à jour de l'utilisateur.");
    }
    return data;
  },

  async deleteUser(token: string, userId: number): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec de la suppression de l'utilisateur.");
    }
  },
};
