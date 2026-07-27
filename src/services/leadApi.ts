import { Lead, LeadFilters, Activite, Tache, Devis } from "../types";

export const leadApi = {
  async getLeads(token: string, filters: LeadFilters = {}): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters.source) params.append("source", filters.source);
    if (filters.statut) params.append("statut", filters.statut);
    if (filters.priorite) params.append("priorite", filters.priorite);
    if (filters.search) params.append("search", filters.search);

    const res = await fetch(`/api/leads?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des leads.");
    }
    return data;
  },

  async getLead(token: string, id: number): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement du détail du lead.");
    }
    return data;
  },

  async createLead(token: string, leadData: Omit<Lead, "id" | "dateCreation" | "derniereActivite">): Promise<Lead> {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la création du lead.");
    }
    return data;
  },

  async updateLead(token: string, id: number, leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la mise à jour du lead.");
    }
    return data;
  },

  async deleteLead(token: string, id: number): Promise<void> {
    const res = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec de la suppression du lead.");
    }
  },

  async changeLeadStatus(token: string, id: number, status: string): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ statut: status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la modification du statut du lead.");
    }
    return data;
  },

  async assignLead(token: string, id: number, commercialId: number): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ commercialId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de l'attribution du lead.");
    }
    return data;
  },

  async getActivities(token: string, id: number): Promise<Activite[]> {
    const res = await fetch(`/api/leads/${id}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des activités du lead.");
    }
    return data;
  },

  async createActivity(token: string, id: number, type: string, description: string | null): Promise<Activite> {
    const res = await fetch(`/api/leads/${id}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de l'enregistrement de l'activité.");
    }
    return data;
  },

  async getTasks(token: string, id: number): Promise<Tache[]> {
    const res = await fetch(`/api/leads/${id}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des tâches du lead.");
    }
    return data;
  },

  async getDevis(token: string, id: number): Promise<Devis[]> {
    const res = await fetch(`/api/leads/${id}/devis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des devis du lead.");
    }
    return data;
  },
};
