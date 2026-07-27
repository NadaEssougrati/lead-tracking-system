import { pool } from "../db/index.ts";
import { leadRepository, Lead, LeadFilters } from "../repositories/leadRepository.ts";
import { AuthorizationError, NotFoundError } from "./entrepriseService.ts";

/**
 * Validates if a lead status transition is legal.
 * 
 * Flow: Nouveau -> PremierContact -> Qualification -> PropositionCommerciale -> Negociation -> (Gagne | Perdu)
 * 
 * Rules:
 * - AgentMarketing can ONLY transition Nouveau -> Qualification.
 * - Admin, Manager, and Commercial can follow the standard transitions.
 * 
 * @param currentStatus - The current status of the lead.
 * @param newStatus - The target status.
 * @param role - The role of the acting user.
 * @returns True if valid, false otherwise.
 */
function isValidTransition(currentStatus: string, newStatus: string, role: string): boolean {
  if (role === "AgentMarketing") {
    return currentStatus === "Nouveau" && newStatus === "Qualification";
  }

  const transitions: { [key: string]: string[] } = {
    "Nouveau": ["PremierContact", "Qualification"],
    "PremierContact": ["Qualification"],
    "Qualification": ["PropositionCommerciale"],
    "PropositionCommerciale": ["Negociation"],
    "Negociation": ["Gagne", "Perdu"],
    "Gagne": [],
    "Perdu": []
  };

  const allowed = transitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

export const leadService = {
  /**
   * Retrieves leads visible to a user based on their role and applies optional filters.
   * 
   * RBAC Enforcement:
   * - Administrateur / Manager: Can view ALL leads.
   * - Commercial: Can view ONLY leads assigned to them.
   * - AgentMarketing: Can view ONLY leads they created or leads in 'Nouveau' status with no assigned commercial.
   * 
   * @param user - The authenticated user object (from req.user).
   * @param filters - Search/filter options (source, statut, priorite, search text).
   * @returns Array of leads matching permissions and filters.
   */
  async getLeadsForUser(
    user: { id: number; role: string },
    filters: LeadFilters = {}
  ): Promise<Lead[]> {
    if (!user) throw new AuthorizationError();

    switch (user.role) {
      case "Administrateur":
      case "Manager":
        return leadRepository.findAll(filters);

      case "Commercial":
        return leadRepository.findLeadsForCommercial(user.id, filters);

      case "AgentMarketing":
        return leadRepository.findLeadsForMarketing(user.id, filters);

      default:
        throw new AuthorizationError("Rôle non reconnu pour la visualisation des leads.");
    }
  },

  /**
   * Retrieves a single lead by ID, performing access checks first.
   * Throws an AuthorizationError (not an empty result) if the user tries to access a lead they shouldn't see.
   * 
   * @param leadId - The ID of the lead.
   * @param user - The authenticated user object.
   * @returns The lead if found and authorized.
   */
  async getLeadOrFail(leadId: number, user: { id: number; role: string }): Promise<Lead> {
    if (!user) throw new AuthorizationError();

    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundError(`Lead avec l'ID ${leadId} non trouvé.`);
    }

    // Role-based access validation for single lead
    if (user.role === "Administrateur" || user.role === "Manager") {
      return lead; // Admins and Managers have global access
    }

    if (user.role === "Commercial") {
      if (lead.commercialId !== user.id) {
        throw new AuthorizationError("Accès refusé. Ce lead ne vous est pas attribué.");
      }
      return lead;
    }

    if (user.role === "AgentMarketing") {
      // Check if lead is Nouveau and unassigned
      if (lead.statut === "Nouveau" && lead.commercialId === null) {
        return lead;
      }
      
      // Check if lead was created by this AgentMarketing user
      const queryText = `
        SELECT 1 FROM activite 
        WHERE lead_id = $1 
          AND type = 'Note' 
          AND description = 'Lead créé' 
          AND utilisateur_id = $2
        LIMIT 1
      `;
      const res = await pool.query(queryText, [leadId, user.id]);
      if (res.rows.length > 0) {
        return lead;
      }

      throw new AuthorizationError("Accès refusé. Vous n'êtes pas le créateur de ce lead et il n'est pas disponible pour qualification.");
    }

    throw new AuthorizationError("Accès refusé. Rôle non autorisé.");
  },

  /**
   * Creates a new lead.
   * Allowed roles: Administrateur, Manager, AgentMarketing (Commercial cannot create leads).
   * Generates a lead creation activity log.
   * 
   * @param data - Lead fields.
   * @param user - Acting user.
   */
  async createLead(
    data: Omit<Lead, "id" | "dateCreation" | "derniereActivite">,
    user: { id: number; role: string }
  ): Promise<Lead> {
    const allowedRoles = ["Administrateur", "Manager", "AgentMarketing"];
    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError("Vous n'avez pas l'autorisation de créer des leads.");
    }

    if (!data.nom || !data.prenom) {
      throw new Error("Le nom et le prénom du lead sont obligatoires.");
    }

    // Use transaction to insert lead and log creation activity
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const newLead = await leadRepository.create(data, client);
      
      // Log lead creation as activity
      await leadRepository.addActivityRecord("Note", "Lead créé", newLead.id, user.id, client);
      
      await client.query("COMMIT");
      return newLead;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Updates general lead details.
   * Allowed roles: Administrateur, Manager.
   */
  async updateLead(
    leadId: number,
    data: Partial<Omit<Lead, "id" | "dateCreation" | "derniereActivite">>,
    user: { id: number; role: string }
  ): Promise<Lead> {
    const allowedRoles = ["Administrateur", "Manager"];
    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError("Seuls les Administrateurs et Managers peuvent modifier les détails d'un lead.");
    }

    const existing = await leadRepository.findById(leadId);
    if (!existing) {
      throw new NotFoundError(`Lead avec l'ID ${leadId} non trouvé.`);
    }

    const updated = await leadRepository.update(leadId, data);
    if (!updated) {
      throw new NotFoundError(`Lead avec l'ID ${leadId} non trouvé lors de la mise à jour.`);
    }
    return updated;
  },

  /**
   * Deletes a lead.
   * Allowed roles: Administrateur only.
   */
  async deleteLead(leadId: number, user: { id: number; role: string }): Promise<boolean> {
    if (user.role !== "Administrateur") {
      throw new AuthorizationError("Seul l'Administrateur peut supprimer un lead.");
    }

    const existing = await leadRepository.findById(leadId);
    if (!existing) {
      throw new NotFoundError(`Lead avec l'ID ${leadId} non trouvé.`);
    }

    return leadRepository.delete(leadId);
  },

  /**
   * Changes the pipeline status of a lead.
   * 
   * RBAC Enforcement:
   * - AgentMarketing can ONLY transition Nouveau -> Qualification.
   * - Commercial/Manager/Admin can perform valid standard transitions.
   * 
   * Transaction:
   * 1. Check permissions and flow viability.
   * 2. Update status in database.
   * 3. Insert status change activity log (type='ChangementStatut').
   * 4. Update lead's `derniere_activite`.
   * 
   * @param leadId - ID of the lead.
   * @param newStatus - Target status.
   * @param user - Acting user.
   */
  async changeLeadStatus(
    leadId: number,
    newStatus: string,
    user: { id: number; role: string }
  ): Promise<Lead> {
    // 1. Fetch lead & check read access
    const lead = await this.getLeadOrFail(leadId, user);
    const oldStatus = lead.statut;

    if (oldStatus === newStatus) {
      return lead; // No change needed
    }

    // 2. Validate transition flow logic
    if (!isValidTransition(oldStatus, newStatus, user.role)) {
      throw new Error(
        `Transition de statut invalide de '${oldStatus}' vers '${newStatus}' pour le rôle ${user.role}.`
      );
    }

    // 3. Execute updates in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // Update status
      await leadRepository.changeStatus(leadId, newStatus, client);

      // Create activity log entry
      const description = `Statut modifié de '${oldStatus}' à '${newStatus}'`;
      await leadRepository.addActivityRecord("ChangementStatut", description, leadId, user.id, client);

      // Update lead's last activity timestamp
      await leadRepository.updateLastActivity(leadId, new Date(), client);

      await client.query("COMMIT");

      // Fetch the updated lead
      const updatedLead = await leadRepository.findById(leadId);
      return updatedLead!;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Reassigns a lead to a new commercial.
   * 
   * RBAC Enforcement:
   * - Only Administrateur and Manager roles are authorized.
   * 
   * Transaction:
   * 1. Verify acting user is Admin/Manager.
   * 2. Verify target user exists and has the role 'Commercial'.
   * 3. Update lead's `commercial_id`.
   * 4. Create `attribution` history entry.
   * 5. Create activity record.
   * 6. Update lead's `derniere_activite`.
   * 
   * @param leadId - ID of the lead.
   * @param commercialId - ID of the commercial.
   * @param actingUser - The acting user.
   */
  async assignLead(
    leadId: number,
    commercialId: number,
    actingUser: { id: number; role: string }
  ): Promise<Lead> {
    // 1. Verify permissions
    const allowedReassigners = ["Administrateur", "Manager"];
    if (!allowedReassigners.includes(actingUser.role)) {
      throw new AuthorizationError("Vous n'avez pas l'autorisation d'attribuer ce lead.");
    }

    // Fetch lead to make sure it exists
    const lead = await this.getLeadOrFail(leadId, actingUser);

    // 2. Verify target commercial exists and has role 'Commercial'
    const commercialRes = await pool.query(
      `SELECT nom, prenom, role, actif FROM utilisateur WHERE id = $1`,
      [commercialId]
    );
    const commercial = commercialRes.rows[0];

    if (!commercial) {
      throw new NotFoundError(`Le commercial avec l'ID ${commercialId} n'existe pas.`);
    }

    if (commercial.role !== "Commercial") {
      throw new Error(`L'utilisateur ciblé doit avoir le rôle 'Commercial' (rôle actuel: ${commercial.role}).`);
    }

    if (!commercial.actif) {
      throw new Error(`Le commercial ciblé est inactif et ne peut pas recevoir de lead.`);
    }

    const commercialName = `${commercial.prenom} ${commercial.nom}`;

    // 3. Execute re-assignment in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update lead owner
      await leadRepository.assignCommercial(leadId, commercialId, client);

      // Add attribution log record (assignment history)
      await leadRepository.addAttributionRecord(leadId, commercialId, client);

      // Create activity record
      const description = `Lead attribué à ${commercialName}`;
      await leadRepository.addActivityRecord("Note", description, leadId, actingUser.id, client);

      // Update last activity timestamp
      await leadRepository.updateLastActivity(leadId, new Date(), client);

      await client.query("COMMIT");

      const updatedLead = await leadRepository.findById(leadId);
      return updatedLead!;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
