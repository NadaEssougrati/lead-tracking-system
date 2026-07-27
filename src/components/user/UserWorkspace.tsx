import React, { useState, useEffect } from "react";
import { 
  Lead, 
  UserProfile, 
  Entreprise, 
  Activite, 
  Tache, 
  Devis 
} from "../../types";
import { leadApi } from "../../services/leadApi";
import { entrepriseApi } from "../../services/entrepriseApi";
import { tacheApi } from "../../services/tacheApi";
import { devisApi } from "../../services/devisApi";
import PipelineKanban from "./PipelineKanban";
import { 
  X, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  CheckSquare, 
  FileText, 
  CornerDownRight, 
  LogOut,
  ChevronDown
} from "lucide-react";

interface UserWorkspaceProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const UserWorkspace: React.FC<UserWorkspaceProps> = ({ currentUser, onLogout }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead Form state
  const [newLeadForm, setNewLeadForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    pays: "France",
    source: "SiteWeb",
    priorite: "Moyenne",
    score: 60,
    valeurEstimee: 15000,
    notes: "",
    entrepriseId: ""
  });

  // Selected Lead Details tab states & sub-resource logs
  const [detailsTab, setDetailsTab] = useState<"activities" | "tasks" | "quotes">("activities");
  const [activities, setActivities] = useState<Activite[]>([]);
  const [tasks, setTasks] = useState<Tache[]>([]);
  const [quotes, setQuotes] = useState<Devis[]>([]);

  // Sub-resource logging forms states
  const [newActivityForm, setNewActivityForm] = useState({ type: "Appel", description: "" });
  const [newTaskForm, setNewTaskForm] = useState({ titre: "", description: "", dateEcheance: "" });
  const [newQuoteForm, setNewQuoteForm] = useState({ reference: "", montant: 5000 });

  const token = localStorage.getItem("jwt_token") || "";

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const leadsList = await leadApi.getLeads(token);
      setLeads(leadsList);

      const entreprisesList = await entrepriseApi.getEntreprises(token);
      setEntreprises(entreprisesList);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les données du workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, newStatus: string) => {
    try {
      const updated = await leadApi.changeLeadStatus(token, leadId, newStatus);
      // Update local state
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, statut: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, statut: newStatus } : null);
      }
      // Re-fetch activities log to show transition log
      if (selectedLead && selectedLead.id === leadId) {
        loadLeadSubResources(leadId);
      }
    } catch (err: any) {
      alert("Erreur de modification du statut: " + err.message);
    }
  };

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsTab("activities");
    loadLeadSubResources(lead.id);
  };

  const loadLeadSubResources = async (leadId: number) => {
    try {
      const actList = await leadApi.getActivities(token, leadId);
      setActivities(actList);

      const taskList = await leadApi.getTasks(token, leadId);
      setTasks(taskList);

      const quoteList = await leadApi.getDevis(token, leadId);
      setQuotes(quoteList);
    } catch (err) {
      console.error("Erreur de chargement des dépendances du lead ID", leadId, err);
    }
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newLeadForm,
        entrepriseId: newLeadForm.entrepriseId ? parseInt(newLeadForm.entrepriseId) : null,
        statut: "Nouveau"
      };
      await leadApi.createLead(token, payload);
      setIsCreateModalOpen(false);
      setNewLeadForm({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: "",
        ville: "",
        pays: "France",
        source: "SiteWeb",
        priorite: "Moyenne",
        score: 60,
        valeurEstimee: 15000,
        notes: "",
        entrepriseId: ""
      });
      fetchWorkspaceData();
    } catch (err: any) {
      alert("Erreur de création du lead: " + err.message);
    }
  };

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newActivityForm.description.trim()) return;

    try {
      await leadApi.createActivity(token, selectedLead.id, newActivityForm.type, newActivityForm.description);
      setNewActivityForm({ type: "Appel", description: "" });
      loadLeadSubResources(selectedLead.id);
    } catch (err: any) {
      alert("Erreur de journalisation: " + err.message);
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newTaskForm.titre.trim() || !newTaskForm.dateEcheance) return;

    try {
      await tacheApi.createTask(token, {
        titre: newTaskForm.titre,
        description: newTaskForm.description,
        statut: "A_Faire",
        dateEcheance: newTaskForm.dateEcheance,
        leadId: selectedLead.id,
      });
      setNewTaskForm({ titre: "", description: "", dateEcheance: "" });
      loadLeadSubResources(selectedLead.id);
    } catch (err: any) {
      alert("Erreur de création de tâche: " + err.message);
    }
  };

  const handleCreateQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newQuoteForm.reference.trim()) return;

    try {
      await devisApi.createDevis(token, {
        reference: newQuoteForm.reference,
        montant: Number(newQuoteForm.montant),
        statut: "Brouillon",
        leadId: selectedLead.id
      });
      setNewQuoteForm({ reference: "", montant: 5000 });
      loadLeadSubResources(selectedLead.id);
    } catch (err: any) {
      alert("Erreur de génération de devis: " + err.message);
    }
  };

  const handleQuoteStatusChange = async (devisId: number, status: string) => {
    try {
      await devisApi.changeDevisStatus(token, devisId, status);
      if (selectedLead) loadLeadSubResources(selectedLead.id);
    } catch (err: any) {
      alert("Erreur de modification du devis: " + err.message);
    }
  };

  const handleTaskToggle = async (task: Tache) => {
    try {
      const nextStatus = task.statut === "Terminee" ? "A_Faire" : "Terminee";
      await tacheApi.updateTask(token, task.id, { statut: nextStatus });
      if (selectedLead) loadLeadSubResources(selectedLead.id);
    } catch (err: any) {
      alert("Erreur de modification de la tâche: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50 dark:bg-drac-bg">
      {/* Workspace Header */}
      <header className="h-16 shrink-0 border-b border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rosepine-iris/10 text-rosepine-iris rounded-xl border border-rosepine-iris/25">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-dracl-fg dark:text-white uppercase tracking-wider">
              Espace Commercial & Pipeline
            </h1>
            <p className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment uppercase mt-0.5">
              Connecté en tant que: {currentUser.username} ({currentUser.role})
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-xs font-mono font-bold text-rosepine-love bg-rosepine-love/10 hover:bg-rosepine-love/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border border-rosepine-love/15"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-drac-bg/70 z-10">
            <span className="font-mono text-xs text-rosepine-iris animate-pulse uppercase tracking-wider">
              Chargement des Pistes de Vente...
            </span>
          </div>
        ) : error ? (
          <div className="p-6 text-center max-w-md mx-auto mt-20 bg-rosepine-love/10 border border-rosepine-love/30 text-rosepine-love rounded-2xl font-mono text-xs">
            {error}
          </div>
        ) : (
          <PipelineKanban
            leads={leads}
            currentUser={currentUser}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onSelectLead={handleSelectLead}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}
      </div>

      {/* -------------------- 1. CREATE LEAD MODAL -------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="bg-dracl-card dark:bg-drac-card border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-dracl-sub/30 dark:bg-drac-sub/30">
              <h3 className="text-xs font-bold text-dracl-fg dark:text-white uppercase tracking-wider">
                Créer une nouvelle fiche Lead
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-dracl-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLeadSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.prenom}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, prenom: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.nom}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, nom: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="contact@exemple.com"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.telephone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, telephone: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="0601020304"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Entreprise Rattrapée
                  </label>
                  <select
                    value={newLeadForm.entrepriseId}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, entrepriseId: e.target.value })}
                    className="blunt-input text-xs"
                  >
                    <option value="">Aucune (Particulier)</option>
                    {entreprises.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.nom} - {ent.secteur || "Secteur inconnu"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Source du Prospect
                  </label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="blunt-input text-xs"
                  >
                    <option value="SiteWeb">Site Web</option>
                    <option value="Email">Email</option>
                    <option value="Telephone">Téléphone</option>
                    <option value="Publicite">Publicité</option>
                    <option value="Salons">Salons</option>
                    <option value="Recommandation">Recommandation</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Priorité
                  </label>
                  <select
                    value={newLeadForm.priorite}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priorite: e.target.value })}
                    className="blunt-input text-xs"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Valeur Estimée (DH)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.valeurEstimee}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, valeurEstimee: parseInt(e.target.value) || 0 })}
                    className="blunt-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Score initial (0-100)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.score}
                    min="0"
                    max="100"
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, score: parseInt(e.target.value) || 50 })}
                    className="blunt-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.ville}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, ville: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="Casablanca"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.adresse}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, adresse: e.target.value })}
                    className="blunt-input text-xs"
                    placeholder="Boulevard d'Anfa"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase block mb-1">
                  Notes descriptives
                </label>
                <textarea
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="blunt-input text-xs min-h-[80px]"
                  placeholder="Intérêt particulier pour..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-rosepine-iris hover:bg-rosepine-iris/90 text-white font-bold py-2.5 text-xs rounded-xl cursor-pointer"
                >
                  Ajouter au CRM
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 bg-neutral-100 dark:bg-neutral-800 text-dracl-fg hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold py-2.5 text-xs rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- 2. LEAD DETAILS DRAWER -------------------- */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="bg-dracl-card dark:bg-drac-card border-l border-neutral-200 dark:border-neutral-800 w-full max-w-xl h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-dracl-sub/30 dark:bg-drac-sub/30">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-dracl-fg dark:text-white truncate">
                  {selectedLead.prenom} {selectedLead.nom}
                </h3>
                <p className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment uppercase mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-rosepine-rose" />
                  {selectedLead.entrepriseNom || "Client Particulier"}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-dracl-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer border border-neutral-200/40 dark:border-neutral-800/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-drac-bg flex items-center justify-between text-xs font-mono select-none">
              <div>
                <span className="text-[10px] font-bold text-dracl-muted uppercase block">Valeur estimée</span>
                <span className="font-bold text-dracl-fg dark:text-white">{new Intl.NumberFormat("fr-MA").format(selectedLead.valeurEstimee)} DH</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-dracl-muted uppercase block">Statut Actuel</span>
                <span className="font-bold text-rosepine-iris">{selectedLead.statut}</span>
              </div>
              <div className="flex items-center gap-1 bg-rosepine-gold/10 px-2 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-rosepine-gold" />
                <span className="font-bold text-rosepine-gold">{selectedLead.score}</span>
              </div>
            </div>

            {/* General Lead Contact card */}
            <div className="p-5 border-b border-neutral-250/20 dark:border-neutral-800/20 grid grid-cols-2 gap-3 text-[11px] font-mono shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-dracl-muted" />
                <a href={`mailto:${selectedLead.email}`} className="text-rosepine-iris hover:underline truncate">{selectedLead.email || "Non renseigné"}</a>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Phone className="w-3.5 h-3.5 text-dracl-muted" />
                <span>{selectedLead.telephone || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-2 truncate col-span-2">
                <MapPin className="w-3.5 h-3.5 text-dracl-muted" />
                <span>{selectedLead.adresse ? `${selectedLead.adresse}, ${selectedLead.ville || ""}` : `${selectedLead.ville || "Ville inconnue"}`}</span>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-neutral-250/20 dark:border-neutral-800/20 bg-dracl-sub/10 shrink-0">
              <button
                onClick={() => setDetailsTab("activities")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  detailsTab === "activities"
                    ? "border-rosepine-iris text-rosepine-iris"
                    : "border-transparent text-dracl-muted"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Activités ({activities.length})
              </button>
              <button
                onClick={() => setDetailsTab("tasks")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  detailsTab === "tasks"
                    ? "border-rosepine-iris text-rosepine-iris"
                    : "border-transparent text-dracl-muted"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Tâches ({tasks.length})
              </button>
              <button
                onClick={() => setDetailsTab("quotes")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  detailsTab === "quotes"
                    ? "border-rosepine-iris text-rosepine-iris"
                    : "border-transparent text-dracl-muted"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Devis ({quotes.length})
              </button>
            </div>

            {/* Tab contents */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* TAB 1: ACTIVITIES */}
              {detailsTab === "activities" && (
                <div className="space-y-4">
                  {/* Log new activity */}
                  <form onSubmit={handleAddActivitySubmit} className="p-4 bg-dracl-sub/30 dark:bg-drac-card/30 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-mono font-bold text-dracl-fg dark:text-neutral-300 uppercase">
                        Enregistrer une activité
                      </h4>
                      <select
                        value={newActivityForm.type}
                        onChange={(e) => setNewActivityForm({ ...newActivityForm, type: e.target.value })}
                        className="bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg text-[10px] font-mono font-bold uppercase px-2 py-1 rounded"
                      >
                        <option value="Appel">Appel Téléphonique</option>
                        <option value="Email">E-mail Envoyé</option>
                        <option value="RendezVous">Rendez-vous Réalisé</option>
                        <option value="Note">Note Interne</option>
                      </select>
                    </div>
                    <textarea
                      required
                      placeholder="Saisissez le compte rendu détaillé de l'interaction..."
                      value={newActivityForm.description}
                      onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                      className="blunt-input text-xs min-h-[60px]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-rosepine-iris text-white font-bold py-1.5 text-xs rounded-xl cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </form>

                  {/* History timeline list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase">
                      Historique des interactions
                    </h4>
                    {activities.length === 0 ? (
                      <p className="text-[11px] font-mono text-dracl-muted italic">Aucune activité enregistrée.</p>
                    ) : (
                      activities.map(act => (
                        <div key={act.id} className="p-3 border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono text-[9px]">
                            <span className="font-bold bg-rosepine-iris/10 text-rosepine-iris px-1.5 py-0.5 rounded uppercase">
                              {act.type}
                            </span>
                            <span className="text-dracl-muted">
                              {new Date(act.dateActivite).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <p className="text-dracl-fg dark:text-neutral-200 leading-normal pl-1">
                            {act.description}
                          </p>
                          <div className="text-[8px] font-mono text-dracl-muted text-right">
                            Log par: {act.utilisateurNomComplet || "Système"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS */}
              {detailsTab === "tasks" && (
                <div className="space-y-4">
                  {/* Create Task Form */}
                  <form onSubmit={handleAddTaskSubmit} className="p-4 bg-dracl-sub/30 dark:bg-drac-card/30 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-dracl-fg dark:text-neutral-300 uppercase">
                      Programmer un rappel ou une tâche
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Titre de la tâche..."
                        value={newTaskForm.titre}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, titre: e.target.value })}
                        className="blunt-input text-xs"
                      />
                      <input
                        type="date"
                        required
                        value={newTaskForm.dateEcheance}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, dateEcheance: e.target.value })}
                        className="blunt-input text-xs font-mono"
                      />
                    </div>
                    <textarea
                      placeholder="Description additionnelle..."
                      value={newTaskForm.description}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                      className="blunt-input text-xs min-h-[50px]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-rosepine-iris text-white font-bold py-1.5 text-xs rounded-xl cursor-pointer"
                    >
                      Ajouter la tâche
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase">
                      Tâches planifiées
                    </h4>
                    {tasks.length === 0 ? (
                      <p className="text-[11px] font-mono text-dracl-muted italic">Aucune tâche en suspens.</p>
                    ) : (
                      tasks.map(task => {
                        const isDone = task.statut === "Terminee";
                        return (
                          <div 
                            key={task.id} 
                            className={`p-3 border border-neutral-200/60 dark:border-neutral-800/40 rounded-xl text-xs flex items-start gap-3 transition-colors ${
                              isDone ? "bg-neutral-50/50 dark:bg-drac-card/20 opacity-60" : "bg-dracl-card dark:bg-drac-card"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleTaskToggle(task)}
                              className="mt-1 shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-bold ${isDone ? "line-through text-dracl-muted" : "text-dracl-fg dark:text-white"}`}>
                                {task.titre}
                              </h5>
                              {task.description && (
                                <p className="text-[11px] text-dracl-muted dark:text-drac-comment mt-0.5 leading-normal">
                                  {task.description}
                                </p>
                              )}
                              <div className="text-[9px] font-mono text-rosepine-love mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Échéance: {new Date(task.dateEcheance).toLocaleDateString("fr-FR")}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: QUOTES */}
              {detailsTab === "quotes" && (
                <div className="space-y-4">
                  {/* Create Quote Form - Restricted for Marketing */}
                  {currentUser.role !== "marketing" ? (
                    <form onSubmit={handleCreateQuoteSubmit} className="p-4 bg-dracl-sub/30 dark:bg-drac-card/30 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-dracl-fg dark:text-neutral-300 uppercase">
                        Générer un devis proposition
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Référence (ex: DEV-2026-09)..."
                          value={newQuoteForm.reference}
                          onChange={(e) => setNewQuoteForm({ ...newQuoteForm, reference: e.target.value })}
                          className="blunt-input text-xs font-mono"
                        />
                        <input
                          type="number"
                          required
                          value={newQuoteForm.montant}
                          onChange={(e) => setNewQuoteForm({ ...newQuoteForm, montant: parseInt(e.target.value) || 0 })}
                          className="blunt-input text-xs font-mono"
                          placeholder="Montant en DH"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-rosepine-iris text-white font-bold py-1.5 text-xs rounded-xl cursor-pointer"
                      >
                        Générer la proposition
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 border border-rosepine-gold/20 bg-rosepine-gold/5 rounded-xl text-[11px] font-mono text-rosepine-gold">
                      ℹ️ Les agents marketing ne sont pas autorisés à générer des offres commerciales.
                    </div>
                  )}

                  {/* Quotes List */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-dracl-muted dark:text-drac-comment uppercase">
                      Propositions de devis
                    </h4>
                    {quotes.length === 0 ? (
                      <p className="text-[11px] font-mono text-dracl-muted italic">Aucun devis généré.</p>
                    ) : (
                      quotes.map(quote => (
                        <div key={quote.id} className="p-3 border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-dracl-fg dark:text-white flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-dracl-muted" />
                              {quote.reference}
                            </span>
                            <span className="font-bold text-rosepine-iris">
                              {new Intl.NumberFormat("fr-MA").format(quote.montant)} DH
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-[9px] font-mono text-dracl-muted">
                              Créé le: {new Date(quote.dateCreation).toLocaleDateString("fr-FR")}
                            </div>

                            {/* Quote Status select */}
                            {currentUser.role !== "marketing" ? (
                              <select
                                value={quote.statut}
                                onChange={(e) => handleQuoteStatusChange(quote.id, e.target.value)}
                                className="bg-dracl-sub dark:bg-drac-sub border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg text-[9px] font-mono px-2 py-0.5 rounded cursor-pointer"
                              >
                                <option value="Brouillon">Brouillon</option>
                                <option value="Envoye">Envoyé</option>
                                <option value="Accepte">Accepté (Signé)</option>
                                <option value="Refuse">Refusé</option>
                              </select>
                            ) : (
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-dracl-muted">
                                {quote.statut}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
