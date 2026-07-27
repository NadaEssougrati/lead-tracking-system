import { NewUserFormState, EditUserFormState, UserProfile, ActivityLog } from "../types";

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
