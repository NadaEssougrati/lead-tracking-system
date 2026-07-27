import { pool } from "../db/index.ts";

export interface Tache {
  id: number;
  titre: string;
  description: string | null;
  statut: string;
  dateEcheance: Date;
  dateCreation: Date;
  leadId: number;
  utilisateurId: number;
  
  // Joins
  leadNomComplet?: string | null;
  utilisateurNomComplet?: string | null;
}

export function mapRowToTache(row: any): Tache {
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    statut: row.statut,
    dateEcheance: new Date(row.date_echeance),
    dateCreation: new Date(row.date_creation),
    leadId: row.lead_id,
    utilisateurId: row.utilisateur_id,
    leadNomComplet: row.lead_nom && row.lead_prenom
      ? `${row.lead_prenom} ${row.lead_nom}`
      : null,
    utilisateurNomComplet: row.user_nom && row.user_prenom
      ? `${row.user_prenom} ${row.user_nom}`
      : null,
  };
}

export const tacheRepository = {
  /**
   * Finds a task by ID.
   */
  async findById(id: number): Promise<Tache | null> {
    const queryText = `
      SELECT t.*, l.nom as lead_nom, l.prenom as lead_prenom, u.nom as user_nom, u.prenom as user_prenom
      FROM tache t
      LEFT JOIN lead l ON t.lead_id = l.id
      LEFT JOIN utilisateur u ON t.utilisateur_id = u.id
      WHERE t.id = $1
    `;
    const res = await pool.query(queryText, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToTache(res.rows[0]);
  },

  /**
   * Retrieves tasks associated with a specific lead.
   */
  async findByLeadId(leadId: number): Promise<Tache[]> {
    const queryText = `
      SELECT t.*, l.nom as lead_nom, l.prenom as lead_prenom, u.nom as user_nom, u.prenom as user_prenom
      FROM tache t
      LEFT JOIN lead l ON t.lead_id = l.id
      LEFT JOIN utilisateur u ON t.utilisateur_id = u.id
      WHERE t.lead_id = $1
      ORDER BY t.date_echeance ASC
    `;
    const res = await pool.query(queryText, [leadId]);
    return res.rows.map(mapRowToTache);
  },

  /**
   * Retrieves active/pending tasks assigned to a specific user.
   */
  async findByUserId(userId: number): Promise<Tache[]> {
    const queryText = `
      SELECT t.*, l.nom as lead_nom, l.prenom as lead_prenom, u.nom as user_nom, u.prenom as user_prenom
      FROM tache t
      LEFT JOIN lead l ON t.lead_id = l.id
      LEFT JOIN utilisateur u ON t.utilisateur_id = u.id
      WHERE t.utilisateur_id = $1 AND t.statut != 'Terminee'
      ORDER BY t.date_echeance ASC
    `;
    const res = await pool.query(queryText, [userId]);
    return res.rows.map(mapRowToTache);
  },

  /**
   * Creates a new task.
   */
  async create(data: {
    titre: string;
    description: string | null;
    statut: string;
    dateEcheance: Date;
    leadId: number;
    utilisateurId: number;
  }, client?: any): Promise<Tache> {
    const queryExecutor = client || pool;
    const queryText = `
      INSERT INTO tache (titre, description, statut, date_echeance, date_creation, lead_id, utilisateur_id)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6)
      RETURNING *
    `;
    const res = await queryExecutor.query(queryText, [
      data.titre,
      data.description || null,
      data.statut || "AFaire",
      data.dateEcheance,
      data.leadId,
      data.utilisateurId,
    ]);
    return this.findById(res.rows[0].id).then(t => t!);
  },

  /**
   * Updates an existing task.
   */
  async update(id: number, data: Partial<Omit<Tache, "id" | "dateCreation">>, client?: any): Promise<Tache | null> {
    const queryExecutor = client || pool;
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mappings: { [key: string]: string } = {
      titre: "titre",
      description: "description",
      statut: "statut",
      dateEcheance: "date_echeance",
      leadId: "lead_id",
      utilisateurId: "utilisateur_id",
    };

    for (const key of Object.keys(mappings)) {
      const dbCol = mappings[key];
      const jsVal = (data as any)[key];
      if (jsVal !== undefined) {
        fields.push(`${dbCol} = $${paramIndex}`);
        values.push(jsVal === "" ? null : jsVal);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const queryText = `
      UPDATE tache
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const res = await queryExecutor.query(queryText, values);
    if (res.rows.length === 0) return null;
    return this.findById(id);
  },

  /**
   * Deletes a task.
   */
  async delete(id: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `DELETE FROM tache WHERE id = $1`;
    const res = await queryExecutor.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
