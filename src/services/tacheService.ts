import { tacheRepository, Tache } from "../repositories/tacheRepository.ts";
import { leadService } from "./leadService.ts";
import { leadRepository } from "../repositories/leadRepository.ts";
import { AuthorizationError, NotFoundError } from "./entrepriseService.ts";
import { pool } from "../db/index.ts";

export const tacheService = {
  /**
   * Retrieves all tasks associated with a lead.
   * Access check is delegating to leadService.getLeadOrFail.
   */
  async getTasksForLead(leadId: number, user: { id: number; role: string }): Promise<Tache[]> {
    await leadService.getLeadOrFail(leadId, user);
    return tacheRepository.findByLeadId(leadId);
  },

  /**
   * Retrieves pending tasks assigned to the current user.
   */
  async getTasksForUser(user: { id: number; role: string }): Promise<Tache[]> {
    if (!user) throw new AuthorizationError();
    return tacheRepository.findByUserId(user.id);
  },

  /**
   * Creates a new task linked to a lead.
   */
  async createTask(
    data: { titre: string; description: string | null; statut: string; dateEcheance: Date; leadId: number; utilisateurId?: number },
    user: { id: number; role: string }
  ): Promise<Tache> {
    // 1. Enforce lead access controls
    const lead = await leadService.getLeadOrFail(data.leadId, user);

    // 2. Validate target assignee
    const assigneeId = data.utilisateurId || user.id;
    const userCheck = await pool.query("SELECT id, actif FROM utilisateur WHERE id = $1", [assigneeId]);
    if (userCheck.rows.length === 0) {
      throw new NotFoundError(`L'utilisateur assigné avec l'ID ${assigneeId} n'existe pas.`);
    }
    if (!userCheck.rows[0].actif) {
      throw new Error(`L'utilisateur assigné est inactif et ne peut pas recevoir de tâche.`);
    }

    if (!data.titre) {
      throw new Error("Le titre de la tâche est obligatoire.");
    }
    if (!data.dateEcheance) {
      throw new Error("La date d'échéance de la tâche est obligatoire.");
    }

    return tacheRepository.create({
      titre: data.titre,
      description: data.description,
      statut: data.statut || "AFaire",
      dateEcheance: new Date(data.dateEcheance),
      leadId: data.leadId,
      utilisateurId: assigneeId,
    });
  },

  /**
   * Updates an existing task.
   * Permissions check: Allowed for Admin, Manager, the assigned user, or the commercial owner of the attached lead.
   */
  async updateTask(
    taskId: number,
    data: Partial<Omit<Tache, "id" | "dateCreation">>,
    user: { id: number; role: string }
  ): Promise<Tache> {
    const task = await tacheRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Tâche avec l'ID ${taskId} non trouvée.`);
    }

    // Fetch the attached lead to check ownership
    const lead = await leadRepository.findById(task.leadId);
    
    // Enforce permissions: Admin, Manager, task assignee, or lead owner
    const isAuthorized = 
      user.role === "Administrateur" || 
      user.role === "Manager" || 
      task.utilisateurId === user.id || 
      (lead !== null && lead.commercialId === user.id);

    if (!isAuthorized) {
      throw new AuthorizationError("Vous n'êtes pas autorisé à modifier cette tâche.");
    }

    if (data.utilisateurId) {
      const userCheck = await pool.query("SELECT id, actif FROM utilisateur WHERE id = $1", [data.utilisateurId]);
      if (userCheck.rows.length === 0 || !userCheck.rows[0].actif) {
        throw new Error("L'utilisateur ciblé pour réassignation est introuvable ou inactif.");
      }
    }

    const updated = await tacheRepository.update(taskId, data);
    if (!updated) {
      throw new NotFoundError(`Tâche avec l'ID ${taskId} non trouvée lors de la mise à jour.`);
    }

    return updated;
  },

  /**
   * Deletes a task.
   * Permissions check: Allowed for Admin, Manager, the assigned user, or the commercial owner of the attached lead.
   */
  async deleteTask(taskId: number, user: { id: number; role: string }): Promise<boolean> {
    const task = await tacheRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Tâche avec l'ID ${taskId} non trouvée.`);
    }

    const lead = await leadRepository.findById(task.leadId);
    const isAuthorized = 
      user.role === "Administrateur" || 
      user.role === "Manager" || 
      task.utilisateurId === user.id || 
      (lead !== null && lead.commercialId === user.id);

    if (!isAuthorized) {
      throw new AuthorizationError("Vous n'êtes pas autorisé à supprimer cette tâche.");
    }

    return tacheRepository.delete(taskId);
  },
};
