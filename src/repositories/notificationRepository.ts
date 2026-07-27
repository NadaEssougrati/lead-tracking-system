import { pool } from "../db/index.ts";

export interface Notification {
  id: number;
  titre: string;
  message: string;
  estLue: boolean;
  dateCreation: Date;
  utilisateurId: number;
}

export function mapRowToNotification(row: any): Notification {
  return {
    id: row.id,
    titre: row.titre,
    message: row.message,
    estLue: row.est_lue,
    dateCreation: new Date(row.date_creation),
    utilisateurId: row.utilisateur_id,
  };
}

export const notificationRepository = {
  /**
   * Retrieves notifications for a user, sorted by date (newest first).
   */
  async findByUserId(userId: number): Promise<Notification[]> {
    const queryText = `
      SELECT * FROM notification 
      WHERE utilisateur_id = $1 
      ORDER BY date_creation DESC
    `;
    const res = await pool.query(queryText, [userId]);
    return res.rows.map(mapRowToNotification);
  },

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(id: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `
      UPDATE notification 
      SET est_lue = TRUE 
      WHERE id = $1
    `;
    const res = await queryExecutor.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Marks all notifications of a user as read.
   */
  async markAllAsRead(userId: number, client?: any): Promise<boolean> {
    const queryExecutor = client || pool;
    const queryText = `
      UPDATE notification 
      SET est_lue = TRUE 
      WHERE utilisateur_id = $1 AND est_lue = FALSE
    `;
    const res = await queryExecutor.query(queryText, [userId]);
    return (res.rowCount ?? 0) > 0;
  },
};
