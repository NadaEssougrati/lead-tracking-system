import { pool } from "../db/index.ts";

export interface GlobalMetrics {
  totalLeads: number;
  totalEstimatedValue: number;
  totalWonValue: number;
  overdueTasksCount: number;
}

export interface StatusMetric {
  statut: string;
  count: number;
}

export interface SourceMetric {
  source: string;
  count: number;
}

export interface CommercialPerformance {
  commercialId: number;
  nomComplet: string;
  assignedLeadsCount: number;
  totalEstimatedValue: number;
  wonLeadsCount: number;
  wonLeadsValue: number;
}

export const kpiRepository = {
  /**
   * Retrieves global aggregated metrics.
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    const queryGlobal = `
      SELECT 
        COUNT(*)::int as total_leads,
        COALESCE(SUM(valeur_estimee), 0)::float as total_estimated_value,
        COALESCE(SUM(CASE WHEN statut = 'Gagne' THEN valeur_estimee ELSE 0 END), 0)::float as total_won_value
      FROM lead
    `;
    const resGlobal = await pool.query(queryGlobal);
    const globalRow = resGlobal.rows[0];

    const queryOverdue = `
      SELECT COUNT(*)::int as overdue_count 
      FROM tache 
      WHERE date_echeance < NOW() AND statut != 'Terminee'
    `;
    const resOverdue = await pool.query(queryOverdue);
    const overdueRow = resOverdue.rows[0];

    return {
      totalLeads: globalRow.total_leads,
      totalEstimatedValue: globalRow.total_estimated_value,
      totalWonValue: globalRow.total_won_value,
      overdueTasksCount: overdueRow.overdue_count,
    };
  },

  /**
   * Retrieves lead counts grouped by status.
   */
  async getLeadsCountByStatus(): Promise<StatusMetric[]> {
    const queryText = `
      SELECT statut, COUNT(*)::int as count
      FROM lead
      GROUP BY statut
      ORDER BY count DESC
    `;
    const res = await pool.query(queryText);
    return res.rows.map(row => ({
      statut: row.statut,
      count: row.count,
    }));
  },

  /**
   * Retrieves lead counts grouped by source.
   */
  async getLeadsCountBySource(): Promise<SourceMetric[]> {
    const queryText = `
      SELECT source, COUNT(*)::int as count
      FROM lead
      GROUP BY source
      ORDER BY count DESC
    `;
    const res = await pool.query(queryText);
    return res.rows.map(row => ({
      source: row.source || "Inconnu",
      count: row.count,
    }));
  },

  /**
   * Retrieves performance metrics for each commercial.
   */
  async getCommercialPerformance(): Promise<CommercialPerformance[]> {
    const queryText = `
      SELECT 
        u.id as commercial_id,
        u.prenom || ' ' || u.nom as nom_complet,
        COUNT(l.id)::int as assigned_leads_count,
        COALESCE(SUM(l.valeur_estimee), 0)::float as total_estimated_value,
        COUNT(CASE WHEN l.statut = 'Gagne' THEN 1 END)::int as won_leads_count,
        COALESCE(SUM(CASE WHEN l.statut = 'Gagne' THEN l.valeur_estimee ELSE 0 END), 0)::float as won_leads_value
      FROM utilisateur u
      LEFT JOIN lead l ON l.commercial_id = u.id
      WHERE u.role = 'Commercial' AND u.actif = TRUE
      GROUP BY u.id, u.nom, u.prenom
      ORDER BY won_leads_value DESC, total_estimated_value DESC
    `;
    const res = await pool.query(queryText);
    return res.rows.map(row => ({
      commercialId: row.commercial_id,
      nomComplet: row.nom_complet,
      assignedLeadsCount: row.assigned_leads_count,
      totalEstimatedValue: row.total_estimated_value,
      wonLeadsCount: row.won_leads_count,
      wonLeadsValue: row.won_leads_value,
    }));
  },
};
