import { Router, Response } from "express";
import { entrepriseService } from "../services/entrepriseService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const entrepriseRouter = Router();

/**
 * GET /api/entreprises
 * Lists all enterprises.
 */
entrepriseRouter.get("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const entreprises = await entrepriseService.listEntreprises(req.user);
    res.json(entreprises);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * GET /api/entreprises/:id
 * Retrieves details of a single enterprise.
 */
entrepriseRouter.get("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID d'entreprise invalide." });
    }
    const entreprise = await entrepriseService.getEntreprise(id, req.user);
    res.json(entreprise);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * POST /api/entreprises
 * Creates a new enterprise.
 */
entrepriseRouter.post("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const entreprise = await entrepriseService.createEntreprise(req.body, req.user);
    res.status(201).json(entreprise);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * PUT /api/entreprises/:id
 * Updates enterprise fields.
 */
entrepriseRouter.put("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID d'entreprise invalide." });
    }
    const entreprise = await entrepriseService.updateEntreprise(id, req.body, req.user);
    res.json(entreprise);
  } catch (error) {
    handleCrmError(error, res);
  }
}));

/**
 * DELETE /api/entreprises/:id
 * Deletes an enterprise.
 */
entrepriseRouter.delete("/:id", asyncHandler(async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID d'entreprise invalide." });
    }
    await entrepriseService.deleteEntreprise(id, req.user);
    res.json({ message: "Entreprise supprimée avec succès." });
  } catch (error) {
    handleCrmError(error, res);
  }
}));
