/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  ADMIN = "Administrateur",
  MANAGER = "Manager",
  COMMERCIAL = "Commercial",
  MARKETING = "Agent Marketing",
}

export enum LeadSource {
  WEBSITE = "Site web",
  SOCIAL = "Réseaux sociaux",
  REFERRAL = "Recommandation",
  EMAIL = "Emailing",
  SALON = "Salon professionnel",
  PHONE = "Appel téléphonique",
}

export enum LeadStatus {
  NEW = "Nouveau",
  CONTACTED = "Contacté",
  QUALIFIED = "Qualifié",
  PROPOSAL = "Proposition envoyée",
  NEGOTIATION = "Négociation",
  WON = "Converti (Gagné)",
  LOST = "Perdu",
  CLOSED = "Fermé",
}

export enum LeadPriority {
  LOW = "Basse",
  MEDIUM = "Moyenne",
  HIGH = "Haute",
}

export enum TaskStatus {
  TODO = "À faire",
  IN_PROGRESS = "En cours",
  DONE = "Terminée",
}

export enum ActivityType {
  CALL = "Appel",
  EMAIL = "Email",
  MEETING = "Rendez-vous",
  NOTE = "Note",
  TASK = "Tâche",
  STATUS_CHANGE = "Changement de statut",
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
  telephone: string;
  avatar?: string;
  actif: boolean;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  date: string;
  auteur: string;
  description: string;
  dureeMinutes?: number;
}

export interface Task {
  id: string;
  leadId: string;
  titre: string;
  description?: string;
  statut: TaskStatus;
  dateEcheance: string;
  assigneA: string; // user ID or name
  utilisateurId?: string;
  critique: boolean;
}

export interface Document {
  id: string;
  nom: string;
  dateAjout: string;
  taille: string;
  url?: string;
}

export interface Lead {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  societe: string;
  adresse: string;
  ville: string;
  pays: string;
  source: LeadSource;
  statut: LeadStatus;
  priorite: LeadPriority;
  score: number; // AI score (0-100)
  commercialId?: string; // ID of assigned user
  valeurEstimee: number; // budget
  dateCreation: string;
  derniereActivite: string;
  notes: string;
  documents: Document[];
}

export interface SystemNotification {
  id: string;
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  type: "info" | "warning" | "success";
  leadId?: string;
  taskId?: string;
}

export interface Quote {
  id: string;
  leadId: string;
  reference: string;
  dateEmission: string;
  dateValidite: string;
  montant: number;
  statut: "Brouillon" | "Envoyé" | "Accepté" | "Refusé";
  articles: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

export interface LoginFormState {
  username: string;
  password: string;
}
