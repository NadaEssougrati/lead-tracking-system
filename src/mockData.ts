/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role, LeadSource, LeadStatus, LeadPriority, TaskStatus, ActivityType, User, Lead, Activity, Task, SystemNotification, Quote, TaskType } from "./types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    nom: "Nada El Amrani",
    email: "nada@leedpro.com",
    role: Role.ADMIN,
    telephone: "+212 600-0001",
    actif: true,
  },
  {
    id: "user-2",
    nom: "Assia Belkhadir",
    email: "assia@leedpro.com",
    role: Role.MANAGER,
    telephone: "+212 600-0002",
    actif: true,
  },
  {
    id: "user-3",
    nom: "Mohamed El Fassi",
    email: "mohamed@leedpro.com",
    role: Role.COMMERCIAL,
    telephone: "+212 600-0003",
    actif: true,
  },
  {
    id: "user-4",
    nom: "M. Tarik (Tuteur)",
    email: "tarik@leedpro.com",
    role: Role.MANAGER,
    telephone: "+212 600-0004",
    actif: true,
  },
  {
    id: "user-5",
    nom: "Alex Martin",
    email: "alex.martin@leedpro.com",
    role: Role.COMMERCIAL,
    telephone: "+212 655-4321",
    actif: true,
  },
  {
    id: "user-6",
    nom: "Sophie Laurent",
    email: "sophie.l@leedpro.com",
    role: Role.MARKETING,
    telephone: "+212 677-8899",
    actif: true,
  }
];

export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    nom: "Dupont",
    prenom: "Jean",
    email: "j.dupont@techsolutions.fr",
    telephone: "+33 1 42 43 55 20",
    societe: "TechSolutions",
    adresse: "55 Rue de Londres",
    ville: "Paris",
    pays: "France",
    source: LeadSource.WEBSITE,
    statut: LeadStatus.NEW,
    priorite: LeadPriority.HIGH,
    score: 87,
    commercialId: "user-3",
    valeurEstimee: 42500,
    dateCreation: "2026-07-10T10:00:00Z",
    derniereActivite: "2026-07-16T15:30:00Z",
    notes: "Société de services numériques recherchant un outil d'automatisation des relances. Décideur principal intéressé par un déploiement rapide.",
    nomProjet: "Automatisation Relances Marketing",
    documents: [
      { id: "doc-1", nom: "Cahier_des_charges_TechSolutions.pdf", dateAjout: "2026-07-10", taille: "1.2 MB" },
      { id: "doc-2", nom: "Proposition_V1_TechSolutions.pdf", dateAjout: "2026-07-14", taille: "850 KB" }
    ]
  },
  {
    id: "lead-2",
    nom: "Gomez",
    prenom: "Lucia",
    email: "l.gomez@mediterranee-retail.es",
    telephone: "+34 91 555 1234",
    societe: "Med Retail",
    adresse: "Paseo de la Castellana 120",
    ville: "Madrid",
    pays: "Espagne",
    source: LeadSource.SALON,
    statut: LeadStatus.CONTACTED,
    priorite: LeadPriority.MEDIUM,
    score: 65,
    commercialId: "user-5",
    valeurEstimee: 28900,
    dateCreation: "2026-07-08T09:15:00Z",
    derniereActivite: "2026-07-15T11:00:00Z",
    notes: "Rencontrée au salon Retail Expo. Souhaite connecter son ERP actuel avec notre Tracking Lead System.",
    nomProjet: "Intégration ERP & Tracking",
    documents: [
      { id: "doc-3", nom: "Note_Interne_MedRetail.docx", dateAjout: "2026-07-09", taille: "150 KB" }
    ]
  },
  {
    id: "lead-3",
    nom: "Smith",
    prenom: "William",
    email: "w.smith@globaltech.com",
    telephone: "+1 555-0199",
    societe: "GlobalTech Inc",
    adresse: "100 Innovation Way",
    ville: "Boston",
    pays: "États-Unis",
    source: LeadSource.EMAIL,
    statut: LeadStatus.QUALIFIED,
    priorite: LeadPriority.HIGH,
    score: 92,
    commercialId: "user-3",
    valeurEstimee: 156200,
    dateCreation: "2026-07-05T14:22:00Z",
    derniereActivite: "2026-07-16T17:10:00Z",
    notes: "Projet d'envergure internationale. Budget validé. Besoin de fonctionnalités d'analyse prédictive IA avancées.",
    nomProjet: "Analyse Prédictive IA",
    documents: [
      { id: "doc-4", nom: "GlobalTech_RFP_Response.pdf", dateAjout: "2026-07-06", taille: "4.5 MB" }
    ]
  },
  {
    id: "lead-4",
    nom: "Sidi",
    prenom: "Omar",
    email: "o.sidi@casanet.ma",
    telephone: "+212 522-334455",
    societe: "CasaNet",
    adresse: "Anfa Place, Bd de la Corniche",
    ville: "Casablanca",
    pays: "Maroc",
    source: LeadSource.REFERRAL,
    statut: LeadStatus.PROPOSAL,
    priorite: LeadPriority.MEDIUM,
    score: 74,
    commercialId: "user-5",
    valeurEstimee: 38500,
    dateCreation: "2026-07-01T11:05:00Z",
    derniereActivite: "2026-07-14T10:00:00Z",
    notes: "Recommandé par notre client historique Atlas IT. Demande de devis envoyé le 12 Juillet. En attente de validation.",
    nomProjet: "Tracking Leads de Vente",
    documents: [
      { id: "doc-5", nom: "Devis_CasaNet_2026_V1.pdf", dateAjout: "2026-07-12", taille: "1.1 MB" }
    ]
  },
  {
    id: "lead-5",
    nom: "Müller",
    prenom: "Hans",
    email: "h.muller@munichautomotive.de",
    telephone: "+49 89 1234567",
    societe: "Munich Automotive",
    adresse: "Leopoldstraße 24",
    ville: "Munich",
    pays: "Allemagne",
    source: LeadSource.SOCIAL,
    statut: LeadStatus.NEGOTIATION,
    priorite: LeadPriority.HIGH,
    score: 82,
    commercialId: "user-3",
    valeurEstimee: 245000,
    dateCreation: "2026-06-25T08:30:00Z",
    derniereActivite: "2026-07-16T09:00:00Z",
    notes: "Négociation finale concernant les remises de volume et les niveaux de support SLA.",
    nomProjet: "Contrat Volume Automobile",
    documents: [
      { id: "doc-6", nom: "Contrat_MunichAuto_SLA.docx", dateAjout: "2026-07-05", taille: "2.3 MB" }
    ]
  },
  {
    id: "lead-6",
    nom: "Bouaziz",
    prenom: "Yassine",
    email: "y.bouaziz@maroc-solutions.co.ma",
    telephone: "+212 537-889900",
    societe: "Maroc Solutions",
    adresse: "Avenue de l'Atlas",
    ville: "Rabat",
    pays: "Maroc",
    source: LeadSource.PHONE,
    statut: LeadStatus.WON,
    priorite: LeadPriority.HIGH,
    score: 98,
    commercialId: "user-5",
    valeurEstimee: 52000,
    dateCreation: "2026-06-20T16:00:00Z",
    derniereActivite: "2026-07-10T14:30:00Z",
    notes: "Affaire conclue! Contrat signé pour 36 mois. Phase d'onboarding planifiée pour la fin du mois.",
    documents: [
      { id: "doc-7", nom: "Contrat_Signe_MarocSolutions.pdf", dateAjout: "2026-07-10", taille: "3.4 MB" }
    ]
  },
  {
    id: "lead-7",
    nom: "Durand",
    prenom: "Sophie",
    email: "s.durand@bricolage-direct.fr",
    telephone: "+33 4 90 80 70 60",
    societe: "Brico Direct",
    adresse: "Zone Industrielle Nord",
    ville: "Lyon",
    pays: "France",
    source: LeadSource.WEBSITE,
    statut: LeadStatus.LOST,
    priorite: LeadPriority.LOW,
    score: 18,
    commercialId: "user-3",
    valeurEstimee: 12500,
    dateCreation: "2026-06-15T10:45:00Z",
    derniereActivite: "2026-07-02T16:00:00Z",
    notes: "Opportunité perdue. Concurrence trop forte sur les prix d'entrée de gamme, et manque de fonctionnalités e-commerce spécifiques.",
    documents: []
  },
  {
    id: "lead-8",
    nom: "Alami",
    prenom: "Hassan",
    email: "hassan.alami@fespneu.ma",
    telephone: "+212 535-667788",
    societe: "Fès Pneumatiques",
    adresse: "Zone Industrielle Dokkarat",
    ville: "Fès",
    pays: "Maroc",
    source: LeadSource.WEBSITE,
    statut: LeadStatus.NEW,
    priorite: LeadPriority.MEDIUM,
    score: 58,
    commercialId: "user-3",
    valeurEstimee: 18000,
    dateCreation: "2026-07-14T11:00:00Z",
    derniereActivite: "2026-07-14T11:05:00Z",
    notes: "Nouveau lead entré via le formulaire de contact du site web. Demande d'informations générales.",
    documents: []
  }
];

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    leadId: "lead-1",
    type: ActivityType.CALL,
    date: "2026-07-11T14:30:00Z",
    auteur: "Mohamed El Fassi",
    description: "Appel de qualification. Présentation rapide de la plateforme. Grand intérêt pour la fonction de suivi automatique des interactions.",
    dureeMinutes: 15
  },
  {
    id: "act-2",
    leadId: "lead-1",
    type: ActivityType.EMAIL,
    date: "2026-07-12T09:15:00Z",
    auteur: "Mohamed El Fassi",
    description: "Envoi de la plaquette commerciale et de l'accès de démonstration standard.",
  },
  {
    id: "act-3",
    leadId: "lead-1",
    type: ActivityType.MEETING,
    date: "2026-07-15T10:00:00Z",
    auteur: "Mohamed El Fassi",
    description: "Visioconférence de démonstration détaillée. Présence du directeur technique et de l'acheteur principal.",
    dureeMinutes: 45
  },
  {
    id: "act-4",
    leadId: "lead-1",
    type: ActivityType.NOTE,
    date: "2026-07-16T15:30:00Z",
    auteur: "Mohamed El Fassi",
    description: "Note : Préparer une offre personnalisée incluant l'intégration API pour leur outil ERP.",
  },
  {
    id: "act-5",
    leadId: "lead-2",
    type: ActivityType.MEETING,
    date: "2026-07-09T16:00:00Z",
    auteur: "Alex Martin",
    description: "Rencontre physique au stand lors du salon. Discussion sur les problématiques d'attribution des leads.",
    dureeMinutes: 20
  },
  {
    id: "act-6",
    leadId: "lead-3",
    type: ActivityType.EMAIL,
    date: "2026-07-06T11:00:00Z",
    auteur: "Mohamed El Fassi",
    description: "Réponse à leur appel d'offres (RFP). Envoi du dossier complet de proposition technique.",
  },
  {
    id: "act-7",
    leadId: "lead-3",
    type: ActivityType.CALL,
    date: "2026-07-16T17:10:00Z",
    auteur: "Mohamed El Fassi",
    description: "Appel téléphonique. William Smith confirme la bonne réception de la proposition et planifie le comité de sélection pour le 22 Juillet.",
    dureeMinutes: 10
  }
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    leadId: "lead-1",
    titre: "Préparer la proposition tarifaire",
    description: "Calculer les coûts d'intégration ERP et d'onboarding.",
    statut: TaskStatus.TODO,
    dateEcheance: "2026-07-20",
    assigneA: "Mohamed El Fassi",
    critique: true,
    type: TaskType.OTHER
  },
  {
    id: "task-2",
    leadId: "lead-1",
    titre: "Rappel d'introduction",
    description: "Faire le suivi après l'envoi de la démo.",
    statut: TaskStatus.DONE,
    dateEcheance: "2026-07-13",
    assigneA: "Mohamed El Fassi",
    critique: false,
    type: TaskType.CALL
  },
  {
    id: "task-3",
    leadId: "lead-2",
    titre: "Qualifier le besoin technique",
    description: "Vérifier la compatibilité avec leur ERP SAP.",
    statut: TaskStatus.IN_PROGRESS,
    dateEcheance: "2026-07-18",
    assigneA: "Alex Martin",
    critique: true,
    type: TaskType.MEETING
  },
  {
    id: "task-4",
    leadId: "lead-3",
    titre: "Vérifier le contrat légal",
    description: "Faire valider la clause de juridiction par notre avocat.",
    statut: TaskStatus.TODO,
    dateEcheance: "2026-07-25",
    assigneA: "Mohamed El Fassi",
    critique: false,
    type: TaskType.OTHER
  },
  {
    id: "task-5",
    leadId: "lead-5",
    titre: "Négocier la remise volume",
    description: "Appeler Hans Müller pour discuter de la réduction de 5%.",
    statut: TaskStatus.IN_PROGRESS,
    dateEcheance: "2026-07-19",
    assigneA: "Mohamed El Fassi",
    critique: true,
    type: TaskType.CALL
  }
];

export const mockQuotes: Quote[] = [
  {
    id: "quote-1",
    leadId: "lead-1",
    reference: "DEV-2026-0001",
    dateEmission: "2026-07-14",
    dateValidite: "2026-08-14",
    montant: 42500,
    statut: "Brouillon",
    articles: [
      { description: "Licence Annuelle Tracking Lead System (Entreprise)", quantite: 1, prixUnitaire: 35000 },
      { description: "Module IA Recommandations Intelligentes", quantite: 1, prixUnitaire: 4500 },
      { description: "Prestation de Services d'Intégration", quantite: 6, prixUnitaire: 500 }
    ]
  },
  {
    id: "quote-2",
    leadId: "lead-4",
    reference: "DEV-2026-0002",
    dateEmission: "2026-07-12",
    dateValidite: "2026-08-12",
    montant: 38500,
    statut: "Envoyé",
    articles: [
      { description: "Licence Annuelle Tracking Lead System (Pro)", quantite: 1, prixUnitaire: 25000 },
      { description: "Services d'Onboarding et Formation", quantite: 1, prixUnitaire: 8500 },
      { description: "Heures d'Assistance Technique Dédiée", quantite: 10, prixUnitaire: 500 }
    ]
  }
];

export const mockNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    titre: "Nouveau lead attribué",
    message: "Le lead 'Jean Dupont' (TechSolutions) vous a été attribué.",
    date: "2026-07-10T10:05:00Z",
    lue: false,
    type: "info",
  },
  {
    id: "notif-2",
    titre: "Tâche en retard",
    message: "La tâche 'Rappel d'introduction' pour 'TechSolutions' est à faire d'urgence.",
    date: "2026-07-13T09:00:00Z",
    lue: false,
    type: "warning",
  },
  {
    id: "notif-3",
    titre: "Opportunité Gagnée !",
    message: "Le lead 'Maroc Solutions' a été converti en client.",
    date: "2026-07-10T14:30:00Z",
    lue: true,
    type: "success",
  }
];
