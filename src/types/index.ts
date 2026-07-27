export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export type AdminTab = "users" | "logs" | "matrix";
export type UserTab = "host" | "matrix";

export interface LoginFormState {
  username: string;
  password: string;
}

export interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface NewUserFormState {
  username: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

export interface EditUserFormState {
  username: string;
  email: string;
  role: string;
  status: string;
  password?: string;
}

export interface Entreprise {
  id: number;
  nom: string;
  secteur: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  siteWeb: string | null;
}

export interface Lead {
  id: number;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  source: string | null;
  statut: string;
  priorite: string;
  score: number;
  valeurEstimee: number;
  dateCreation: string;
  derniereActivite: string;
  notes: string | null;
  entrepriseId: number | null;
  commercialId: number | null;
  entrepriseNom?: string | null;
  commercialNomComplet?: string | null;
}

export interface LeadFilters {
  source?: string;
  statut?: string;
  priorite?: string;
  search?: string;
}

export interface Activite {
  id: number;
  type: string;
  description: string | null;
  dateActivite: string;
  leadId: number;
  utilisateurId: number;
  utilisateurNomComplet?: string | null;
}

export interface Tache {
  id: number;
  titre: string;
  description: string | null;
  statut: string;
  dateEcheance: string;
  dateCreation: string;
  leadId: number;
  utilisateurId: number;
  leadNomComplet?: string | null;
  utilisateurNomComplet?: string | null;
}

export interface Devis {
  id: number;
  reference: string;
  montant: number;
  statut: string;
  dateCreation: string;
  leadId: number;
}

export interface Notification {
  id: number;
  titre: string;
  message: string;
  estLue: boolean;
  dateCreation: string;
  utilisateurId: number;
}

export interface GlobalMetrics {
  totalLeads: number;
  totalEstimatedValue: number;
  totalWonValue: number;
  overdueTasksCount: number;
}

export interface StatusMetric {
  statut: string;
  count: number;
}

export interface SourceMetric {
  source: string;
  count: number;
}

export interface CommercialPerformance {
  commercialId: number;
  nomComplet: string;
  assignedLeadsCount: number;
  totalEstimatedValue: number;
  wonLeadsCount: number;
  wonLeadsValue: number;
}

export interface DashboardKPIs {
  global: GlobalMetrics;
  byStatus: StatusMetric[];
  bySource: SourceMetric[];
  commercialPerformance: CommercialPerformance[];
}

