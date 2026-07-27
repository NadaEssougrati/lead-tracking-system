import { pool } from "../db/index.ts";

export interface Activite {
  id: number;
  type: string;
  description: string | null;
  dateActivite: Date;
  leadId: number;
  utilisateurId: number;
  utilisateurNomComplet?: string | null;
}

export function mapRowToActivite(row: any): Activite {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    dateActivite: new Date(row.date_activite),
    leadId: row.lead_id,
    utilisateurId: row.utilisateur_id,
    utilisateurNomComplet: row.utilisateur_nom && row.utilisateur_prenom
      ? `${row.utilisateur_prenom} ${row.utilisateur_nom}`
      : null,
  };
}

export const activiteRepository = {
  /**
   * Retrieves all activities associated with a lead.
   * @param leadId - ID of the lead.
   * @returns Array of activities.
   */
  async findByLeadId(leadId: number): Promise<Activite[]> {
    const queryText = `
      SELECT a.*, u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
      FROM activite a
      LEFT JOIN utilisateur u ON a.utilisateur_id = u.id
      WHERE a.lead_id = $1
      ORDER BY a.date_activite DESC
    `;
    const res = await pool.query(queryText, [leadId]);
    return res.rows.map(mapRowToActivite);
  },

  /**
   * Creates a manual activity record.
   * @param data - The activity data to insert.
   * @param client - Optional PG client for transactions.
   * @returns The created activity.
   */
  async create(data: { type: string; description: string | null; leadId: number; utilisateurId: number }, client?: any): Promise<Activite> {
    const queryExecutor = client || pool;
    const queryText = `
      INSERT INTO activite (type, description, date_activite, lead_id, utilisateur_id)
      VALUES ($1, $2, NOW(), $3, $4)
      RETURNING *
    `;
    const res = await queryExecutor.query(queryText, [
      data.type,
      data.description || null,
      data.leadId,
      data.utilisateurId,
    ]);
    return mapRowToActivite(res.rows[0]);
  },
};
