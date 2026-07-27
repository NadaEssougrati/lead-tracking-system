import { Tache } from "../types";

export const tacheApi = {
  async getMyTasks(token: string): Promise<Tache[]> {
    const res = await fetch("/api/tasks/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement de mes tâches.");
    }
    return data;
  },

  async createTask(token: string, taskData: { titre: string; description: string | null; statut: string; dateEcheance: string; leadId: number; utilisateurId?: number }): Promise<Tache> {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la création de la tâche.");
    }
    return data;
  },

  async updateTask(token: string, id: number, taskData: Partial<Tache>): Promise<Tache> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la mise à jour de la tâche.");
    }
    return data;
  },

  async deleteTask(token: string, id: number): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec de la suppression de la tâche.");
    }
  },
};
