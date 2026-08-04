/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  PlusCircle, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  TrendingUp, 
  User, 
  FolderPlus,
  AlertCircle,
  Search
} from "lucide-react";
import { Lead, LeadStatus, Role, LeadPriority } from "../types";

interface PipelineKanbanProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
  onUpdateLeadStatus: (id: string, newStatus: LeadStatus) => void;
  userRole: Role;
  commercialId?: string;
}

const STAGES = [
  { id: LeadStatus.NEW, label: "Nouveau", color: "border-t-blue-500 bg-blue-50 text-blue-700" },
  { id: LeadStatus.CONTACTED, label: "Contacté", color: "border-t-amber-500 bg-amber-50 text-amber-700" },
  { id: LeadStatus.QUALIFIED, label: "Qualifié", color: "border-t-purple-500 bg-purple-50 text-purple-700" },
  { id: LeadStatus.PROPOSAL, label: "Proposition envoyée", color: "border-t-pink-500 bg-pink-50 text-pink-700" },
  { id: LeadStatus.NEGOTIATION, label: "Négociation", color: "border-t-cyan-500 bg-cyan-50 text-cyan-700" },
  { id: LeadStatus.WON, label: "Converti (Gagné)", color: "border-t-emerald-500 bg-emerald-50 text-emerald-700" },
  { id: LeadStatus.LOST, label: "Perdu", color: "border-t-rose-500 bg-rose-50 text-rose-700" }
];

export default function PipelineKanban({
  leads,
  onSelectLead,
  onUpdateLeadStatus,
  userRole,
  commercialId
}: PipelineKanbanProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // 1. Filter leads based on user permissions & search query
  // matrix: "Consulter ses leads attribués uniquement" for Commercial!
  const filteredLeads = leads.filter((lead) => {
    if (userRole === Role.COMMERCIAL) {
      if (lead.commercialId !== commercialId) return false;
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const nomMatch = lead.nom?.toLowerCase().includes(query);
      const prenomMatch = lead.prenom?.toLowerCase().includes(query);
      const emailMatch = lead.email?.toLowerCase().includes(query);
      const societeMatch = lead.societe?.toLowerCase().includes(query);
      const notesMatch = lead.notes?.toLowerCase().includes(query);
      return nomMatch || prenomMatch || emailMatch || societeMatch || notesMatch;
    }
    return true; // admin, manager, marketing see all
  });

  // Calculate sum of values for each stage
  const getStageTotal = (status: LeadStatus) => {
    return filteredLeads
      .filter((l) => l.statut === status)
      .reduce((sum, l) => sum + l.valeurEstimee, 0);
  };

  // Helper to verify transition rights (Agent Marketing limits)
  const canMoveLead = (lead: Lead, targetStatus: LeadStatus) => {
    if (userRole === Role.MARKETING) {
      // Agent Marketing can ONLY modify leads from "Nouveau" -> "Qualifié"
      const allowedTransitions = [
        { from: LeadStatus.NEW, to: LeadStatus.QUALIFIED },
        { from: LeadStatus.NEW, to: LeadStatus.CONTACTED }
      ];
      return allowedTransitions.some(t => t.from === lead.statut && t.to === targetStatus);
    }
    return true; // admin, manager, commercial can move anywhere
  };

  const handleMoveStage = (e: React.MouseEvent, lead: Lead, direction: "next" | "prev") => {
    e.stopPropagation(); // prevent opening detailed card

    const currentIndex = STAGES.findIndex(s => s.id === lead.statut);
    if (currentIndex === -1) return;

    let targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const targetStatus = STAGES[targetIndex].id;

    if (!canMoveLead(lead, targetStatus)) {
      alert(`Droits d'accès restreints : En tant qu'${userRole}, vous pouvez uniquement faire évoluer un prospect de l'état 'Nouveau' vers 'Qualifié' ou 'Premier Contact'.`);
      return;
    }

    onUpdateLeadStatus(lead.id, targetStatus);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-6" id="pipeline-kanban-root">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">
      
      {/* Header Info */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs text-slate-500">
            {userRole === Role.COMMERCIAL 
              ? "Affichage de vos opportunités attribuées uniquement (Filtre Commercial actif)." 
              : "Affichage de toutes les opportunités du CRM (Accès Superviseur actif)."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Rechercher des opportunités..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-9 pr-4 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
          />
        </div>
        
        {userRole === Role.MARKETING && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>Rôle Marketing : Modification limitée à (Nouveau ➔ Qualifié)</span>
          </div>
        )}
      </div>

      {/* Kanban Board Columns Scrollable */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.statut === stage.id);
          const totalBudget = getStageTotal(stage.id);

          return (
            <div 
              key={stage.id} 
              className="flex-col w-80 bg-slate-100/50 border border-slate-200/60 rounded-xl flex-shrink-0 flex max-h-full overflow-hidden shadow-sm"
              id={`kanban-column-${stage.id}`}
            >
              {/* Column Header */}
              <div className={`p-4 border-t-4 border-b border-slate-200 bg-white flex flex-col justify-between ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide uppercase text-slate-800">{stage.label}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-bold mt-2.5 flex items-center justify-between">
                  <span>Valeur totale :</span>
                  <span className="text-slate-700">{(totalBudget).toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              {/* Card List scrollable */}
              <div className="p-3 space-y-3 overflow-y-auto max-h-[550px] divide-y-0 flex-1">
                {stageLeads.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg bg-white">
                    Aucun prospect
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    // Decide color of priority dot
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
                        className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-150 cursor-pointer shadow-sm relative group flex flex-col gap-2"
                        id={`lead-card-${lead.id}`}
                      >
                        {/* Title and company */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                              {lead.societe}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {lead.prenom} {lead.nom}
                            </p>
                          </div>
                          
                          {/* AI Score Badge */}
                          <div 
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] ${
                              lead.score >= 80 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                : lead.score >= 60 
                                ? "bg-amber-50 text-amber-600 border border-amber-200" 
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                            title="Score IA"
                          >
                            {lead.score}
                          </div>
                        </div>

                        {/* Location and Source */}
                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {lead.ville}
                          </span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 truncate">
                            {lead.source}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 my-1"></div>

                        {/* Budget and Move Actions */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${priorityColor}`} title={`Priorité ${lead.priorite}`}></span>
                            <span className="text-xs font-bold text-slate-800">
                              {(lead.valeurEstimee).toLocaleString('fr-FR')} €
                            </span>
                          </div>

                          {/* Quick Stage Evolution Controls */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleMoveStage(e, lead, "prev")}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-20 animate-fade-in"
                              disabled={stage.id === LeadStatus.NEW}
                              title="Étape précédente"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleMoveStage(e, lead, "next")}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-20 animate-fade-in"
                              disabled={stage.id === LeadStatus.WON}
                              title="Étape suivante"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
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
