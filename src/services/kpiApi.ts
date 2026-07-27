import { DashboardKPIs } from "../types";

export const kpiApi = {
  async getKPIs(token: string): Promise<DashboardKPIs> {
    const res = await fetch("/api/kpis", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des indicateurs clés de performance.");
    }
    return data;
  },
};
