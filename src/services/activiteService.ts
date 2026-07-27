import { activiteRepository, Activite } from "../repositories/activiteRepository.ts";
import { leadService } from "./leadService.ts";
import { leadRepository } from "../repositories/leadRepository.ts";
import { AuthorizationError } from "./entrepriseService.ts";
import { pool } from "../db/index.ts";

export const activiteService = {
  /**
   * Retrieves all activities for a specific lead.
   * Access check is delegating to leadService.getLeadOrFail.
   */
  async getActivitiesForLead(leadId: number, user: { id: number; role: string }): Promise<Activite[]> {
    // getLeadOrFail will throw AuthorizationError or NotFoundError if necessary
    await leadService.getLeadOrFail(leadId, user);
    return activiteRepository.findByLeadId(leadId);
  },

  /**
   * Logs a manual activity on a lead (e.g. phone call, email relance, demonstration).
   * Restricts activity logging to valid manually triggerable types: Appel, Email, RendezVous, Note.
   */
  async createActivity(
    data: { type: string; description: string | null; leadId: number },
    user: { id: number; role: string }
  ): Promise<Activite> {
    // 1. Enforce lead access controls
    await leadService.getLeadOrFail(data.leadId, user);

    // 2. Validate manually triggerable activity type
    const validManualTypes = ["Appel", "Email", "RendezVous", "Note"];
    if (!validManualTypes.includes(data.type)) {
      throw new Error(`Type d'activité manuel invalide: ${data.type}. Types autorisés: ${validManualTypes.join(", ")}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create activity
      const activity = await activiteRepository.create({
        type: data.type,
        description: data.description,
        leadId: data.leadId,
        utilisateurId: user.id
      }, client);

      // Update lead's last activity timestamp
      await leadRepository.updateLastActivity(data.leadId, new Date(), client);

      await client.query("COMMIT");
      return activity;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
