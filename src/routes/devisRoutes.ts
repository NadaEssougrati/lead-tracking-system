import { Router, Response } from "express";
import { devisService } from "../services/devisService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const devisRouter = Router();

/**
 * POST /api/devis
 * Generates a new quote.
 */
devisRouter.post("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const quote = await devisService.createDevis(req.body, req.user);
    res.status(201).json(quote);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PATCH /api/devis/:id/status
 * Updates the status of a quote (e.g. Accept, Refuse).
 */
devisRouter.patch("/:id/status", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { statut } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de devis invalide." });
    }
    if (!statut) {
      return res.status(400).json({ error: "Le statut est obligatoire." });
    }

    const updated = await devisService.updateDevisStatus(id, statut, req.user);
    res.json(updated);
  } catch (error) {
    handleCrmError(error, res);
  }
}));
