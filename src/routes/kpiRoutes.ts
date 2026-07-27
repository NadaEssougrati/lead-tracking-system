import { Router, Response } from "express";
import { kpiService } from "../services/kpiService.ts";
import { asyncHandler, handleCrmError } from "./routeHelpers.ts";

export const kpiRouter = Router();

/**
 * GET /api/kpis
 * Retrieves team KPIs. Restricted strictly to Admin/Manager.
 */
kpiRouter.get("/", asyncHandler(async (req: any, res: Response) => {
  try {
    const kpis = await kpiService.getDashboardKPIs(req.user);
    res.json(kpis);
  } catch (error) {
    handleCrmError(error, res);
  }
}));
