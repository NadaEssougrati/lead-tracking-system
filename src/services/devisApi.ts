import { Devis } from "../types";

export const devisApi = {
  async createDevis(token: string, devisData: { reference: string; montant: number; statut: string; leadId: number }): Promise<Devis> {
    const res = await fetch("/api/devis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(devisData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la création du devis.");
    }
    return data;
  },

  async changeDevisStatus(token: string, id: number, status: string): Promise<Devis> {
    const res = await fetch(`/api/devis/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ statut: status }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec de la modification du statut du devis.");
    }
    return data;
  },
};
