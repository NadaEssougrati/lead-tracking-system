import { pool } from "../db/index.ts";

/**
 * Interface representing the Lead entity in JS/TS.
 */
export interface Lead {
  id: number;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  source: string | null;
  statut: string;
  priorite: string;
  score: number;
  valeurEstimee: number;
  dateCreation: Date;
  derniereActivite: Date;
  notes: string | null;
  entrepriseId: number | null;
  commercialId: number | null;
  
  // Joins
  entrepriseNom?: string | null;
  commercialNomComplet?: string | null;
}

/**
 * Interface for filters applied to lead queries.
 */
export interface LeadFilters {
  source?: string;
  statut?: string;
  priorite?: string;
  search?: string; // name, email, or company name
}

/**
 * Maps a raw database row to a Lead entity.
 * @param row - The raw database row.
 * @returns The mapped Lead entity.
 */
export function mapRowToLead(row: any): Lead {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    telephone: row.telephone,
    email: row.email,
    adresse: row.adresse,
    ville: row.ville,
    pays: row.pays,
    source: row.source,
    statut: row.statut,
    priorite: row.priorite,
    score: row.score ? parseInt(row.score) : 0,
    valeurEstimee: row.valeur_estimee ? parseFloat(row.valeur_estimee) : 0,
    dateCreation: new Date(row.date_creation),
    derniereActivite: new Date(row.derniere_activite),
    notes: row.notes,
    entrepriseId: row.entreprise_id,
    commercialId: row.commercial_id,
    entrepriseNom: row.entreprise_nom || null,
    commercialNomComplet: row.commercial_nom && row.commercial_prenom 
      ? `${row.commercial_prenom} ${row.commercial_nom}`
      : null
  };
}

/**
 * Helper to build filter-based SELECT queries.
 */
function buildLeadQuery(baseWhere: string, filters: LeadFilters, baseValues: any[] = []) {
  let queryText = `
    SELECT l.*, 
           e.nom as entreprise_nom, 
           u.nom as commercial_nom, 
           u.prenom as commercial_prenom
    FROM lead l
    LEFT JOIN entreprise e ON l.entreprise_id = e.id
    LEFT JOIN utilisateur u ON l.commercial_id = u.id
  `;

  const clauses: string[] = [];
  const values = [...baseValues];

  if (baseWhere) {
    clauses.push(baseWhere);
  }

  if (filters.source) {
    values.push(filters.source);
    clauses.push(`l.source = $${values.length}`);
  }

  if (filters.statut) {
    values.push(filters.statut);
    clauses.push(`l.statut = $${values.length}`);
  }

  if (filters.priorite) {
    values.push(filters.priorite);
    clauses.push(`l.priorite = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(l.nom ILIKE $${values.length} OR l.prenom ILIKE $${values.length} OR l.email ILIKE $${values.length} OR e.nom ILIKE $${values.length})`);
  }

  if (clauses.length > 0) {
    queryText += ` WHERE ` + clauses.join(" AND ");
  }

  queryText += ` ORDER BY l.date_creation DESC`;

  return { queryText, values };
}

export const leadRepository = {
  /**
   * Finds a lead by its unique ID.
   * @param id - The lead ID.
   * @returns The lead if found, otherwise null.
   */
  async findById(id: number): Promise<Lead | null> {
    const queryText = `
      SELECT l.*, 
             e.nom as entreprise_nom, 
             u.nom as commercial_nom, 
             u.prenom as commercial_prenom
      FROM lead l
      LEFT JOIN entreprise e ON l.entreprise_id = e.id
      LEFT JOIN utilisateur u ON l.commercial_id = u.id
      WHERE l.id = $1
    `;
    const res = await pool.query(queryText, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToLead(res.rows[0]);
  },

  /**
   * Retrieves all leads (Admin/Manager view).
   * @param filters - Search filters.
   * @returns An array of matching leads.
   */
  async findAll(filters: LeadFilters = {}): Promise<Lead[]> {
    const { queryText, values } = buildLeadQuery("", filters);
    const res = await pool.query(queryText, values);
    return res.rows.map(mapRowToLead);
  },

  /**
   * Retrieves leads assigned to a specific commercial (Commercial view).
   * @param commercialId - ID of the commercial.
   * @param filters - Search filters.
   * @returns An array of leads.
   */
  async findLeadsForCommercial(commercialId: number, filters: LeadFilters = {}): Promise<Lead[]> {
    const { queryText, values } = buildLeadQuery("l.commercial_id = $1", filters, [commercialId]);
    const res = await pool.query(queryText, values);
    return res.rows.map(mapRowToLead);
  },

  /**
   * Retrieves leads visible to a specific AgentMarketing.
   * Visible leads:
   * - Leads where the creator (logged in the activite table as 'Lead créé') is the AgentMarketing user.
   * - Unassigned leads (commercial_id IS NULL) in 'Nouveau' status.
   * @param marketingUserId - ID of the AgentMarketing user.
   * @param filters - Search filters.
   * @returns An array of leads.
   */
  async findLeadsForMarketing(marketingUserId: number, filters: LeadFilters = {}): Promise<Lead[]> {
    // We join with the activite table to identify leads created by the AgentMarketing user.
    // Also union/or with unassigned leads in Nouveau status.
    const baseWhere = `(
      EXISTS (
        SELECT 1 FROM activite act 
        WHERE act.lead_id = l.id 
          AND act.type = 'Note' 
          AND act.description = 'Lead créé' 
          AND act.utilisateur_id = $1
      ) 
      OR (l.statut = 'Nouveau' AND l.commercial_id IS NULL)
    )`;

    const { queryText, values } = buildLeadQuery(baseWhere, filters, [marketingUserId]);
    const res = await pool.query(queryText, values);
    return res.rows.map(mapRowToLead);
  },

  /**
   * Creates a new lead.
   * @param data - Lead creation data.
   * @param client - Optional PG client for transactions.
   * @returns The created lead.
   */
  async create(data: Omit<Lead, "id" | "dateCreation" | "derniereActivite">, client?: any): Promise<Lead> {
    const queryExecutor = client || pool;
    const queryText = `
      INSERT INTO lead (nom, prenom, telephone, email, adresse, ville, pays, source, statut, priorite, score, valeur_estimee, notes, entreprise_id, commercial_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      data.nom,
      data.prenom,
      data.telephone || null,
      data.email || null,
      data.adresse || null,
      data.ville || null,
      data.pays || null,
      data.source || null,
      data.statut || "Nouveau",
      data.priorite || "Moyenne",
      data.score || 0,
      data.valeurEstimee || 0.00,
      data.notes || null,
      data.entrepriseId || null,
      data.commercialId || null,
    ];
    const res = await queryExecutor.query(queryText, values);
    return mapRowToLead(res.rows[0]);
  },

  /**
   * Updates lead details.
   * @param id - Lead ID.
   * @param data - Partial lead fields.
   * @param client - Optional PG client.
   * @returns The updated lead, or null if not found.
   */
  async update(id: number, data: Partial<Omit<Lead, "id" | "dateCreation">>, client?: any): Promise<Lead | null> {
    const queryExecutor = client || pool;
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mappings: { [key: string]: string } = {
      nom: "nom",
      prenom: "prenom",
      telephone: "telephone",
      email: "email",
      adresse: "adresse",
      ville: "ville",
      pays: "pays",
      source: "source",
      statut: "statut",
      priorite: "priorite",
      score: "score",
      valeurEstimee: "valeur_estimee",
      notes: "notes",
      entrepriseId: "entreprise_id",
      commercialId: "commercial_id",
      derniereActivite: "derniere_activite",
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
      UPDATE lead
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const res = await queryExecutor.query(queryText, values);
    if (res.rows.length === 0) return null;
    return mapRowToLead(res.rows[0]);
  },

  /**
   * Deletes a lead.
   * @param id - Lead ID.
   * @param client - Optional PG client.
   * @returns True if deleted, false otherwise.
   */
  async delete(id: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `DELETE FROM lead WHERE id = $1`;
    const res = await queryExecutor.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Changes status of a lead.
   */
  async changeStatus(leadId: number, newStatus: string, client: any): Promise<void> {
    const queryText = `UPDATE lead SET statut = $1 WHERE id = $2`;
    await client.query(queryText, [newStatus, leadId]);
  },

  /**
   * Updates the `derniere_activite` timestamp.
   */
  async updateLastActivity(leadId: number, date: Date, client: any): Promise<void> {
    const queryText = `UPDATE lead SET derniere_activite = $1 WHERE id = $2`;
    await client.query(queryText, [date, leadId]);
  },

  /**
   * Assigns a lead to a new commercial.
   */
  async assignCommercial(leadId: number, commercialId: number | null, client: any): Promise<void> {
    const queryText = `UPDATE lead SET commercial_id = $1 WHERE id = $2`;
    await client.query(queryText, [commercialId, leadId]);
  },

  /**
   * Inserts an attribution record.
   */
  async addAttributionRecord(leadId: number, commercialId: number, client: any): Promise<void> {
    const queryText = `
      INSERT INTO attribution (date_attribution, lead_id, commercial_id)
      VALUES (NOW(), $1, $2)
    `;
    await client.query(queryText, [leadId, commercialId]);
  },

  /**
   * Inserts an activity log record.
   */
  async addActivityRecord(type: string, description: string, leadId: number, userId: number, client: any): Promise<void> {
    const queryText = `
      INSERT INTO activite (type, description, date_activite, lead_id, utilisateur_id)
      VALUES ($1, $2, NOW(), $3, $4)
    `;
    await client.query(queryText, [type, description, leadId, userId]);
  },
};
