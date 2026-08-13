import React, { useState } from "react";
import { 
  Plus, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { Lead, LeadStatus, Role, LeadPriority, LeadSource } from "../types";
import { usePreferences } from "../AppPreferences";

interface PipelineKanbanProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
  onUpdateLeadStatus: (id: string, newStatus: LeadStatus) => void;
  userRole: Role;
  commercialId?: string;
  users: any[];
  readOnly?: boolean;
}

const STAGES = [
  { id: LeadStatus.NEW, labelKey: "kanban.nouveau", color: "border-t-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-b-slate-800" },
  { id: LeadStatus.CONTACTED, labelKey: "kanban.contacte", color: "border-t-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-b-slate-800" },
  { id: LeadStatus.QUALIFIED, labelKey: "kanban.qualifie", color: "border-t-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-b-slate-800" },
  { id: LeadStatus.PROPOSAL, labelKey: "kanban.proposition", color: "border-t-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-b-slate-800" },
  { id: LeadStatus.NEGOTIATION, labelKey: "kanban.negociation", color: "border-t-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-b-slate-800" },
  { id: LeadStatus.WON, labelKey: "kanban.gagne", color: "border-t-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-b-slate-800" },
  { id: LeadStatus.LOST, labelKey: "kanban.perdu", color: "border-t-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:border-b-slate-800" }
];

export default function PipelineKanban({
  leads,
  onSelectLead,
  onUpdateLeadStatus,
  userRole,
  commercialId,
  users,
  readOnly = false,
}: PipelineKanbanProps) {
  const { t } = usePreferences();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadPriorityFilter, setLeadPriorityFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [leadCommercialFilter, setLeadCommercialFilter] = useState("all");
  const [leadMinBudget, setLeadMinBudget] = useState("");
  const [leadMaxBudget, setLeadMaxBudget] = useState("");

  const translatePriority = (priority: LeadPriority) => {
    switch (priority) {
      case LeadPriority.LOW: return t("leadform.low");
      case LeadPriority.MEDIUM: return t("leadform.medium");
      case LeadPriority.HIGH: return t("leadform.high");
      default: return priority;
    }
  };

  // 1. Filter leads based on search query and advanced filters
  const filteredLeads = leads.filter((lead) => {
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const nomMatch = lead.nom?.toLowerCase().includes(query);
      const prenomMatch = lead.prenom?.toLowerCase().includes(query);
      const emailMatch = lead.email?.toLowerCase().includes(query);
      const societeMatch = lead.societe?.toLowerCase().includes(query);
      const notesMatch = lead.notes?.toLowerCase().includes(query);
      const textMatch = nomMatch || prenomMatch || emailMatch || societeMatch || notesMatch;
      if (!textMatch) return false;
    }

    if (leadPriorityFilter !== "all" && lead.priorite !== leadPriorityFilter) return false;
    if (leadSourceFilter !== "all" && lead.source !== leadSourceFilter) return false;
    if (leadCommercialFilter !== "all") {
      if (leadCommercialFilter === "unassigned") {
        if (lead.commercialId) return false;
      } else {
        if (lead.commercialId !== leadCommercialFilter) return false;
      }
    }
    if (leadMinBudget && lead.valeurEstimee < Number(leadMinBudget)) return false;
    if (leadMaxBudget && lead.valeurEstimee > Number(leadMaxBudget)) return false;

    return true; 
  });

  // Calculate sum of values for each stage
  const getStageTotal = (status: LeadStatus) => {
    return filteredLeads
      .filter((l) => l.statut === status)
      .reduce((sum, l) => sum + l.valeurEstimee, 0);
  };

  // Helper to verify transition rights — disabled entirely when readOnly
  const canMoveLead = (_lead: Lead, _targetStatus: LeadStatus) => {
    if (readOnly) return false;
    return true;
  };

  const handleMoveStage = (e: React.MouseEvent, lead: Lead, direction: "next" | "prev") => {
    e.stopPropagation(); 

    const currentIndex = STAGES.findIndex(s => s.id === lead.statut);
    if (currentIndex === -1) return;

    let targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const targetStatus = STAGES[targetIndex].id;

    if (!canMoveLead(lead, targetStatus)) {
      alert(t("kanban.restrictedAlert"));
      return;
    }

    onUpdateLeadStatus(lead.id, targetStatus);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-6 animate-fade-in" id="pipeline-kanban-root">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">
      
      {/* Header Info & Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Input & Filter Toggle (Full Width Card) */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder={t("header.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-semibold text-xs cursor-pointer transition-all ${
                showAdvancedFilters 
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                  : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-700/60"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtres</span>
            </button>
          </div>
        </div>

        {readOnly && (
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400">
            <AlertCircle className="h-4 w-4" />
            <span>Mode consultation — vous ne pouvez pas modifier le pipeline.</span>
          </div>
        )}
      </div>

        {/* Expandable Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-white border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs shadow-sm dark:bg-slate-900 dark:border-slate-800">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-650 cursor-pointer focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
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
                {users.filter(u => u.role === "Commercial" || u.role === "COMMERCIAL").map(u => (
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
        )}

      {/* Kanban Board Columns Scrollable (Transform rotated to place scrollbar on top) */}
      <div 
        className="flex-1 flex gap-4 overflow-x-auto pt-3 pb-2 items-end min-h-[500px] kanban-scrollbar"
        style={{ transform: "rotateX(180deg)", direction: "ltr" }}
      >
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.statut === stage.id);
          const totalBudget = getStageTotal(stage.id);

          return (
            <div 
              key={stage.id} 
              className="flex-col w-68 bg-slate-100/50 border border-slate-200/60 rounded-xl flex-shrink-0 flex max-h-full overflow-hidden shadow-sm dark:bg-slate-900/60 dark:border-slate-800/80"
              id={`kanban-column-${stage.id}`}
              style={{ transform: "rotateX(180deg)" }}
              onDragOver={(e) => { if (!readOnly) e.preventDefault(); }}
              onDrop={(e) => {
                if (readOnly) return;
                e.preventDefault();
                const leadId = e.dataTransfer.getData("leadId");
                if (leadId) {
                  const draggedLead = leads.find(l => l.id === leadId);
                  if (draggedLead && draggedLead.statut !== stage.id) {
                    onUpdateLeadStatus(leadId, stage.id);
                  }
                }
              }}
            >
              {/* Column Header */}
              <div className={`p-4 border-t-4 border-b border-slate-205 bg-white flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800 ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide uppercase">{t(stage.labelKey)}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-bold mt-2.5 flex items-center justify-between dark:text-slate-400">
                  <span>{t("kanban.totalValue")}</span>
                  <span className="text-slate-750 dark:text-slate-300">{(totalBudget).toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>

              {/* Card List scrollable */}
              <div className="p-3 space-y-3 overflow-y-auto max-h-[550px] divide-y-0 flex-1">
                {stageLeads.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500 animate-fade-in">
                    {t("kanban.empty")}
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const priorityColor = 
                      lead.priorite === LeadPriority.HIGH 
                        ? "bg-rose-500" 
                        : lead.priorite === LeadPriority.MEDIUM 
                        ? "bg-amber-500" 
                        : "bg-blue-400";

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead.id)}
                        draggable={!readOnly}
                        onDragStart={(e) => {
                          if (readOnly) return;
                          e.dataTransfer.setData("leadId", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-150 shadow-sm relative group flex flex-col gap-2 animate-fade-in dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50 ${readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                        id={`lead-card-${lead.id}`}
                      >
                        {/* Title and company */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-xs text-slate-850 group-hover:text-blue-600 transition-colors dark:text-slate-200 dark:group-hover:text-blue-400">
                              {lead.societe}
                            </h5>
                            <p className="text-[10px] text-slate-550 font-semibold mt-0.5 dark:text-slate-400">
                              Projet : {lead.nomProjet || `Opportunité - ${lead.prenom} ${lead.nom}`}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                              Contact : {lead.prenom} {lead.nom}
                            </p>
                          </div>
                          
                          {/* AI Score Badge */}
                          <div 
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] ${
                              lead.score >= 80 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900" 
                                : lead.score >= 60 
                                ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900" 
                                : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            }`}
                            title={t("kanban.scoreIA")}
                          >
                            {lead.score}
                          </div>
                        </div>

                        {/* Location and Source */}
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 text-slate-450" />
                            {lead.ville}
                          </span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 truncate dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            {lead.source}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                        {/* Budget and Move Actions */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${priorityColor}`} title={`${t("kanban.priorityPrefix")} : ${translatePriority(lead.priorite)}`}></span>
                            <span className="font-bold text-[11px] text-slate-750 dark:text-slate-350">{lead.valeurEstimee.toLocaleString('fr-FR')} MAD</span>
                          </div>

                          {!readOnly && (
                            <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleMoveStage(e, lead, "prev")}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-650 disabled:opacity-20 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                disabled={stage.id === LeadStatus.NEW}
                                title={t("kanban.prev")}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => handleMoveStage(e, lead, "next")}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-650 disabled:opacity-20 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                disabled={stage.id === LeadStatus.WON}
                                title={t("kanban.next")}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
