import { entrepriseRepository, Entreprise } from "../repositories/entrepriseRepository.ts";

export class AuthorizationError extends Error {
  constructor(message: string = "Accès refusé. Autorisation insuffisante.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export const entrepriseService = {
  /**
   * Retrieves all enterprises. Accessible to all authenticated users.
   * @param user - The acting authenticated user.
   * @returns List of all enterprises.
   */
  async listEntreprises(user: { role: string }): Promise<Entreprise[]> {
    if (!user) throw new AuthorizationError();
    return entrepriseRepository.findAll();
  },

  /**
   * Retrieves a single enterprise. Accessible to all authenticated users.
   * @param id - Enterprise ID.
   * @param user - The acting authenticated user.
   * @returns The enterprise entity.
   */
  async getEntreprise(id: number, user: { role: string }): Promise<Entreprise> {
    if (!user) throw new AuthorizationError();
    const entreprise = await entrepriseRepository.findById(id);
    if (!entreprise) {
      throw new NotFoundError(`Entreprise avec l'ID ${id} non trouvée.`);
    }
    return entreprise;
  },

  /**
   * Creates a new enterprise. Restrained to Admin, Manager, and AgentMarketing.
   * @param data - The enterprise data to create.
   * @param user - The acting authenticated user.
   * @returns The created enterprise.
   */
  async createEntreprise(data: Omit<Entreprise, "id">, user: { role: string }): Promise<Entreprise> {
    const allowedRoles = ["Administrateur", "Manager", "AgentMarketing"];
    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError("Vous n'êtes pas autorisé à créer une entreprise.");
    }

    if (!data.nom) {
      throw new Error("Le nom de l'entreprise est obligatoire.");
    }

    return entrepriseRepository.create(data);
  },

  /**
   * Updates an enterprise. Restrained to Admin and Manager.
   * @param id - Enterprise ID.
   * @param data - Partial update data.
   * @param user - The acting authenticated user.
   * @returns The updated enterprise.
   */
  async updateEntreprise(id: number, data: Partial<Omit<Entreprise, "id">>, user: { role: string }): Promise<Entreprise> {
    const allowedRoles = ["Administrateur", "Manager"];
    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError("Vous n'êtes pas autorisé à modifier une entreprise.");
    }

    const existing = await entrepriseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Entreprise avec l'ID ${id} non trouvée.`);
    }

    const updated = await entrepriseRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Entreprise avec l'ID ${id} non trouvée lors de la mise à jour.`);
    }
    return updated;
  },

  /**
   * Deletes an enterprise. Restrained to Admin only.
   * @param id - Enterprise ID.
   * @param user - The acting authenticated user.
   */
  async deleteEntreprise(id: number, user: { role: string }): Promise<boolean> {
    if (user.role !== "Administrateur") {
      throw new AuthorizationError("Seul l'Administrateur peut supprimer une entreprise.");
    }

    const existing = await entrepriseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Entreprise avec l'ID ${id} non trouvée.`);
    }

    return entrepriseRepository.delete(id);
  },
};
