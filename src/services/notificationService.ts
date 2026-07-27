import { notificationRepository, Notification } from "../repositories/notificationRepository.ts";
import { AuthorizationError, NotFoundError } from "./entrepriseService.ts";
import { pool } from "../db/index.ts";

export const notificationService = {
  /**
   * Retrieves notifications for the logged-in user.
   */
  async getUserNotifications(user: { id: number; role: string }): Promise<Notification[]> {
    if (!user) throw new AuthorizationError();
    return notificationRepository.findByUserId(user.id);
  },

  /**
   * Marks a specific notification as read, checking ownership first.
   */
  async readNotification(notificationId: number, user: { id: number; role: string }): Promise<boolean> {
    if (!user) throw new AuthorizationError();

    // Check ownership
    const notifCheck = await pool.query(
      "SELECT utilisateur_id FROM notification WHERE id = $1 LIMIT 1",
      [notificationId]
    );
    const notif = notifCheck.rows[0];

    if (!notif) {
      throw new NotFoundError(`Notification avec l'ID ${notificationId} non trouvée.`);
    }

    if (notif.utilisateur_id !== user.id) {
      throw new AuthorizationError("Vous ne pouvez pas lire la notification d'un autre utilisateur.");
    }

    return notificationRepository.markAsRead(notificationId);
  },

  /**
   * Marks all notifications of the user as read.
   */
  async readAllNotifications(user: { id: number; role: string }): Promise<boolean> {
    if (!user) throw new AuthorizationError();
    return notificationRepository.markAllAsRead(user.id);
  },
};
