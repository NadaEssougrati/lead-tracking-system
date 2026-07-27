import { Entreprise } from "../types";

export const entrepriseApi = {
  async getEntreprises(token: string): Promise<Entreprise[]> {
    const res = await fetch("/api/entreprises", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des entreprises.");
    }
    return data;
  },

  async getEntreprise(token: string, id: number): Promise<Entreprise> {
    const res = await fetch(`/api/entreprises/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement du détail de l'entreprise.");
    }
    return data;
  },

  async createEntreprise(token: string, entrepriseData: Omit<Entreprise, "id">): Promise<Entreprise> {
    const res = await fetch("/api/entreprises", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entrepriseData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la création de l'entreprise.");
    }
    return data;
  },

  async updateEntreprise(token: string, id: number, entrepriseData: Partial<Entreprise>): Promise<Entreprise> {
    const res = await fetch(`/api/entreprises/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entrepriseData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la mise à jour de l'entreprise.");
    }
    return data;
  },

  async deleteEntreprise(token: string, id: number): Promise<void> {
    const res = await fetch(`/api/entreprises/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec de la suppression de l'entreprise.");
    }
  },
};
