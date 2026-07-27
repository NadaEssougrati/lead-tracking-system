import { Router, Response } from "express";
import { leadService } from "../services/leadService.ts";
import { activiteService } from "../services/activiteService.ts";
import { tacheService } from "../services/tacheService.ts";
import { devisService } from "../services/devisService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const leadRouter = Router();

/**
 * GET /api/leads
 * Retrieves leads visible to the authenticated user.
 */
leadRouter.get("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const filters = {
      source: req.query.source as string,
      statut: req.query.statut as string,
      priorite: req.query.priorite as string,
      search: req.query.search as string,
    };
    const leads = await leadService.getLeadsForUser(req.user, filters);
    res.json(leads);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * GET /api/leads/:id
 * Retrieves a single lead by ID, performing access controls.
 */
leadRouter.get("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const lead = await leadService.getLeadOrFail(id, req.user);
    res.json(lead);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/leads
 * Creates a new lead.
 */
leadRouter.post("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const lead = await leadService.createLead(req.body, req.user);
    res.status(201).json(lead);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PUT /api/leads/:id
 * Updates general details of a lead.
 */
leadRouter.put("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const lead = await leadService.updateLead(id, req.body, req.user);
    res.json(lead);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * DELETE /api/leads/:id
 * Deletes a lead from the system.
 */
leadRouter.delete("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    await leadService.deleteLead(id, req.user);
    res.json({ message: "Lead supprimé avec succès." });
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PATCH /api/leads/:id/status
 * Updates the status of a lead, enforcing the pipeline flow and RBAC rules.
 */
leadRouter.patch("/:id/status", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { statut } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    if (!statut) {
      return res.status(400).json({ error: "Le statut est obligatoire." });
    }

    const updatedLead = await leadService.changeLeadStatus(id, statut, req.user);
    res.json(updatedLead);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/leads/:id/assign
 * Reassigns a lead to another commercial.
 */
leadRouter.post("/:id/assign", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { commercialId } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    if (commercialId === undefined) {
      return res.status(400).json({ error: "L'identifiant du commercial est obligatoire." });
    }

    const updatedLead = await leadService.assignLead(id, parseInt(commercialId), req.user);
    res.json(updatedLead);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * GET /api/leads/:id/activities
 * Retrieves all activities for a lead.
 */
leadRouter.get("/:id/activities", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const activities = await activiteService.getActivitiesForLead(id, req.user);
    res.json(activities);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/leads/:id/activities
 * Logs a manual activity (Appel, Email, RendezVous, Note) on a lead.
 */
leadRouter.post("/:id/activities", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const activity = await activiteService.createActivity(
      { ...req.body, leadId: id },
      req.user
    );
    res.status(201).json(activity);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * GET /api/leads/:id/tasks
 * Retrieves tasks associated with a specific lead.
 */
leadRouter.get("/:id/tasks", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const tasks = await tacheService.getTasksForLead(id, req.user);
    res.json(tasks);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * GET /api/leads/:id/devis
 * Retrieves quotes associated with a lead.
 */
leadRouter.get("/:id/devis", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de lead invalide." });
    }
    const quotes = await devisService.getDevisForLead(id, req.user);
    res.json(quotes);
  } catch (error) {
    handleCrmError(error, res);
  }
}));
