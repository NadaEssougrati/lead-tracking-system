import { Response, Request, NextFunction } from "express";
import { AuthorizationError, NotFoundError } from "../services/entrepriseService.ts";

/**
 * Middleware to cast parameters and handle asynchronous route errors safely.
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error mapper for CRM routes.
 * Maps AuthorizationError to 403 Forbidden, NotFoundError to 404 Not Found, and other errors to 400 Bad Request.
 */
export function handleCrmError(error: any, res: Response) {
  if (error instanceof AuthorizationError) {
    return res.status(403).json({ error: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  
  // Database or input validation errors
  const message = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
  return res.status(400).json({ error: message });
}
