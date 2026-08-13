/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  Phone, 
  Mail, 
  Calendar,
  MessageSquare,
  Plus, 
  FileText, 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  User, 
  MapPin, 
  DollarSign, 
  FileSignature, 
  RefreshCw,
  X,
  FileSpreadsheet,
  Search,
  Building,
  LogOut,
  Trash2,
  Pencil,
  Bold,
  Italic,
  List,
  Link2,
  Paperclip,
  Smile,
  Send,
  Loader2
} from "lucide-react";
import { api, uploadFile, login, setAccessToken, API_URL, API_ROOT, sendEmail } from "../api";
import { 
  Lead, 
  Activity, 
  Task, 
  User as UserType, 
  Role, 
  LeadStatus, 
  LeadPriority, 
  LeadSource, 
  ActivityType, 
  Document,
  TaskStatus,
  TaskType
} from "../types";
import LeadForm from "./LeadForm";
import { usePreferences } from "../AppPreferences";

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "Prise de contact / Bienvenue",
    desc: "Premier contact après inscription ou intérêt.",
    defaultSubject: "Bienvenue chez LeadFlow - Prise de contact",
    defaultBody: "Bonjour [Nom],\n\nC'est un plaisir d'entrer en contact avec vous. J'ai bien reçu votre demande d'informations concernant nos services.\n\nQuelle serait votre meilleure disponibilité cette semaine pour un rapide échange téléphonique de 10 minutes afin de qualifier au mieux votre projet ?\n\nCordialement,\n[MonNom]"
  },
  {
    id: "proposal_followup",
    name: "Suivi de proposition commerciale",
    desc: "Suivi après envoi du devis ou de l'offre.",
    defaultSubject: "Suivi de notre proposition commerciale - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nJe me permets de vous recontacter afin de savoir si vous aviez pu prendre connaissance de la proposition commerciale envoyée récemment.\n\nAvez-vous des questions particulières ou des ajustements à y apporter ?\n\nDans l'attente de votre retour,\n[MonNom]"
  },
  {
    id: "meeting_confirm",
    name: "Confirmation de rendez-vous",
    desc: "Validation de l'heure et du lien de visioconférence.",
    defaultSubject: "Confirmation de notre rendez-vous",
    defaultBody: "Bonjour [Nom],\n\nJe vous confirme notre rendez-vous calé pour le [Date] à [Heure].\n\nVoici le lien d'accès à la visioconférence : [Lien]. Si vous rencontrez le moindre contretemps, n'hésitez pas à m'en informer.\n\nBonne journée,\n[MonNom]"
  },
  {
    id: "negotiation",
    name: "Offre / Ajustement tarifaire",
    desc: "Proposition finale ajustée aux contraintes budgétaires.",
    defaultSubject: "Ajustement budgétaire - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nFaisant suite à nos récents échanges, j'ai le plaisir de vous soumettre une offre finale réévaluée afin de mieux correspondre à vos contraintes budgétaires.\n\nVous trouverez le détail des remises de fin d'année sur votre espace client.\n\nCordialement,\n[MonNom]"
  }
];

interface LeadDetailsProps {
  activeTab?: string;
  lead: Lead | null;
  onBack: () => void;
  activities: Activity[];
  tasks: Task[];
  users: UserType[];
  activeUser: UserType;
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onAddTask: (task: Omit<Task, "id">) => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task> & { utilisateurId?: string }) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onTriggerQuote: (leadId: string) => void;
  leads?: Lead[];
  onSelectLead?: (id: string) => void;
  onAddLead?: (lead: Omit<Lead, "id" | "dateCreation" | "derniereActivite" | "documents" | "score">) => void;
}

const STEPS = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON,
  LeadStatus.LOST
];

export default function LeadDetails({
  activeTab = "leads",
  lead,
  onBack,
  activities,
  tasks,
  users,
  activeUser,
  onAddActivity,
  onAddTask,
  onUpdateLead,
  onUpdateTask,
  onDeleteTask,
  onDeleteLead,
  onTriggerQuote,
  leads = [],
  onSelectLead = () => {},
  onAddLead = () => {}
}: LeadDetailsProps) {
  const { t } = usePreferences();

  const translateStatus = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return t("kanban.nouveau");
      case LeadStatus.CONTACTED: return t("kanban.contacte");
      case LeadStatus.QUALIFIED: return t("kanban.qualifie");
      case LeadStatus.PROPOSAL: return t("kanban.proposition");
      case LeadStatus.NEGOTIATION: return t("kanban.negociation");
      case LeadStatus.WON: return t("kanban.gagne");
      case LeadStatus.LOST: return t("kanban.perdu");
      case LeadStatus.CLOSED: return t("kanban.ferme");
      default: return status;
    }
  };

  const translatePriority = (priority: LeadPriority) => {
    switch (priority) {
      case LeadPriority.LOW: return t("leadform.low");
      case LeadPriority.MEDIUM: return t("leadform.medium");
      case LeadPriority.HIGH: return t("leadform.high");
      default: return priority;
    }
  };

  const translateSource = (source: string) => {
    switch (source) {
      case "Site web": return t("source.website");
      case "Réseaux sociaux": return t("source.social");
      case "Recommandation": return t("source.referral");
      case "Emailing": return t("source.email");
      case "Salon professionnel": return t("source.salon");
      case "Appel téléphonique": return t("source.phone");
      default: return source;
    }
  };

  // Search & Filter state for the lead selector
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadPriorityFilter, setLeadPriorityFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [leadCommercialFilter, setLeadCommercialFilter] = useState("all");
  const [leadMinBudget, setLeadMinBudget] = useState("");
  const [leadMaxBudget, setLeadMaxBudget] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showEditTask, setShowEditTask] = useState<Task | null>(null);

  // States for company drill-down
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  
  // States
  const [quickNote, setQuickNote] = useState("");
  const [showLogModal, setShowLogModal] = useState<"call" | "email" | "meeting" | "task" | null>(null);
  
  // Quick logger form states
  const [logDesc, setLogDesc] = useState("");
  const [logDuration, setLogDuration] = useState(15);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCritique, setTaskCritique] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskType, setTaskType] = useState<TaskType>(TaskType.OTHER);

  // Email Composer states & helpers
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailAiTone, setEmailAiTone] = useState("professional");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const applyEmailTemplate = (tplId: string) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === tplId);
    if (tpl && lead) {
      const parsedSubj = tpl.defaultSubject.replace("[Nom]", `${lead.prenom} ${lead.nom}`);
      const parsedBody = tpl.defaultBody
        .replace("[Nom]", `${lead.prenom} ${lead.nom}`)
        .replace("[MonNom]", activeUser.nom);
      setEmailSubject(parsedSubj);
      setEmailBody(parsedBody);
    }
  };

  const handleAIGenerateEmail = async () => {
    if (!lead) return;
    setIsGeneratingEmail(true);
    try {
      const response = await api<{ subject: string; body: string }>("/ai/generate-email", {
        method: "POST",
        body: JSON.stringify({
          leadId: lead.id,
          tone: emailAiTone
        })
      });
      if (response.subject) setEmailSubject(response.subject);
      if (response.body) setEmailBody(response.body);
    } catch (e) {
      console.error(e);
      // Fallback
      setEmailSubject("Prise de contact");
      setEmailBody(`Bonjour ${lead.prenom} ${lead.nom},\n\nJe fais suite à notre intérêt mutuel pour qualifier votre projet.\n\nCordialement,\n${activeUser.nom}`);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!lead.email) {
      alert("Ce destinataire n'a pas d'adresse email configurée.");
      return;
    }
    if (!emailSubject || !emailBody) {
      alert("Le sujet et le contenu sont obligatoires.");
      return;
    }

    setIsSendingEmail(true);
    try {
      // 1. Send via backend API using current email configuration (Resend/SMTP)
      const res = await sendEmail({
        leadId: lead.id,
        subject: emailSubject,
        body: emailBody
      });

      // 2. Clear and close
      setEmailSubject("");
      setEmailBody("");
      setShowLogModal(null);

      // 3. Refresh activity timeline in UI
      onAddActivity({
        leadId: lead.id,
        type: ActivityType.EMAIL,
        date: new Date().toISOString(),
        auteur: activeUser.nom,
        description: `Email envoyé : Sujet : ${emailSubject}\n\n${emailBody}`
      });

      // Re-run AI analysis
      setTimeout(() => runAiAnalysis(true), 500);

      alert(res.message || "E-mail envoyé avec succès et enregistré dans l'historique !");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'envoi de l'e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Lead edit form state
  const [editLeadSociete, setEditLeadSociete] = useState(lead?.societe || "");
  const [editLeadNomProjet, setEditLeadNomProjet] = useState(lead?.nomProjet || "");
  const [editLeadPrenom, setEditLeadPrenom] = useState(lead?.prenom || "");
  const [editLeadNom, setEditLeadNom] = useState(lead?.nom || "");
  const [editLeadEmail, setEditLeadEmail] = useState(lead?.email || "");
  const [editLeadTelephone, setEditLeadTelephone] = useState(lead?.telephone || "");
  const [editLeadAdresse, setEditLeadAdresse] = useState(lead?.adresse || "");
  const [editLeadVille, setEditLeadVille] = useState(lead?.ville || "");
  const [editLeadPays, setEditLeadPays] = useState(lead?.pays || "");
  const [editLeadValeurEstimee, setEditLeadValeurEstimee] = useState(lead?.valeurEstimee || 0);
  const [editLeadNotes, setEditLeadNotes] = useState(lead?.notes || "");
  const [editLeadPriorite, setEditLeadPriorite] = useState<LeadPriority>(lead?.priorite || LeadPriority.MEDIUM);

  // Task edit form state
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskCritique, setEditTaskCritique] = useState(false);
  const [editTaskAssigneeId, setEditTaskAssigneeId] = useState<string>(activeUser.id);
  const [editTaskType, setEditTaskType] = useState<TaskType>(TaskType.OTHER);

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState<{
    score: number;
    actionRecommandee: string;
    meilleurMoment: string;
    opportunites: string[];
    risques: string[];
    resumeEchanges: string;
    loading: boolean;
    error: string | null;
  }>({
    score: lead ? lead.score : 0,
    actionRecommandee: "Chargement de la meilleure action recommandee...",
    meilleurMoment: "Chargement du meilleur moment de relance...",
    opportunites: [],
    risques: [],
    resumeEchanges: "Analyse des échanges en cours...",
    loading: false,
    error: null
  });

  // Filter activities and tasks for this specific lead
  const leadActivities = lead 
    ? activities.filter((a) => a.leadId === lead.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const leadTasks = lead 
    ? tasks.filter((t) => t.leadId === lead.id)
    : [];

  // Fetch AI Analysis from server
  const runAiAnalysis = async (force: boolean = false) => {
    if (!lead) return;
    setAiAnalysis((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Use backend AI analyze endpoint which persists score to the lead
      const data = await api<any>(`/ai/leads/${lead.id}/analyze`, { method: "POST" });

      const score = data?.scoreLead || data?.score || 0;
      setAiAnalysis({
        score,
        actionRecommandee: data.actionRecommandee || data.actionRecommandee || "",
        meilleurMoment: data.meilleurMoment || data.meilleurMoment || "",
        opportunites: data.opportunites || [],
        risques: data.alerte ? [data.alerte] : (data.risques || []),
        resumeEchanges: data.resumeEchanges || data.resumeEchanges || "",
        loading: false,
        error: null
      });

      // Update lead score in general list (persisted in backend)
      if (score !== lead.score) {
        onUpdateLead({ ...lead, score });
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis((prev) => ({
        ...prev,
        loading: false,
        error: "Erreur d'analyse. Utilisation des prédictions locales temporaires."
      }));
    }
  };

  // Trigger analysis on component mount or lead id change
  useEffect(() => {
    if (lead) {
      runAiAnalysis();
    }
  }, [lead?.id]);

  // Handle Note log
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;

    onAddActivity({
      leadId: lead.id,
      type: ActivityType.NOTE,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: quickNote.trim()
    });

    setQuickNote("");
    
    // Automatically trigger AI review
    setTimeout(() => runAiAnalysis(true), 500);
  };

  // Handle generic modal logging
  const handleLogInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    let type: ActivityType = ActivityType.CALL;
    let titlePrefix = "Appel sortant";

    if (showLogModal === "email") {
      type = ActivityType.EMAIL;
      titlePrefix = "Email envoyé";
    } else if (showLogModal === "meeting") {
      type = ActivityType.MEETING;
      titlePrefix = "Rendez-vous effectué";
    }

    onAddActivity({
      leadId: lead.id,
      type,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `${titlePrefix} : ${logDesc.trim()}`,
      dureeMinutes: showLogModal !== "email" ? logDuration : undefined
    });

    setLogDesc("");
    setShowLogModal(null);

    // Re-run AI analysis to adapt score & summary to new interaction!
    setTimeout(() => runAiAnalysis(true), 500);
  };

  const getTaskTypeBadge = (type?: TaskType) => {
    const tType = type || TaskType.OTHER;
    switch (tType) {
      case TaskType.CALL:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
            <Phone className="h-3 w-3" /> Appel
          </span>
        );
      case TaskType.EMAIL:
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
            <Mail className="h-3 w-3" /> Email
          </span>
        );
      case TaskType.MEETING:
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900">
            <Calendar className="h-3 w-3" /> RDV
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Autre
          </span>
        );
    }
  };

  // Handle Task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;

    onAddTask({
      leadId: lead.id,
      titre: taskTitle.trim(),
      description: "Tâche planifiée pour le suivi du prospect.",
      statut: "À faire" as any,
      dateEcheance: taskDueDate,
      assigneA: activeUser.nom,
      utilisateurId: activeUser.id,
      critique: taskCritique,
      type: taskType
    });

    setTaskTitle("");
    setTaskCritique(false);
    setTaskDueDate("");
    setTaskType(TaskType.OTHER);
    setShowLogModal(null);
  };

  const openEditTask = (task: Task) => {
    setShowEditTask(task);
    setEditTaskTitle(task.titre);
    setEditTaskDescription(task.description || "");
    setEditTaskDueDate(task.dateEcheance);
    setEditTaskCritique(task.critique);
    setEditTaskAssigneeId(task.utilisateurId || activeUser.id);
    setEditTaskType(task.type || TaskType.OTHER);
  };

  const handleSaveEditedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditTask) return;

    onUpdateTask?.(showEditTask.id, {
      titre: editTaskTitle.trim(),
      description: editTaskDescription.trim(),
      dateEcheance: editTaskDueDate,
      critique: editTaskCritique,
      utilisateurId: editTaskAssigneeId,
      type: editTaskType
    });
    setShowEditTask(null);
  };

  const handleOpenEditLead = () => {
    setEditLeadSociete(lead.societe);
    setEditLeadNomProjet(lead.nomProjet || "");
    setEditLeadPrenom(lead.prenom);
    setEditLeadNom(lead.nom);
    setEditLeadEmail(lead.email);
    setEditLeadTelephone(lead.telephone);
    setEditLeadAdresse(lead.adresse);
    setEditLeadVille(lead.ville);
    setEditLeadPays(lead.pays);
    setEditLeadValeurEstimee(lead.valeurEstimee);
    setEditLeadNotes(lead.notes);
    setEditLeadPriorite(lead.priorite);
    setShowEditLeadModal(true);
  };

  const handleSaveEditedLead = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLead({
      ...lead,
      societe: editLeadSociete,
      nomProjet: editLeadNomProjet,
      prenom: editLeadPrenom,
      nom: editLeadNom,
      email: editLeadEmail,
      telephone: editLeadTelephone,
      adresse: editLeadAdresse,
      ville: editLeadVille,
      pays: editLeadPays,
      valeurEstimee: editLeadValeurEstimee,
      notes: editLeadNotes,
      priorite: editLeadPriorite,
    });
    setShowEditLeadModal(false);
  };

  // Handle Email logging
  const handleLogEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    onAddActivity({
      leadId: lead.id,
      type: ActivityType.EMAIL,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `Email envoyé : ${logDesc.trim()}`
    });

    setLogDesc("");
    setShowLogModal(null);
  };

  // Handle Call logging
  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    onAddActivity({
      leadId: lead.id,
      type: ActivityType.CALL,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `Appel effectué : ${logDesc.trim()}`
    });

    setLogDesc("");
    setShowLogModal(null);
  };

  // Handle Meeting logging
  const handleLogMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    onAddActivity({
      leadId: lead.id,
      type: ActivityType.MEETING,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `Rendez-vous planifié : ${logDesc.trim()}`
    });

    setLogDesc("");
    setShowLogModal(null);
  };

  // Enforce Reassign Permission: Admin and Manager ONLY (page 5 matrix)
  const canReassign = activeUser.role === Role.ADMIN || activeUser.role === Role.MANAGER;

  // Enforce RBAC for delete and status change
  const canDeleteLead = activeUser.role === Role.ADMIN || activeUser.role === Role.MANAGER;

  // Enforce status change rules for Marketing
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (activeUser.role === Role.MARKETING) {
      const allowed = (lead.statut === LeadStatus.NEW && (newStatus === LeadStatus.QUALIFIED || newStatus === LeadStatus.CONTACTED));
      if (!allowed) {
        alert("En tant qu'Agent Marketing, vous pouvez uniquement qualifier un prospect 'Nouveau' vers 'Qualifié' ou 'Premier Contact'.");
        return;
      }
    }
    
    // Log the status change activity
    onAddActivity({
      leadId: lead.id,
      type: ActivityType.STATUS_CHANGE,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `Changement de statut : ${lead.statut} ➔ ${newStatus}`
    });

    // Persist status change to backend
    const statut = ({ "Nouveau":"Nouveau", "Contacté":"PremierContact", "Qualifié":"Qualification", "Proposition envoyée":"PropositionCommerciale", "Négociation":"Negociation", "Converti (Gagné)":"Gagne", "Perdu":"Perdu" }[newStatus] || newStatus);
    await api(`/leads/${lead.id}/status`, {method:"PATCH",body:JSON.stringify({statut})});
    
    onUpdateLead({ ...lead, statut: newStatus, derniereActivite: new Date().toISOString() });
    
    // Trigger AI re-evaluation
    setTimeout(() => runAiAnalysis(true), 500);
  };

  // Handle Simulated document drag & drop / upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lead || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadedDoc = await uploadFile<{
        id: string;
        nomFichier: string;
        cheminFichier: string;
        taille: number;
        dateAjout: string;
      }>(`/documents/leads/${lead.id}`, formData);

      onUpdateLead({
        ...lead,
        documents: [
          ...lead.documents,
          {
            id: uploadedDoc.id,
            nom: uploadedDoc.nomFichier,
            dateAjout: uploadedDoc.dateAjout,
            taille: `${(uploadedDoc.taille / 1024 / 1024).toFixed(1)} MB`,
            url: uploadedDoc.cheminFichier,
          },
        ],
      });

      onAddActivity({
        leadId: lead.id,
        type: ActivityType.NOTE,
        date: new Date().toISOString(),
        auteur: activeUser.nom,
        description: `Document ajouté : ${file.name}`,
      });
    } catch (error) {
      console.error(error);
      alert((error as Error)?.message || "Échec de l'upload du document.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  if (!lead) {
    if (activeTab === "companies" && selectedCompanyName) {
      const companyLeads = leads.filter(l => l.societe === selectedCompanyName);
      const firstLead = companyLeads[0];
      
      return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto max-h-screen text-slate-850" id="company-detail-root">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Back button & Header */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  onClick={() => setSelectedCompanyName(null)}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-500 mb-2 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour aux Entreprises
                </button>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="h-5.5 w-5.5 text-blue-600" />
                  {selectedCompanyName}
                </h2>
                <p className="text-slate-500 text-xs mt-1 dark:text-slate-400">
                  {firstLead.adresse}, {firstLead.ville}, {firstLead.pays}
                </p>
              </div>
              
              <div className="bg-blue-50/50 border border-blue-150 rounded-lg p-3 dark:bg-slate-800 dark:border-slate-700">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Portefeuille Total</span>
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {companyLeads.reduce((sum, l) => sum + l.valeurEstimee, 0).toLocaleString('fr-FR')} MAD
                </span>
              </div>
            </div>

            {/* List of Opportunities / Leads for this company */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-[11px]">
                Dossiers d'opportunités ({companyLeads.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyLeads.map(l => (
                  <div 
                    key={l.id}
                    onClick={() => onSelectLead(l.id)}
                    className="border border-slate-200 p-4 rounded-xl hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          l.statut === LeadStatus.WON 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450" 
                            : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400"
                        }`}>
                          {translateStatus(l.statut)}
                        </span>
                        
                        <span className="text-[10px] text-slate-405">
                          Priorité {translatePriority(l.priorite)}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 mb-1.5">
                        {l.nomProjet || `Opportunité - ${l.prenom} ${l.nom}`}
                      </h4>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Contact : {l.prenom} {l.nom}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {l.email} | {l.telephone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-105 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider block">Budget Estimé</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-205 text-sm">
                          {l.valeurEstimee.toLocaleString('fr-FR')} MAD
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-600 font-bold hover:text-blue-500 flex items-center gap-1 dark:text-blue-400">
                        Ouvrir le dossier <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "companies") {
      const uniqueCompanies = Array.from(new Set(leads.map(l => l.societe))).map(societeName => {
        const companyLeads = leads.filter(l => l.societe === societeName);
        const mainLead = companyLeads[0];
        const totalBudget = companyLeads.reduce((sum, cl) => sum + cl.valeurEstimee, 0);
        const avgScore = Math.round(companyLeads.reduce((sum, cl) => sum + cl.score, 0) / companyLeads.length);
        return {
          id: mainLead.id,
          name: societeName,
          leads: companyLeads,
          leadsCount: companyLeads.length,
          totalBudget,
          city: mainLead.ville,
          country: mainLead.pays,
          address: mainLead.adresse,
          phone: mainLead.telephone,
          email: mainLead.email,
          priority: mainLead.priorite,
          status: mainLead.statut,
          score: avgScore,
          commercial: users.find(u => u.id === mainLead.commercialId)?.nom || t("lead.unassigned")
        };
      });

      const filteredCompanies = uniqueCompanies.filter(c => {
        const matchesSearch = 
          c.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
          c.city.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
          c.country.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
          c.leads.some(cl => 
            `${cl.prenom} ${cl.nom}`.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
            cl.email.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
            cl.telephone.toLowerCase().includes(leadSearchTerm.toLowerCase())
          );
        if (!matchesSearch) return false;

        if (leadStatusFilter !== "all" && !c.leads.some(cl => cl.statut === leadStatusFilter)) return false;
        if (leadPriorityFilter !== "all" && !c.leads.some(cl => cl.priorite === leadPriorityFilter)) return false;
        if (leadSourceFilter !== "all" && !c.leads.some(cl => cl.source === leadSourceFilter)) return false;
        if (leadCommercialFilter !== "all") {
          if (leadCommercialFilter === "unassigned") {
            if (c.leads.some(cl => cl.commercialId)) return false;
          } else {
            if (!c.leads.some(cl => cl.commercialId === leadCommercialFilter)) return false;
          }
        }
        if (leadMinBudget && c.totalBudget < Number(leadMinBudget)) return false;
        if (leadMaxBudget && c.totalBudget > Number(leadMaxBudget)) return false;

        return true;
      });

      const totalPortfolioValue = uniqueCompanies.reduce((sum, c) => sum + c.totalBudget, 0);
      const avgPortfolioValue = Math.round(totalPortfolioValue / (uniqueCompanies.length || 1));

      return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto max-h-screen text-slate-850" id="companies-directory-root">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* Header section with inline KPIs */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
                {t("lead.title.companies")}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t("lead.totalCompanies")} :</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{uniqueCompanies.length}</span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t("lead.cumulatedOpps")} :</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{totalPortfolioValue.toLocaleString('fr-FR')} MAD</span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t("lead.avgBudget")} :</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-450">{avgPortfolioValue.toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              {/* Search Input (Full Width of Card) */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs dark:bg-slate-900 dark:border-slate-800">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("lead.searchCompanyPlaceholder")}
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Filter Controls (6-Column Grid) */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Étape du prospect</label>
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  >
                    <option value="all">{t("lead.allCompanyStages")}</option>
                    {Object.values(LeadStatus).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Priorité</label>
                  <select
                    value={leadPriorityFilter}
                    onChange={(e) => setLeadPriorityFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  >
                    <option value="all">Toutes</option>
                    <option value={LeadPriority.LOW}>Basse</option>
                    <option value={LeadPriority.MEDIUM}>Moyenne</option>
                    <option value={LeadPriority.HIGH}>Haute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Source d'acquisition</label>
                  <select
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-305"
                  >
                    <option value="all">Toutes les sources</option>
                    {Object.values(LeadSource).map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Assigné à</label>
                  <select
                    value={leadCommercialFilter}
                    onChange={(e) => setLeadCommercialFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  >
                    <option value="all">Tout l'équipe</option>
                    <option value="unassigned">Non attribué</option>
                    {users.filter(u => u.role === Role.COMMERCIAL).map(u => (
                      <option key={u.id} value={u.id}>{u.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Min Budget (MAD)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={leadMinBudget}
                    onChange={(e) => setLeadMinBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px] dark:text-slate-400">Max Budget (MAD)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={leadMaxBudget}
                    onChange={(e) => setLeadMaxBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Grid list of Companies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanies.map(c => (
                <div 
                  key={c.name}
                  onClick={() => {
                    setSelectedCompanyName(c.name);
                  }}
                  className="bg-white border border-slate-200 p-5 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg dark:bg-slate-800">
                          <Building className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h4>
                          <span className="text-[10px] text-slate-400">{c.leadsCount} opportunité(s)</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === LeadStatus.WON 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450" 
                          : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-450"
                      }`}>
                        {translateStatus(c.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div>
                        <span className="text-slate-400 block">{t("lead.accountValue")}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.totalBudget.toLocaleString('fr-FR')} MAD</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t("lead.city")}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{c.city}, {c.country}</span>
                      </div>
                    </div>

                    {/* Contacts and Opportunities details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider block">Contacts & Opportunités</span>
                      <div className="space-y-1.5">
                        {c.leads.map(cl => {
                          const projName = cl.nomProjet || `Opportunité - ${cl.prenom} ${cl.nom}`;
                          return (
                            <div key={cl.id} className="text-[11px] text-slate-650 dark:text-slate-400 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 dark:text-slate-205">{projName}</span>
                                <span className="text-slate-350 dark:text-slate-600">-</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {cl.valeurEstimee.toLocaleString('fr-FR')} MAD ({translateStatus(cl.statut)})
                                </span>
                              </div>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                                Contact : {cl.prenom} {cl.nom} ({cl.email} | {cl.telephone})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="text-slate-400">{t("lead.referent")}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{c.commercial}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{t("lead.avgScore")}</span>
                      <span className={`font-bold ${c.score >= 80 ? "text-emerald-600" : c.score >= 60 ? "text-amber-600" : "text-slate-500"}`}>
                        {c.score}/100
                      </span>
                    </div>
                    <span className="text-blue-600 font-bold flex items-center gap-1 hover:text-blue-500 dark:text-blue-400">
                      {t("lead.viewCard")} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}

              {filteredCompanies.length === 0 && (
                <div className="col-span-2 bg-white border border-slate-200 p-12 text-center text-slate-400 text-xs rounded-xl shadow-sm">
                  {t("lead.noCompanyResults")}
                </div>
              )}
            </div>
          </div>
          </div>
      );
    }

    const filteredLeads = leads.filter(l => {
      const matchesSearch = 
        l.societe.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        l.nom.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        l.prenom.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        l.ville.toLowerCase().includes(leadSearchTerm.toLowerCase());
      const matchesStatus = leadStatusFilter === "all" || l.statut === leadStatusFilter;
      const matchesPriority = leadPriorityFilter === "all" || l.priorite === leadPriorityFilter;
      const matchesSource = leadSourceFilter === "all" || l.source === leadSourceFilter;
      const matchesCommercial = leadCommercialFilter === "all" || 
        (leadCommercialFilter === "unassigned" ? !l.commercialId : l.commercialId === leadCommercialFilter);
      const matchesMinBudget = !leadMinBudget || l.valeurEstimee >= Number(leadMinBudget);
      const matchesMaxBudget = !leadMaxBudget || l.valeurEstimee <= Number(leadMaxBudget);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesCommercial && matchesMinBudget && matchesMaxBudget;
    });

    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto max-h-screen text-slate-850" id="lead-selector-root">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                <FileText className="h-5.5 w-5.5 text-blue-600" />
                {t("lead.title.leads")}
              </h2>
            </div>
            {activeUser.role !== Role.COMMERCIAL && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                {t("lead.createImport")}
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Input (Full Width of Card) */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("lead.searchPlaceholder")}
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter Controls (6-Column Grid) */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs shadow-sm">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Étape du prospect</label>
                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none"
                >
                  <option value="all">{t("lead.allStages")}</option>
                  {Object.values(LeadStatus).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Priorité</label>
                <select
                  value={leadPriorityFilter}
                  onChange={(e) => setLeadPriorityFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none"
                >
                  <option value="all">Toutes</option>
                  <option value={LeadPriority.LOW}>Basse</option>
                  <option value={LeadPriority.MEDIUM}>Moyenne</option>
                  <option value={LeadPriority.HIGH}>Haute</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Source d'acquisition</label>
                <select
                  value={leadSourceFilter}
                  onChange={(e) => setLeadSourceFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none"
                >
                  <option value="all">Toutes les sources</option>
                  {Object.values(LeadSource).map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Assigné à</label>
                <select
                  value={leadCommercialFilter}
                  onChange={(e) => setLeadCommercialFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none"
                >
                  <option value="all">Tout l'équipe</option>
                  <option value="unassigned">Non attribué</option>
                  {users.filter(u => u.role === Role.COMMERCIAL).map(u => (
                    <option key={u.id} value={u.id}>{u.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Min Budget (MAD)</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={leadMinBudget}
                  onChange={(e) => setLeadMinBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">Max Budget (MAD)</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={leadMaxBudget}
                  onChange={(e) => setLeadMaxBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Grid list of Leads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.map(l => (
              <div 
                key={l.id}
                onClick={() => onSelectLead(l.id)}
                className="bg-white border border-slate-200 p-5 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between hover:bg-slate-50 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{l.nomProjet || `Opportunité - ${l.societe || `${l.prenom} ${l.nom}`}`}</h4>
                      <p className="text-slate-500 text-xs">{l.societe ? `${l.societe} • ` : ""}Contact : {l.prenom} {l.nom}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.statut === LeadStatus.WON 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {translateStatus(l.statut)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-4 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400 block">{t("lead.budget")}</span>
                      <span className="font-bold text-slate-800">{l.valeurEstimee.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{t("lead.city")}</span>
                      <span className="font-semibold text-slate-800 truncate block">{l.ville}, {l.pays}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{t("lead.score")}</span>
                    <span className={`font-bold ${l.score >= 80 ? "text-emerald-600" : l.score >= 60 ? "text-amber-600" : "text-slate-500"}`}>
                      {l.score}/100
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold flex items-center gap-1 hover:text-blue-500">
                    {t("lead.viewFile")} <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {filteredLeads.length === 0 && (
              <div className="col-span-2 bg-white border border-slate-200 p-12 text-center text-slate-400 text-xs rounded-xl shadow-sm">
                {t("lead.noResults")}
              </div>
            )}
          </div>
        </div>

        {/* Modal for Lead creation/import */}
        {showCreateModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative cursor-default">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-900">{t("lead.addImportTitle")}</h3>
                <p className="text-slate-500 text-[10px]">{t("lead.addImportSubtitle")}</p>
              </div>
              <LeadForm 
                onAddLead={(newLead) => {
                  onAddLead(newLead);
                  setShowCreateModal(false);
                }}
                commercials={users.filter(u => u.role === Role.COMMERCIAL).map(u => ({ id: u.id, nom: u.nom }))}
                existingLeads={leads || []}
              />
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-800 dark:bg-slate-950" id="lead-details-root">
      <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Back button & Stepper Header */}
      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors self-start bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
          id="back-to-pipeline-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("lead.backOpportunities")}
        </button>

        {/* Stepper Status Progression */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{lead.nomProjet || `Opportunité - ${lead.societe || `${lead.prenom} ${lead.nom}`}`}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">({lead.societe} — {lead.prenom} {lead.nom})</span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {STEPS.map((step, idx) => {
              const isCurrent = lead.statut === step;
              const isPast = STEPS.indexOf(lead.statut) >= idx;

              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => handleStatusChange(step)}
                    className={`px-3 py-1 text-xs rounded-full font-semibold transition-all duration-150 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : isPast
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-slate-50 text-slate-400 border border-slate-100"
                    }`}
                  >
                    {translateStatus(step)}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 ${isPast ? "bg-slate-200" : "bg-slate-100"}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl mb-6 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal("call")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            Appel
          </button>
          <button
            onClick={() => setShowLogModal("email")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Mail className="h-4 w-4 text-amber-600" />
            Email
</button>
          <button
            onClick={() => setShowLogModal("meeting")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Calendar className="h-4 w-4 text-purple-600" />
            Rendez-vous
          </button>
          <button
            onClick={() => setShowLogModal("task")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Plus className="h-4 w-4 text-pink-600" />
            Tâche
          </button>
        </div>

        {/* Generate Quote / Devis Button */}
<div className="flex items-center gap-2 flex-wrap">
            {activeUser.role !== Role.MARKETING && (
              <button
                onClick={() => onTriggerQuote(lead.id)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                id="generate-quote-btn"
              >
                <FileSignature className="h-4 w-4" />
                Créer devis & proposition
              </button>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenEditLead}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200"
                title="Modifier ce lead"
              >
                <Pencil className="h-4 w-4" />
                Modifier le lead
              </button>
              {canDeleteLead && onDeleteLead && (
                <button
                  onClick={() => onDeleteLead(lead.id)}
                  className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-rose-200"
                  title="Supprimer ce lead"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer le lead
                </button>
              )}
            </div>
          </div>
      </div>

      {/* Grid: Details (Left Column) vs AI Panel (Right Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 parts broad) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Enterprise Info & Commercial Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
              {t("lead.recordTitle")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Box 1: Company details */}
              <div className="space-y-3">
                <p className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold">{t("lead.companyInfo")}</p>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-24">{t("lead.company")}</span>
                  <span className="text-slate-900 font-semibold">{lead.societe}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-24">{t("lead.contact")}</span>
                  <span className="text-slate-900 font-semibold">{lead.prenom} {lead.nom}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-24">{t("lead.phone")}</span>
                  <span className="text-slate-700">{lead.telephone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-24">{t("login.email")} :</span>
                  <span className="text-slate-700 truncate">{lead.email}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-medium w-24">{t("lead.address")}</span>
                  <span className="text-slate-700 flex-1">{lead.adresse}, {lead.ville}, {lead.pays}</span>
                </div>
              </div>

              {/* Box 2: Commercial details */}
              <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <p className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold">{t("lead.oppSettings")}</p>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-36">{t("lead.estimatedBudget")}</span>
                  <span className="text-emerald-600 font-bold text-sm">
                    {lead.valeurEstimee.toLocaleString('fr-FR')} MAD
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-36">{t("lead.priority")} :</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lead.priorite === LeadPriority.HIGH 
                      ? "bg-rose-55 text-rose-700 border border-rose-200" 
                      : lead.priorite === LeadPriority.MEDIUM 
                      ? "bg-amber-55 text-amber-700 border border-amber-200" 
                      : "bg-blue-55 text-blue-700 border border-blue-200"
                  }`}>
                    {translatePriority(lead.priorite)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-medium w-36">{t("lead.source")} :</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 font-semibold">{translateSource(lead.source)}</span>
                </div>

                {/* Reassignment Control based on RBAC */}
                <div className="flex items-center gap-2.5 pt-1.5">
                  <span className="text-slate-400 font-medium w-36">{t("lead.assignedCommercial")}</span>
                  {canReassign ? (
                    <select
                      value={lead.commercialId || ""}
                      onChange={(e) => onUpdateLead({ ...lead, commercialId: e.target.value })}
                      className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- {t("lead.unassigned")} --</option>
                      {users.filter(u => u.role === Role.COMMERCIAL).map((u) => (
                        <option key={u.id} value={u.id}>{u.nom}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-700">
                      {users.find(u => u.id === lead.commercialId)?.nom || t("lead.unassigned")}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 italic mt-2">
                  Créé le {new Date(lead.dateCreation).toLocaleDateString("fr-FR")}
                </div>
              </div>

            </div>
          </div>

          {/* Section: Timeline & Quick Comments */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
              Historique des interactions & timeline
            </h3>

            {/* Quick Comment Field */}
            <form onSubmit={handleAddQuickNote} className="flex gap-2.5 mb-6">
              <input
                type="text"
                placeholder="Rédiger un commentaire rapide ou une note de suivi..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="flex-1 bg-slate-50 text-xs text-slate-700 placeholder-slate-400 rounded-lg px-3.5 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-lg text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                Commenter
              </button>
            </form>

            {/* Timeline */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {leadActivities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Aucun historique d'échange. Utilisez les boutons ci-dessus pour passer des appels ou envoyer des emails.
                </div>
              ) : (
                leadActivities.map((act) => {
                  let badgeColor = "bg-slate-100 text-slate-600";
                  if (act.type === ActivityType.CALL) badgeColor = "bg-blue-50 text-blue-600 border border-blue-200";
                  if (act.type === ActivityType.EMAIL) badgeColor = "bg-amber-50 text-amber-600 border border-amber-200";
                  if (act.type === ActivityType.MEETING) badgeColor = "bg-purple-50 text-purple-600 border border-purple-200";
                  if (act.type === ActivityType.STATUS_CHANGE) badgeColor = "bg-emerald-50 text-emerald-600 border border-emerald-200";

                  return (
                    <div key={act.id} className="relative pl-6 pb-2.5 last:pb-0 text-xs border-l border-slate-200">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-200 border-2 border-white"></span>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                            {act.type}
                          </span>
                          <span className="font-bold text-slate-700">{act.auteur}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {act.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Documents & Uploads */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
              Pièces Jointes & Fichiers Associés
            </h3>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {lead.documents.length === 0 ? (
                <div className="md:col-span-2 py-6 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                  Aucun document lié
                </div>
              ) : (
                lead.documents.map((doc) => {
                  const docPath = doc.url || (doc as any).cheminFichier || "";
                  const docHref = docPath.startsWith("http") ? docPath : `${API_ROOT}${docPath}`;

                  return (
                    <a
                      key={doc.id}
                      href={docHref || "#"}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate hover:text-blue-600" title={doc.nom}>
                            {doc.nom}
                          </p>
                          <p className="text-[10px] text-slate-400">{doc.taille} • {doc.dateAjout}</p>
                        </div>
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            {/* Upload form simulation */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-xl py-6 px-4 text-center cursor-pointer transition-all">
              <Upload className="h-6 w-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-600">Glisser-déposer ou cliquer pour ajouter un fichier</span>
              <span className="text-[10px] text-slate-400 mt-1">PDF, Word, Excel (Max 10MB)</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

        </div>

        {/* Right Column: AI Assistant (1 part broad) */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <h4 className="font-bold text-sm text-slate-900">Assistant IA Intégré</h4>
              </div>
              <button
                onClick={() => runAiAnalysis(true)}
                disabled={aiAnalysis.loading}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-850 transition-colors"
                title="Relancer l'évaluation intelligente"
              >
                <RefreshCw className={`h-4 w-4 ${aiAnalysis.loading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>

            {/* Score circle */}
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={aiAnalysis.score >= 80 ? "#10b981" : aiAnalysis.score >= 60 ? "#f59e0b" : "#94a3b8"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - aiAnalysis.score / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-xl font-extrabold text-slate-900">
                  {aiAnalysis.score}
                </span>
              </div>
              <p className="font-bold text-xs text-slate-800 mt-2.5">
                {aiAnalysis.score >= 80 ? "Probabilité d'achat Très Élevée" : aiAnalysis.score >= 60 ? "Probabilité Modérée" : "Faible Intérêt / Froid"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Score de lead calculé par l'IA</p>
            </div>

            {/* Recommendation block */}
            <div className="space-y-4 text-xs mt-3">
              
              {/* Box 1: Recomm action */}
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-lg space-y-1.5">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Action immédiate recommandée :
                </span>
                <p className="text-slate-850 font-semibold leading-relaxed">
                  {aiAnalysis.actionRecommandee}
                </p>
              </div>

              {/* Box 2: Best moment */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-550">Meilleur moment de relance :</p>
                  <p className="font-bold text-slate-800 text-xs">{aiAnalysis.meilleurMoment}</p>
                </div>
              </div>

              {/* Highlights & Warning */}
              <div className="space-y-3.5 pt-2">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase">Points forts / Opportunités :</p>
                  <ul className="space-y-1.5">
                    {aiAnalysis.opportunites.map((op, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700 leading-relaxed pl-1.5 border-l-2 border-emerald-500">
                        {op}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase">Points de vigilance / Risques :</p>
                  <ul className="space-y-1.5">
                    {aiAnalysis.risques.map((rk, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700 leading-relaxed pl-1.5 border-l-2 border-rose-500">
                        {rk}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase">Résumé automatique des échanges :</p>
                  <p className="text-slate-600 italic leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    "{aiAnalysis.resumeEchanges}"
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Section: Active Tasks Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase">Tâches à faire</h4>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 border border-slate-200">
                {leadTasks.length} planifiée(s)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {leadTasks.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  Aucune tâche enregistrée.
                </div>
              ) : (
                leadTasks.map((t) => {
                  const isDone = t.statut === "Terminée";
                  return (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isDone}
                        readOnly
                        className="mt-0.5 rounded text-blue-600 bg-white border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                              {t.titre}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Échéance : {t.dateEcheance}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {onDeleteTask && (
                              <button
                                type="button"
                                onClick={() => onDeleteTask(t.id)}
                                className="text-rose-500 hover:text-rose-700 rounded-full p-1 transition-colors"
                                title="Supprimer cette tâche"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {onUpdateTask && (
                              <button
                                type="button"
                                onClick={() => openEditTask(t)}
                                className="text-slate-500 hover:text-blue-600 rounded-full p-1 transition-colors"
                                title="Modifier cette tâche"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 items-center text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <Building className="h-3 w-3 text-blue-600" />
                            <span className="font-semibold text-slate-700">{users.find(u => u.id === t.utilisateurId)?.nom || t.assigneA}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isDone ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {t.statut}
                          </span>
                          {getTaskTypeBadge(t.type)}
                          {t.critique && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              Urgent
                            </span>
                          )}
                          {onUpdateTask && (
                            <button
                              type="button"
                              onClick={() => onUpdateTask(t.id, { statut: isDone ? TaskStatus.TODO : TaskStatus.DONE })}
                              className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold"
                            >
                              {isDone ? "Réouvrir" : "Marquer comme terminée"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Interaction Modal popup simulation */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`bg-white border border-slate-200 rounded-xl w-full ${showLogModal === "email" ? "max-w-2xl" : "max-w-md"} overflow-hidden text-slate-800 shadow-2xl dark:bg-slate-900 dark:border-slate-800`}>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center dark:bg-slate-850 dark:border-slate-800">
              <h4 className="font-bold text-sm flex items-center gap-2 dark:text-white">
                {showLogModal === "call" && <><Phone className="h-4.5 w-4.5 text-blue-600" /> Enregistrer un Appel</>}
                {showLogModal === "email" && <><Mail className="h-4.5 w-4.5 text-blue-605" /> Rédiger &amp; Envoyer un Email</>}
                {showLogModal === "meeting" && <><Calendar className="h-4.5 w-4.5 text-purple-600" /> Enregistrer un Rendez-vous</>}
                {showLogModal === "task" && <><Plus className="h-4.5 w-4.5 text-pink-600" /> Créer une nouvelle Tâche</>}
              </h4>
              <button onClick={() => setShowLogModal(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-850 transition-colors dark:hover:bg-slate-800">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {showLogModal === "email" ? (
              <form onSubmit={handleSendEmail} className="p-5 space-y-4 text-xs dark:text-slate-200">
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl dark:bg-slate-955 dark:border-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{lead?.nomProjet || `Opportunité - ${lead?.societe || `${lead?.prenom} ${lead?.nom}`}`}</span>
                    <span className="text-[10px] text-slate-550 dark:text-slate-400 block mt-1 font-semibold">{lead?.societe}</span>
                    <span className="text-[9px] text-slate-405 block mt-1 leading-none">Contact : {lead?.prenom} {lead?.nom} • {lead?.email} {lead?.telephone ? `• ${lead?.telephone}` : ""}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Destinataire</span>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Appliquer un modèle :</label>
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                    {EMAIL_TEMPLATES.map(tpl => (
                      <button type="button" key={tpl.id} onClick={() => applyEmailTemplate(tpl.id)} className="text-left p-2.5 rounded-lg border border-slate-150 hover:border-blue-500 hover:bg-blue-50/10 transition-all dark:border-slate-800 dark:hover:bg-slate-800/65 text-[10px] cursor-pointer">
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{tpl.name}</p>
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{tpl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-purple-50/30 border border-purple-100 p-3 rounded-lg dark:bg-purple-950/10 dark:border-purple-900/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-800 flex items-center gap-1 text-[10px] dark:text-purple-405">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Rédacteur IA
                    </span>
                    <select value={emailAiTone} onChange={(e) => setEmailAiTone(e.target.value)} className="bg-white border border-slate-200 rounded p-1 text-[10px] focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                      <option value="professional">Professionnel</option>
                      <option value="friendly">Amical</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <button type="button" onClick={handleAIGenerateEmail} disabled={isGeneratingEmail} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded text-[10px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                    {isGeneratingEmail ? <><Loader2 className="h-3 w-3 animate-spin" /> Génération...</> : <><Sparkles className="h-3 w-3" /> Rédiger avec l'IA</>}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Objet du message :</label>
                  <input type="text" required placeholder="Ex: Suite à notre appel de ce matin..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Message :</label>
                  <textarea rows={8} required placeholder="Rédigez votre email ici..." value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full bg-slate-50 rounded-lg p-3 border border-slate-200 text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white leading-relaxed font-sans" />
                </div>
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowLogModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer dark:bg-slate-880 dark:text-slate-300 dark:hover:bg-slate-700">Annuler</button>
                  <button type="submit" disabled={isSendingEmail} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50">
                    {isSendingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer et Enregistrer</>}
                  </button>
                </div>
              </form>
            ) : showLogModal !== "task" ? (
              <form onSubmit={handleLogInteraction} className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Description de l'échange :</label>
                  <textarea rows={4} required placeholder={showLogModal === "call" ? "Résumé de la conversation..." : "Sujet de la réunion..."} value={logDesc} onChange={(e) => setLogDesc(e.target.value)} className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Durée estimée (minutes) :</label>
                  <input type="number" required min={1} max={240} value={logDuration} onChange={(e) => setLogDuration(Number(e.target.value))} className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowLogModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-500/10">Enregistrer</button>
                </div>
              </form>
            ) : (
              // Task Creation Form
              <form onSubmit={handleCreateTask} className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Intitulé de la tâche :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Recontacter pour proposition commerciale, envoyer brochure..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Date d'échéance :</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Type de tâche :</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value={TaskType.CALL}>Appeler</option>
                    <option value={TaskType.EMAIL}>Envoyer un email</option>
                    <option value={TaskType.MEETING}>Rendez-vous</option>
                    <option value={TaskType.OTHER}>Autre / Relance</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 pt-1.5">
                  <input
                    type="checkbox"
                    id="task-critique"
                    checked={taskCritique}
                    onChange={(e) => setTaskCritique(e.target.checked)}
                    className="rounded text-blue-600 bg-white border-slate-300"
                  />
                  <label htmlFor="task-critique" className="text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
                    Marquer cette tâche comme critique / urgente
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-500/10"
                  >
                    Créer la Tâche
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {showEditTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden text-slate-800 shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="h-4.5 w-4.5 text-blue-600" />
                Modifier la tâche
              </h4>
              <button onClick={() => setShowEditTask(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-850 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedTask} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Titre de la tâche :</label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Description :</label>
                <textarea
                  rows={3}
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Échéance :</label>
                  <input
                    type="date"
                    required
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Assigner à :</label>
                  <select
                    value={editTaskAssigneeId}
                    onChange={(e) => setEditTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Type de tâche :</label>
                  <select
                    value={editTaskType}
                    onChange={(e) => setEditTaskType(e.target.value as TaskType)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value={TaskType.CALL}>Appeler</option>
                    <option value={TaskType.EMAIL}>Envoyer un email</option>
                    <option value={TaskType.MEETING}>Rendez-vous</option>
                    <option value={TaskType.OTHER}>Autre / Relance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="edit-task-critique"
                  type="checkbox"
                  checked={editTaskCritique}
                  onChange={(e) => setEditTaskCritique(e.target.checked)}
                  className="rounded text-blue-600 bg-white border-slate-300"
                />
                <label htmlFor="edit-task-critique" className="text-[11px] text-slate-600 font-semibold select-none">
                  Tâche critique / urgente
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-500/10"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden text-slate-800 shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="h-4.5 w-4.5 text-blue-600" />
                Modifier les informations du lead
              </h4>
              <button onClick={() => setShowEditLeadModal(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-850 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedLead} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Société</label>
                  <input
                    type="text"
                    required
                    value={editLeadSociete}
                    onChange={(e) => setEditLeadSociete(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Nom du Projet / Offre</label>
                  <input
                    type="text"
                    required
                    value={editLeadNomProjet}
                    onChange={(e) => setEditLeadNomProjet(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Prénom</label>
                  <input
                    type="text"
                    required
                    value={editLeadPrenom}
                    onChange={(e) => setEditLeadPrenom(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Nom</label>
                  <input
                    type="text"
                    required
                    value={editLeadNom}
                    onChange={(e) => setEditLeadNom(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={editLeadEmail}
                    onChange={(e) => setEditLeadEmail(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Téléphone</label>
                  <input
                    type="text"
                    value={editLeadTelephone}
                    onChange={(e) => setEditLeadTelephone(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Ville</label>
                  <input
                    type="text"
                    value={editLeadVille}
                    onChange={(e) => setEditLeadVille(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Pays</label>
                  <input
                    type="text"
                    value={editLeadPays}
                    onChange={(e) => setEditLeadPays(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Budget estimé</label>
                  <input
                    type="number"
                    value={editLeadValeurEstimee}
                    onChange={(e) => setEditLeadValeurEstimee(Number(e.target.value))}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Priorité</label>
                  <select
                    value={editLeadPriorite}
                    onChange={(e) => setEditLeadPriorite(e.target.value as LeadPriority)}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value={LeadPriority.LOW}>Basse</option>
                    <option value={LeadPriority.MEDIUM}>Moyenne</option>
                    <option value={LeadPriority.HIGH}>Haute</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Notes internes</label>
                <textarea
                  rows={4}
                  value={editLeadNotes}
                  onChange={(e) => setEditLeadNotes(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLeadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-500/10"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}



