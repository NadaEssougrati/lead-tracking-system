import { pool } from "../db/index.ts";

export interface Devis {
  id: number;
  reference: string;
  montant: number;
  statut: string;
  dateCreation: Date;
  leadId: number;
}

export function mapRowToDevis(row: any): Devis {
  return {
    id: row.id,
    reference: row.reference,
    montant: row.montant ? parseFloat(row.montant) : 0,
    statut: row.statut,
    dateCreation: new Date(row.date_creation),
    leadId: row.lead_id,
  };
}

export const devisRepository = {
  /**
   * Finds a quote by ID.
   */
  async findById(id: number): Promise<Devis | null> {
    const queryText = `SELECT * FROM devis WHERE id = $1`;
    const res = await pool.query(queryText, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToDevis(res.rows[0]);
  },

  /**
   * Retrieves quotes associated with a lead.
   */
  async findByLeadId(leadId: number): Promise<Devis[]> {
    const queryText = `
      SELECT * FROM devis 
      WHERE lead_id = $1 
      ORDER BY date_creation DESC
    `;
    const res = await pool.query(queryText, [leadId]);
    return res.rows.map(mapRowToDevis);
  },

  /**
   * Generates a new quote.
   */
  async create(data: { reference: string; montant: number; statut: string; leadId: number }, client?: any): Promise<Devis> {
    const queryExecutor = client || pool;
    const queryText = `
      INSERT INTO devis (reference, montant, statut, date_creation, lead_id)
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING *
    `;
    const res = await queryExecutor.query(queryText, [
      data.reference,
      data.montant,
      data.statut || "Brouillon",
      data.leadId,
    ]);
    return mapRowToDevis(res.rows[0]);
  },

  /**
   * Updates quote status.
   */
  async updateStatus(id: number, status: string, client?: any): Promise<Devis | null> {
    const queryExecutor = client || pool;
    const queryText = `
      UPDATE devis 
      SET statut = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const res = await queryExecutor.query(queryText, [status, id]);
    if (res.rows.length === 0) return null;
    return mapRowToDevis(res.rows[0]);
  },

  /**
   * Deletes a quote.
   */
  async delete(id: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `DELETE FROM devis WHERE id = $1`;
    const res = await queryExecutor.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
