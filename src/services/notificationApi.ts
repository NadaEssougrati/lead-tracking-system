import { Notification } from "../types";

export const notificationApi = {
  async getNotifications(token: string): Promise<Notification[]> {
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Échec du chargement des notifications.");
    }
    return data;
  },

  async readNotification(token: string, id: number): Promise<void> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec du marquage de la notification comme lue.");
    }
  },

  async readAllNotifications(token: string): Promise<void> {
    const res = await fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Échec du marquage global des notifications comme lues.");
    }
  },
};
