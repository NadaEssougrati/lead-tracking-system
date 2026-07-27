import { Router, Response } from "express";
import { notificationService } from "../services/notificationService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const notificationRouter = Router();

/**
 * GET /api/notifications
 * Retrieves all notifications for the user.
 */
notificationRouter.get("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user);
    res.json(notifications);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read.
 */
notificationRouter.patch("/:id/read", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de notification invalide." });
    }
    await notificationService.readNotification(id, req.user);
    res.json({ message: "Notification marquée comme lue." });
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/notifications/read-all
 * Marks all notifications for the user as read.
 */
notificationRouter.post("/read-all", asyncHandler(async (req: any, res: Response) => {
  try {
    await notificationService.readAllNotifications(req.user);
    res.json({ message: "Toutes les notifications ont été marquées comme lues." });
  } catch (error) {
    handleCrmError(error, res);
  }
}));
