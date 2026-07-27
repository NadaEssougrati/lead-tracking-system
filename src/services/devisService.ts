import { devisRepository, Devis } from "../repositories/devisRepository.ts";
import { leadService } from "./leadService.ts";
import { leadRepository } from "../repositories/leadRepository.ts";
import { AuthorizationError, NotFoundError } from "./entrepriseService.ts";
import { pool } from "../db/index.ts";

export const devisService = {
  /**
   * Retrieves quotes associated with a specific lead.
   * Access check is delegating to leadService.getLeadOrFail.
   */
  async getDevisForLead(leadId: number, user: { id: number; role: string }): Promise<Devis[]> {
    await leadService.getLeadOrFail(leadId, user);
    return devisRepository.findByLeadId(leadId);
  },

  /**
   * Creates a new quote/proposal.
   * RBAC Enforcement: Rejects AgentMarketing. Re-verifies lead view & write permission.
   */
  async createDevis(
    data: { reference: string; montant: number; statut: string; leadId: number },
    user: { id: number; role: string }
  ): Promise<Devis> {
    // 1. Enforce RBAC (AgentMarketing is blocked)
    const blockedRoles = ["AgentMarketing"];
    if (blockedRoles.includes(user.role)) {
      throw new AuthorizationError("Les agents marketing ne sont pas autorisés à générer des devis.");
    }

    // 2. Validate lead access
    await leadService.getLeadOrFail(data.leadId, user);

    // 3. Validate reference uniqueness
    if (!data.reference) {
      throw new Error("La référence du devis est obligatoire.");
    }
    const checkRef = await pool.query("SELECT 1 FROM devis WHERE reference = $1 LIMIT 1", [data.reference]);
    if (checkRef.rows.length > 0) {
      throw new Error(`La référence de devis '${data.reference}' existe déjà.`);
    }

    if (data.montant === undefined || data.montant < 0) {
      throw new Error("Le montant du devis doit être supérieur ou égal à 0.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create devis
      const devis = await devisRepository.create({
        reference: data.reference,
        montant: data.montant,
        statut: data.statut || "Brouillon",
        leadId: data.leadId,
      }, client);

      // Log activity
      const activityDesc = `Devis créé: Réf ${data.reference} (Montant: ${data.montant} €)`;
      await leadRepository.addActivityRecord("Note", activityDesc, data.leadId, user.id, client);

      // Update lead last activity
      await leadRepository.updateLastActivity(data.leadId, new Date(), client);

      await client.query("COMMIT");
      return devis;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Updates quote status (e.g. Brouillon -> Envoye -> Accepte / Refuse).
   * RBAC Enforcement: Rejects AgentMarketing. Re-verifies lead view & write permission.
   */
  async updateDevisStatus(
    devisId: number,
    status: string,
    user: { id: number; role: string }
  ): Promise<Devis> {
    // 1. Enforce RBAC
    const blockedRoles = ["AgentMarketing"];
    if (blockedRoles.includes(user.role)) {
      throw new AuthorizationError("Les agents marketing ne sont pas autorisés à modifier le statut des devis.");
    }

    // 2. Fetch devis
    const devis = await devisRepository.findById(devisId);
    if (!devis) {
      throw new NotFoundError(`Devis avec l'ID ${devisId} non trouvé.`);
    }

    // 3. Validate lead access
    await leadService.getLeadOrFail(devis.leadId, user);

    // 4. Validate status values
    const validStatuses = ["Brouillon", "Envoye", "Accepte", "Refuse"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Statut de devis invalide: ${status}. Statuts autorisés: ${validStatuses.join(", ")}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update status
      const updated = await devisRepository.updateStatus(devisId, status, client);

      // Log activity
      const activityDesc = `Devis Réf ${devis.reference} marqué comme '${status}' (Montant: ${devis.montant} €)`;
      await leadRepository.addActivityRecord("Note", activityDesc, devis.leadId, user.id, client);

      // Update lead last activity
      await leadRepository.updateLastActivity(devis.leadId, new Date(), client);

      await client.query("COMMIT");
      return updated!;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
