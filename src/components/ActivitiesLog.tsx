/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Search, 
  Filter, 
  PlusCircle, 
  Clock, 
  User, 
  Building,
  CheckCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  Trash2,
  Pencil,
  X
} from "lucide-react";
import { Activity, Lead, ActivityType, User as UserType, LeadStatus, LeadPriority } from "../types";

interface ActivitiesLogProps {
  activities: Activity[];
  leads: Lead[];
  users: UserType[];
  activeUser: UserType;
  activeLeadId?: string;
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onDeleteActivity?: (activityId: string) => void;
  onEditActivity?: (activityId: string, updates: Partial<Activity>) => void;
  defaultTypeFilter?: string;
}

export default function ActivitiesLog({
  activities,
  leads,
  users,
  activeUser,
  activeLeadId,
  onAddActivity,
  onDeleteActivity,
  onEditActivity,
  defaultTypeFilter
}: ActivitiesLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter || "all");
  const [primaryFilter, setPrimaryFilter] = useState<string>("client");
  const [secondaryFilter, setSecondaryFilter] = useState<string>("all");
  const [fixedType, setFixedType] = useState<boolean>(Boolean(defaultTypeFilter));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeadId, setNewLeadId] = useState("");
  const [newType, setNewType] = useState<ActivityType>(defaultTypeFilter ? (defaultTypeFilter as ActivityType) : ActivityType.CALL);
  const [newDuree, setNewDuree] = useState(15);
  const [newDesc, setNewDesc] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTypeFilter) {
      setTypeFilter(defaultTypeFilter);
      setFixedType(true);
      setNewType(defaultTypeFilter as ActivityType);
    } else {
      setFixedType(false);
    }
  }, [defaultTypeFilter]);

  // Edit modal state
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editDesc, setEditDesc] = useState("");

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadId || !newDesc.trim()) {
      alert("Veuillez sélectionner un prospect et rédiger un descriptif.");
      return;
    }

    onAddActivity({
      leadId: newLeadId,
      type: newType,
      date: new Date().toISOString(),
      auteur: activeUser.nom,
      description: newDesc,
      dureeMinutes: [ActivityType.CALL, ActivityType.MEETING].includes(newType) ? Number(newDuree) : undefined
    });

    setNewDesc("");
    setShowAddForm(false);
    setFeedback("L'activité d'échange a été consignée avec succès dans l'historique !");
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editDesc.trim()) return;
    onEditActivity?.(editingActivity.id, { description: editDesc });
    setEditingActivity(null);
    setEditDesc("");
    setFeedback("L'activité a été modifiée avec succès !");
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirm = (activityId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.")) {
      onDeleteActivity?.(activityId);
      setFeedback("L'activité a été supprimée !");
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const getActivityLead = (leadId: string) => {
    return leads.find(l => l.id === leadId);
  };

  const filterValues = () => {
    const clientOptions = leads.map((l) => ({ value: l.id, label: `${l.societe} (${l.prenom} ${l.nom})` }));
    const priorityOptions = [
      { value: "all", label: "Tous" },
      { value: LeadPriority.LOW, label: LeadPriority.LOW },
      { value: LeadPriority.MEDIUM, label: LeadPriority.MEDIUM },
      { value: LeadPriority.HIGH, label: LeadPriority.HIGH },
    ];
    const statusOptions = [{ value: "all", label: "Tous" }, ...Object.values(LeadStatus).map((item) => ({ value: item, label: item }))];

    if (primaryFilter === "client") return [{ value: "all", label: "Tous" }, ...clientOptions];
    if (primaryFilter === "priorite") return priorityOptions;
    if (primaryFilter === "etat") return statusOptions;
    return [{ value: "all", label: "Tous" }, ...clientOptions];
  };

  const filteredActivities = activities.filter(act => {
    const lead = getActivityLead(act.leadId);
    const matchesSearch = 
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.auteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead && (lead.societe.toLowerCase().includes(searchTerm.toLowerCase()) || 
                lead.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.prenom.toLowerCase().includes(searchTerm.toLowerCase())));
                 
    const matchesType = typeFilter === "all" || act.type === typeFilter;
    const matchesPrimary =
      secondaryFilter === "all" ||
      (primaryFilter === "client" && act.leadId === secondaryFilter) ||
      (primaryFilter === "priorite" && lead?.priorite === secondaryFilter) ||
      (primaryFilter === "etat" && lead?.statut === secondaryFilter);
    const matchesLeadSelection = activeLeadId ? act.leadId === activeLeadId : true;

    return matchesSearch && matchesType && matchesPrimary && matchesLeadSelection;
  });

  const getTypeConfig = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return {
          icon: Phone,
          color: "text-amber-600 bg-amber-50 border-amber-250/70",
          label: "Appel Téléphonique"
        };
      case ActivityType.EMAIL:
        return {
          icon: Mail,
          color: "text-blue-600 bg-blue-50 border-blue-250/70",
          label: "Email Envoyé"
        };
      case ActivityType.MEETING:
        return {
          icon: Calendar,
          color: "text-purple-600 bg-purple-50 border-purple-250/70",
          label: "Rendez-vous"
        };
      case ActivityType.NOTE:
        return {
          icon: FileText,
          color: "text-slate-600 bg-slate-50 border-slate-250/70",
          label: "Note interne"
        };
      case ActivityType.STATUS_CHANGE:
        return {
          icon: Sparkles,
          color: "text-emerald-600 bg-emerald-50 border-emerald-250/70",
          label: "Changement statut"
        };
      default:
        return {
          icon: MessageSquare,
          color: "text-cyan-600 bg-cyan-50 border-cyan-250/70",
          label: "Message / SMS"
        };
    }
  };

  // Only count exchanges (calls, emails, meetings) - exclude notes
  const callsCount = activities.filter(a => a.type === ActivityType.CALL).length;
  const emailsCount = activities.filter(a => a.type === ActivityType.EMAIL).length;
  const meetingsCount = activities.filter(a => a.type === ActivityType.MEETING).length;
  const totalExchanges = callsCount + emailsCount + meetingsCount;

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] text-slate-850 dark:bg-slate-950" id="activities-log-root">
      <div className="max-w-7xl mx-auto w-full space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total des Échanges</p>
            <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{totalExchanges}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Appels Effectués</p>
            <h3 className="text-2xl font-bold font-display text-amber-600 mt-1">{callsCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Emails Échangés</p>
            <h3 className="text-2xl font-bold font-display text-blue-600 mt-1">{emailsCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Réunions & RDV</p>
            <h3 className="text-2xl font-bold font-display text-purple-600 mt-1">{meetingsCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 flex items-center gap-3 text-xs font-semibold shadow-xs">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-blue-600" />
              Consigner une action commerciale
            </h3>

            <form onSubmit={handleAddActivitySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Concerne le client / Prospect :</label>
                <select
                  required
                  value={newLeadId}
                  onChange={(e) => setNewLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choisir un client dans le CRM --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.societe} ({l.prenom} {l.nom})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {!fixedType ? (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Canal de contact :</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ActivityType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none"
                    >
                      <option value={ActivityType.CALL}>📞 Appel Téléphonique</option>
                      <option value={ActivityType.EMAIL}>✉️ Email Envoyé</option>
                      <option value={ActivityType.MEETING}>🤝 Rendez-vous / RDV</option>
                      <option value={ActivityType.NOTE}>📝 Note Interne</option>
                    </select>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 text-[11px]">
                    Canal de contact : <strong>{newType}</strong>
                  </div>
                )}

                {[ActivityType.CALL, ActivityType.MEETING].includes(newType) && (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Durée (minutes) :</label>
                    <input
                      type="number"
                      min={1}
                      value={newDuree}
                      onChange={(e) => setNewDuree(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Compte-rendu de l'échange :</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Décrivez brièvement l'échange (ex: Client intéressé par notre offre, planifié de le recontacter demain...)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold uppercase tracking-wide text-[10px] transition-all shadow-md shadow-blue-500/10"
              >
                Enregistrer l'action commerciale
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs shadow-sm">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un échange ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <select
                value={primaryFilter}
                onChange={(e) => {
                  setPrimaryFilter(e.target.value);
                  setSecondaryFilter("all");
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 font-semibold cursor-pointer text-xs focus:ring-0 w-full sm:w-auto focus:bg-white"
              >
                <option value="client">Par client</option>
                <option value="priorite">Par priorité</option>
                <option value="etat">Par état du client</option>
              </select>

              <select
                value={secondaryFilter}
                onChange={(e) => setSecondaryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 font-semibold cursor-pointer text-xs focus:ring-0 w-full sm:w-auto focus:bg-white"
              >
                {filterValues().map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              {!fixedType && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 w-full sm:w-auto">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-700 font-semibold cursor-pointer text-xs focus:ring-0 p-0 pr-6"
                  >
                    <option value="all">Tous les types</option>
                    <option value={ActivityType.CALL}>Appels</option>
                    <option value={ActivityType.EMAIL}>Emails</option>
                    <option value={ActivityType.MEETING}>Rendez-vous</option>
                    <option value={ActivityType.NOTE}>Notes</option>
                    <option value={ActivityType.STATUS_CHANGE}>Statuts</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
                Aucun échange ou activité ne correspond à vos critères de recherche.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const lead = getActivityLead(act.leadId);
                const config = getTypeConfig(act.type);
                const TypeIcon = config.icon;

                return (
                  <div key={act.id} className="bg-white border border-slate-200 p-4 rounded-xl relative hover:border-slate-300 transition-all text-xs shadow-sm group">
                    
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${config.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{config.label}</span>
                          <span className="text-[10px] text-slate-400">Consigné par {act.auteur}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(act.date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setEditDesc(act.description);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(act.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed pl-10.5 mb-3">
                      {act.description}
                    </p>

                    <div className="pl-10.5 flex flex-wrap gap-2 items-center text-[10px]">
                      {lead && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 text-blue-600 font-semibold">
                          <Building className="h-3 w-3 text-blue-500" />
                          <span>{lead.societe}</span>
                        </div>
                      )}
                      
                      {act.dureeMinutes && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{act.dureeMinutes} min</span>
                        </div>
                      )}
                    </div>


                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Edit Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden text-slate-800 shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="h-4.5 w-4.5 text-blue-600" />
                Modifier l'activité
              </h4>
              <button onClick={() => setEditingActivity(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-850 transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 uppercase font-semibold mb-1.5">Description :</label>
                <textarea
                  rows={4}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Enregistrer
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
