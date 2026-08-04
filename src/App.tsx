/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Role, 
  LeadStatus, 
  LeadPriority, 
  TaskStatus,
  ActivityType,
  User, 
  Lead, 
  Activity, 
  Task, 
  SystemNotification, 
  Quote 
} from "./types";
import { api, login, setAccessToken } from "./api";

import Sidebar, { SidebarTab } from "./components/Sidebar";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import PipelineKanban from "./components/PipelineKanban";
import LeadDetails from "./components/LeadDetails";
import LeadForm from "./components/LeadForm";
import QuoteGenerator from "./components/QuoteGenerator";
import Settings from "./components/Settings";
import UserManagement from "./components/UserManagement";
import ActivitiesLog from "./components/ActivitiesLog";
import GlobalTasks from "./components/GlobalTasks";
import AnalyticsPerformance from "./components/AnalyticsPerformance";
import { usePreferences } from "./AppPreferences";

export default function App() {
  const { t } = usePreferences();
  const [email, setEmail] = useState("admin@leedpro.com");
  const [motDePasse, setMotDePasse] = useState("ChangeMe123!");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(Boolean(localStorage.getItem("accessToken")));
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem("accessToken")));
  // Core application states
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [activeUser, setActiveUser] = useState<User>({ id: "", nom: "", email: "", role: Role.ADMIN, telephone: "", actif: false });
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toRole = (role: string): Role => role === "AgentMarketing" ? Role.MARKETING : role as Role;
  const toUser = (user: any): User => ({ id: user.id, nom: `${user.prenom || ""} ${user.nom || ""}`.trim(), email: user.email, role: toRole(user.role), telephone: user.telephone || "", actif: user.actif, avatar: user.avatar });
  const toSource = (source: string): Lead["source"] => ({ SiteWeb: "Site web", ReseauxSociaux: "Réseaux sociaux", Recommandation: "Recommandation", Emailing: "Emailing", Salon: "Salon professionnel", Telephone: "Appel téléphonique" }[source] || source) as Lead["source"];
  const toStatus = (statut: string): LeadStatus => ({ Nouveau: "Nouveau", PremierContact: "Contacté", Qualification: "Qualifié", PropositionCommerciale: "Proposition envoyée", Negociation: "Négociation", Gagne: "Converti (Gagné)", Perdu: "Perdu" }[statut] || statut) as LeadStatus;
  const toLead = (lead: any): Lead => ({ ...lead, source: toSource(lead.source), statut: toStatus(lead.statut), commercialId: lead.commercialId, societe: lead.entreprise?.nom || "", documents: lead.documents || [], valeurEstimee: Number(lead.valeurEstimee), dateCreation: lead.dateCreation, derniereActivite: lead.derniereActivite || lead.dateCreation });
  const toActivity = (item: any): Activity => ({ id:item.id, leadId:item.leadId, type: ({RendezVous:"Rendez-vous"}[item.type] || item.type) as Activity["type"], date:item.dateActivite, auteur:item.utilisateur ? `${item.utilisateur.prenom || ""} ${item.utilisateur.nom || ""}`.trim() || item.utilisateur?.email || "" : item.auteur || "", description:item.description });
  const toTask = (item: any): Task => ({
    ...item,
    statut: ({AFaire:"À faire",EnCours:"En cours",Terminee:"Terminée"}[item.statut] || item.statut) as TaskStatus,
    assigneA: item.utilisateur ? `${item.utilisateur.prenom} ${item.utilisateur.nom}` : item.assigneA || "",
    utilisateurId: item.utilisateur?.id || item.utilisateurId,
    dateEcheance: item.dateEcheance,
    critique: item.critique ?? false
  });
  const toQuote = (item: any): Quote => ({ ...item, montant:Number(item.montant), statut: ({Envoye:"Envoyé",Accepte:"Accepté",Refuse:"Refusé"}[item.statut] || item.statut) as Quote["statut"], dateEmission:item.dateCreation, dateValidite:item.dateCreation, articles:[] });
  const toNotification = (item:any): SystemNotification => ({ id:item.id,titre:item.titre,message:item.message,date:item.dateCreation,lue:item.estLue,type:"info" });

  const loadData = async () => {
    const [me, apiUsers, apiLeads, apiActivities, apiTasks, apiQuotes, apiNotifications] = await Promise.all([
      api<any>("/auth/me"), api<any[]>("/users"), api<any[]>("/leads"), api<any[]>("/activities"), api<any[]>("/tasks"), api<any[]>("/quotes"), api<any[]>("/notifications")
    ]);
    setActiveUser(toUser(me)); setUsers(apiUsers.map(toUser)); setLeads(apiLeads.map(toLead)); setActivities(apiActivities.map(toActivity)); setTasks(apiTasks.map(toTask)); setQuotes(apiQuotes.map(toQuote)); setNotifications(apiNotifications.map(toNotification));
  };

useEffect(() => { if (!localStorage.getItem("accessToken")) return; loadData().catch(() => { setAccessToken(null); setAuthError(t("login.sessionExpired")); }).finally(() => { setIsAuthenticating(false); setIsLoading(false); }); }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthError(""); setIsAuthenticating(true);
    try { setActiveUser(toUser(await login(email, motDePasse))); await loadData(); }
    catch (error) { setAuthError(error instanceof Error ? error.message : "Connexion impossible."); }
    finally { setIsAuthenticating(false); setIsLoading(false); }
  };

  // Select Lead and change tab
  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    setActiveTab("leads");
  };

  // Add single lead
  const handleAddLead = async (newLeadData: Omit<Lead, "id" | "dateCreation" | "derniereActivite" | "documents" | "score">) => {
    const source = ({ "Site web":"SiteWeb", "Réseaux sociaux":"ReseauxSociaux", Recommandation:"Recommandation", Emailing:"Emailing", "Salon professionnel":"Salon", "Appel téléphonique":"Telephone" }[newLeadData.source] || newLeadData.source);
    const statut = ({ "Nouveau":"Nouveau", "Contacté":"PremierContact", "Qualifié":"Qualification", "Proposition envoyée":"PropositionCommerciale", "Négociation":"Negociation", "Converti (Gagné)":"Gagne", "Perdu":"Perdu" }[newLeadData.statut] || newLeadData.statut);
    let entrepriseId: string | undefined;
    if (newLeadData.societe) entrepriseId = (await api<any>("/companies", { method:"POST", body:JSON.stringify({nom:newLeadData.societe}) })).id;
    const created = await api<any>("/leads", { method:"POST", body:JSON.stringify({ ...newLeadData, source, statut, entrepriseId, societe:undefined }) });
    setLeads((current) => [toLead(created), ...current]);
  };

  // Add quick note / call / email log
  const handleAddActivity = async (actData: Omit<Activity, "id">) => {
    const type = ({ "Rendez-vous":"RendezVous" }[actData.type] || actData.type);
    const created = await api<any>("/activities", {
      method: "POST",
      body: JSON.stringify({
        leadId: actData.leadId,
        type,
        description: actData.description,
        dateActivite: actData.date,
        dureeMinutes: actData.dureeMinutes
      })
    });
    setActivities((current) => [toActivity(created), ...current]);
  };

  // Delete activity
  const handleDeleteActivity = async (activityId: string) => {
    try {
      await api(`/activities/${activityId}`, { method: "DELETE" });
      setActivities((current) => current.filter(a => a.id !== activityId));
    } catch (err) {
      console.error("Erreur lors de la suppression de l'activité", err);
    }
  };

  // Edit activity
  const handleEditActivity = async (activityId: string, updates: Partial<Activity>) => {
    try {
      const updated = await api<any>(`/activities/${activityId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(updates.description && { description: updates.description }),
          ...(updates.type && { type: ({ "Rendez-vous":"RendezVous" }[updates.type] || updates.type) })
        })
      });
      setActivities((current) => current.map(a => a.id === activityId ? toActivity(updated) : a));
    } catch (err) {
      console.error("Erreur lors de la modification de l'activité", err);
    }
  };

// Add Task
  const handleAddTask = async (taskData: Omit<Task, "id"> & { utilisateurId?: string }) => {
    const statut = ({ "À faire":"AFaire", "En cours":"EnCours", "Terminée":"Terminee" }[taskData.statut] || taskData.statut);
    const payload = {
      titre: taskData.titre,
      description: taskData.description,
      statut,
      dateEcheance: new Date(taskData.dateEcheance).toISOString(),
      leadId: taskData.leadId,
      utilisateurId: taskData.utilisateurId || activeUser.id,
      critique: taskData.critique || false
    };
    const created = await api<any>("/tasks", { method:"POST", body:JSON.stringify(payload) });
    setTasks((current) => [toTask(created), ...current]);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task> & { utilisateurId?: string }) => {
    const payload: any = {};
    if (updates.titre !== undefined) payload.titre = updates.titre;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.statut !== undefined) payload.statut = ({ "À faire":"AFaire", "En cours":"EnCours", "Terminée":"Terminee" }[updates.statut] || updates.statut);
    if (updates.dateEcheance !== undefined) payload.dateEcheance = updates.dateEcheance;
    if (updates.utilisateurId !== undefined) payload.utilisateurId = updates.utilisateurId;
    if (updates.critique !== undefined) payload.critique = updates.critique;
    if (Object.keys(payload).length === 0) return;

    const updated = await api<any>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) });
    setTasks((current) => current.map((t) => t.id === taskId ? toTask(updated) : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    await api(`/tasks/${taskId}`, { method: "DELETE" });
    setTasks((current) => current.filter((t) => t.id !== taskId));
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce lead ? Cette action est irréversible.")) return;
    await api(`/leads/${leadId}`, { method: "DELETE" });
    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setActivities((current) => current.filter((activity) => activity.leadId !== leadId));
    setTasks((current) => current.filter((task) => task.leadId !== leadId));
    if (selectedLeadId === leadId) setSelectedLeadId(null);
  };

  // Update lead
  const handleUpdateLead = async (updatedLead: Lead) => {
    const body: any = {
      nom: updatedLead.nom,
      prenom: updatedLead.prenom,
      email: updatedLead.email,
      telephone: updatedLead.telephone,
      adresse: updatedLead.adresse,
      ville: updatedLead.ville,
      pays: updatedLead.pays,
      notes: updatedLead.notes,
      valeurEstimee: updatedLead.valeurEstimee,
      commercialId: updatedLead.commercialId
    };
    if (typeof (updatedLead as any).score === "number") body.score = (updatedLead as any).score;

    const saved = await api<any>(`/leads/${updatedLead.id}`, { method: "PATCH", body: JSON.stringify(body) });
    setLeads((current) => current.map(l => l.id === saved.id ? toLead(saved) : l));
  };

  // Update lead status (e.g. from Kanban column drag/push)
  const handleUpdateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    const statut = ({ "Nouveau":"Nouveau", "Contacté":"PremierContact", "Qualifié":"Qualification", "Proposition envoyée":"PropositionCommerciale", "Négociation":"Negociation", "Converti (Gagné)":"Gagne", "Perdu":"Perdu" }[newStatus] || newStatus);
    await api(`/leads/${id}/status`, {method:"PATCH",body:JSON.stringify({statut})});
    setLeads((current) => current.map(l => l.id === id ? { ...l, statut: newStatus, derniereActivite: new Date().toISOString() } : l));

    // Register status change in activities
    handleAddActivity({
      leadId: id,
      type: ActivityType.NOTE,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: `Changement de statut rapide de l'opportunité commerciale vers : '${newStatus}'`
    });

    // Notify users
    const leadObj = leads.find(l => l.id === id);
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      titre: "Étape Pipeline mise à jour",
      message: `L'opportunité '${leadObj?.societe}' est passée à l'état : ${newStatus}.`,
      date: new Date().toISOString(),
      lue: false,
      type: "info"
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Create quote (devis)
  const handleCreateQuote = async (quoteData: Omit<Quote, "id" | "reference">) => {
    const serial = `DEV-2026-${String(quotes.length + 1).padStart(4, "0")}`;
    const statut = ({ "Envoyé":"Envoye", "Accepté":"Accepte", "Refusé":"Refuse" }[quoteData.statut] || quoteData.statut);
    const created = await api<any>("/quotes", { method:"POST", body:JSON.stringify({leadId:quoteData.leadId, reference:serial, montant:quoteData.montant, statut}) });
    const newQuote = toQuote(created);
    setQuotes((current) => [newQuote, ...current]);

    // Notify user
    const lead = leads.find(l => l.id === quoteData.leadId);
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      titre: "Proposition commerciale générée",
      message: `Nouveau devis ${serial} (${quoteData.montant.toLocaleString('fr-FR')} €) émis pour ${lead?.societe}.`,
      date: new Date().toISOString(),
      lue: false,
      type: "success"
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Update quote status
  const handleUpdateQuoteStatus = async (id: string, newStatus: Quote["statut"]) => {
    const statut = ({ "Envoyé":"Envoye", "Accepté":"Accepte", "Refusé":"Refuse" }[newStatus] || newStatus);
    await api(`/quotes/${id}`, { method:"PATCH", body:JSON.stringify({statut}) });
    setQuotes((current) => current.map(q => q.id === id ? { ...q, statut: newStatus } : q));
  };

  // Toggle user status
  const handleUpdateUserStatus = async (id: string, active: boolean) => {
    const saved = await api<any>(`/users/${id}`, { method:"PATCH", body:JSON.stringify({actif:active}) });
    setUsers((current) => current.map(user => user.id === id ? toUser(saved) : user));
  };

  // Add system user
  const handleAddUser = async (newU: Omit<User, "id"> & { motDePasse: string }) => {
    const [prenom, ...nomParts] = newU.nom.trim().split(/\s+/);
    const role = newU.role === Role.MARKETING ? "AgentMarketing" : newU.role;
    const saved = await api<any>("/users", { method:"POST", body:JSON.stringify({nom:nomParts.join(" ") || prenom, prenom:nomParts.length ? prenom : "Utilisateur", email:newU.email, role, telephone:newU.telephone, motDePasse:newU.motDePasse}) });
    setUsers((current) => [...current, toUser(saved)]);
  };

  // Quick Action to open Quote page with Lead selected
  const handleTriggerQuote = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab("reports");
  };

  // Get leads according to Role-Based Access Matrix (page 5)
  const getLeadsForRole = (usr: User) => {
    if (usr.role === Role.ADMIN || usr.role === Role.MANAGER) {
      return leads;
    }
    if (usr.role === Role.COMMERCIAL) {
      // Consulter ses leads attribués uniquement
      return leads.filter(l => l.commercialId === usr.id);
    }
    if (usr.role === Role.MARKETING) {
      // Marketing focuses on qualifying New (Nouveau) leads and tracking
      return leads.filter(l => l.statut === LeadStatus.NEW || l.statut === LeadStatus.QUALIFIED);
    }
    return [];
  };

  const visibleLeads = getLeadsForRole(activeUser);

  // Filters leads based on SearchTerm
  const filteredLeadsForSearch = visibleLeads.filter(l => 
    l.societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ville.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear unread notifications
  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, lue: true } : n));
  };

// Determine page title
  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return t("header.title.dashboard");
      case "leads": return t("header.title.leads");
      case "opportunities": return t("header.title.opportunities");
      case "companies": return t("header.title.companies");
      case "contacts": return t("header.title.contacts");
      case "tasks": return t("header.title.tasks");
      case "reports": return t("header.title.reports");
      case "team": return t("header.title.team");
      case "settings": return t("header.title.settings");
      default: return "Tracking Lead System";
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const statut = ({ "À faire":"AFaire", "En cours":"EnCours", "Terminée":"Terminee" }[newStatus] || newStatus);
    await api(`/tasks/${taskId}`, {method:"PATCH",body:JSON.stringify({statut})});
    setTasks(tasks.map(t => t.id === taskId ? { ...t, statut: newStatus } : t));
  };

  const selectedLead = selectedLeadId ? (visibleLeads.find(l => l.id === selectedLeadId) || null) : null;

if (isLoading) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">{t("app.loading")}</div>;

  if (!localStorage.getItem("accessToken")) return (
    <main className="min-h-screen grid place-items-center bg-slate-100 p-5">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
        <div><h1 className="text-2xl font-bold text-slate-800">{t("login.title")}</h1><p className="mt-1 text-sm text-slate-500">{t("login.subtitle")}</p></div>
        {authError && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{authError}</p>}
        <label className="block text-sm font-medium text-slate-700">{t("login.email")}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <label className="block text-sm font-medium text-slate-700">{t("login.password")}<input required type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <button disabled={isAuthenticating} className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-60">{isAuthenticating ? t("login.connecting") : t("login.button")}</button>
      </form>
    </main>
  );

return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden dark:bg-slate-950 dark:text-slate-100" id="app-root-container">
      {/* 1. Sidebar Left */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          // reset search term when switching tabs
          setSearchTerm("");
        }}
        userRole={activeUser.role}
        selectedLeadId={selectedLeadId}
        activeUser={activeUser}
      />

      {/* 2. Main Workstation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Top Bar */}
        <Header 
          activeUser={activeUser}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onClearNotifications={handleClearNotifications}
          searchTerm={activeTab === "dashboard" || activeTab === "opportunities" ? searchTerm : undefined as any}
          onSearchChange={setSearchTerm}
          currentPageTitle={getPageTitle()}
        />

        {/* Dynamic workspace router */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "dashboard" && (
            <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-4rem)]">
              <DashboardStats 
                leads={filteredLeadsForSearch} 
                users={users}
                activities={activities}
                onSelectLead={handleSelectLead} 
              />
            </div>
          )}

          {activeTab === "opportunities" && (
            <PipelineKanban 
              leads={filteredLeadsForSearch}
              onSelectLead={handleSelectLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              userRole={activeUser.role}
              commercialId={activeUser.id}
            />
          )}

          {(activeTab === "leads" || activeTab === "companies" || activeTab === "contacts") && (
            <LeadDetails 
              activeTab={activeTab}
              lead={selectedLead}
              onBack={() => {
                setSelectedLeadId(null);
                setActiveTab("leads");
              }}
              activities={activities}
              tasks={tasks}
              users={users}
              activeUser={activeUser}
              onAddActivity={handleAddActivity}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onDeleteLead={handleDeleteLead}
              onUpdateLead={handleUpdateLead}
              onTriggerQuote={handleTriggerQuote}
              leads={visibleLeads}
              onSelectLead={handleSelectLead}
              onAddLead={handleAddLead}
            />
          )}

          {activeTab === "tasks" && (
            <GlobalTasks 
              tasks={tasks}
              leads={visibleLeads}
              users={users}
              activeLeadId={selectedLeadId || undefined}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "calls" && (
            <ActivitiesLog
              activities={activities}
              leads={visibleLeads}
              users={users}
              activeUser={activeUser}
              defaultTypeFilter={"Appel"}
              activeLeadId={selectedLeadId || undefined}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
              onEditActivity={handleEditActivity}
            />
          )}
          {activeTab === "emails" && (
            <ActivitiesLog
              activities={activities}
              leads={visibleLeads}
              users={users}
              activeUser={activeUser}
              defaultTypeFilter={"Email"}
              activeLeadId={selectedLeadId || undefined}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
              onEditActivity={handleEditActivity}
            />
          )}
          {activeTab === "meetings" && (
            <ActivitiesLog
              activities={activities}
              leads={visibleLeads}
              users={users}
              activeUser={activeUser}
              defaultTypeFilter={"Rendez-vous"}
              activeLeadId={selectedLeadId || undefined}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
              onEditActivity={handleEditActivity}
            />
          )}

          {activeTab === "reports" && (
<QuoteGenerator 
              quotes={quotes}
              leads={visibleLeads.filter(l => l.statut !== LeadStatus.WON && l.statut !== LeadStatus.LOST)}
              onCreateQuote={handleCreateQuote}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              activeUser={activeUser}
            />
          )}

          {activeTab === "dashboards_analysis" && (
            <AnalyticsPerformance 
              leads={visibleLeads}
              users={users}
            />
          )}

          {activeTab === "team" && (
            <UserManagement 
              users={users}
              activeUser={activeUser}
              onUpdateUserStatus={handleUpdateUserStatus}
              onAddUser={handleAddUser}
              onUpdateProfile={async (data) => {
                const updated = await api<any>(`/users/${activeUser.id}`, { method:"PATCH", body:JSON.stringify(data) });
                setActiveUser(toUser(updated));
              }}
              onUpdatePassword={async (currentPassword, newPassword) => {
                await api<any>(`/users/${activeUser.id}/password`, { method:"PATCH", body:JSON.stringify({ currentPassword, newPassword }) });
              }}
            />
          )}

          {activeTab === "settings" && (
            <Settings 
              activeUser={activeUser}
              onUpdateProfile={async (data) => {
                const updated = await api<any>(`/users/${activeUser.id}`, { method:"PATCH", body:JSON.stringify(data) });
                setActiveUser(toUser(updated));
              }}
              onUpdatePassword={async (currentPassword, newPassword) => {
                await api<any>(`/users/${activeUser.id}/password`, { method:"PATCH", body:JSON.stringify({ currentPassword, newPassword }) });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
