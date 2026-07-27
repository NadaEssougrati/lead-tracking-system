import { pool } from "../db/index.ts";

/**
 * Interface representing the Entreprise entity in JS/TS.
 */
export interface Entreprise {
  id: number;
  nom: string;
  secteur: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  siteWeb: string | null;
}

/**
 * Maps a raw database row to an Entreprise entity.
 * @param row - The raw database row.
 * @returns The mapped Entreprise entity.
 */
export function mapRowToEntreprise(row: any): Entreprise {
  return {
    id: row.id,
    nom: row.nom,
    secteur: row.secteur,
    adresse: row.adresse,
    ville: row.ville,
    pays: row.pays,
    telephone: row.telephone,
    siteWeb: row.site_web,
  };
}

export const entrepriseRepository = {
  /**
   * Finds an enterprise by its unique ID.
   * @param id - The enterprise ID.
   * @returns The enterprise if found, otherwise null.
   */
  async findById(id: number): Promise<Entreprise | null> {
    const queryText = `SELECT * FROM entreprise WHERE id = $1`;
    const res = await pool.query(queryText, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToEntreprise(res.rows[0]);
  },

  /**
   * Retrieves all enterprises.
   * @returns An array of all enterprise entities.
   */
  async findAll(): Promise<Entreprise[]> {
    const queryText = `SELECT * FROM entreprise ORDER BY nom ASC`;
    const res = await pool.query(queryText);
    return res.rows.map(mapRowToEntreprise);
  },

  /**
   * Creates a new enterprise.
   * @param data - The enterprise data to create.
   * @param client - Optional PG client for running in transactions.
   * @returns The newly created enterprise.
   */
  async create(data: Omit<Entreprise, "id">, client?: any): Promise<Entreprise> {
    const queryExecutor = client || pool;
    const queryText = `
      INSERT INTO entreprise (nom, secteur, adresse, ville, pays, telephone, site_web)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.nom,
      data.secteur || null,
      data.adresse || null,
      data.ville || null,
      data.pays || null,
      data.telephone || null,
      data.siteWeb || null,
    ];
    const res = await queryExecutor.query(queryText, values);
    return mapRowToEntreprise(res.rows[0]);
  },

  /**
   * Updates an existing enterprise.
   * @param id - The ID of the enterprise to update.
   * @param data - Partial enterprise data.
   * @param client - Optional PG client for transactions.
   * @returns The updated enterprise, or null if not found.
   */
  async update(id: number, data: Partial<Omit<Entreprise, "id">>, client?: any): Promise<Entreprise | null> {
    const queryExecutor = client || pool;
    
    // Build dynamic update query to only update specified fields
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mappings: { [key: string]: string } = {
      nom: "nom",
      secteur: "secteur",
      adresse: "adresse",
      ville: "ville",
      pays: "pays",
      telephone: "telephone",
      siteWeb: "site_web",
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
      UPDATE entreprise
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const res = await queryExecutor.query(queryText, values);
    if (res.rows.length === 0) return null;
    return mapRowToEntreprise(res.rows[0]);
  },

  /**
   * Deletes an enterprise.
   * @param id - The ID of the enterprise to delete.
   * @param client - Optional PG client for transactions.
   * @returns True if deleted, false otherwise.
   */
  async delete(id: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `DELETE FROM entreprise WHERE id = $1`;
    const res = await queryExecutor.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
