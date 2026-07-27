import { Router, Response } from "express";
import { tacheService } from "../services/tacheService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const tacheRouter = Router();

/**
 * GET /api/tasks/my
 * Retrieves active tasks assigned to the current user.
 */
tacheRouter.get("/my", asyncHandler(async (req: any, res: Response) => {
  try {
    const tasks = await tacheService.getTasksForUser(req.user);
    res.json(tasks);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/tasks
 * Creates a new task.
 */
tacheRouter.post("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const task = await tacheService.createTask(req.body, req.user);
    res.status(201).json(task);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PUT /api/tasks/:id
 * Updates task fields (e.g. title, description, due date, status).
 */
tacheRouter.put("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de tâche invalide." });
    }
    const task = await tacheService.updateTask(id, req.body, req.user);
    res.json(task);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * DELETE /api/tasks/:id
 * Deletes a task.
 */
tacheRouter.delete("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de tâche invalide." });
    }
    await tacheService.deleteTask(id, req.user);
    res.json({ message: "Tâche supprimée avec succès." });
  } catch (error) {
    handleCrmError(error, res);
  }
}));
