import React, { useState } from "react";
import { Lead, UserProfile } from "../../types";
import { 
  Search, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Filter,
  User as UserIcon,
  Sparkles
} from "lucide-react";

interface PipelineKanbanProps {
  leads: Lead[];
  currentUser: UserProfile;
  onUpdateLeadStatus: (leadId: number, newStatus: string) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenCreateModal: () => void;
}

const COLUMNS: { id: string; label: string }[] = [
  { id: "Nouveau", label: "Nouveau" },
  { id: "PremierContact", label: "Premier Contact" },
  { id: "Qualification", label: "Qualification" },
  { id: "PropositionCommerciale", label: "Proposition" },
  { id: "Negociation", label: "Négociation" },
  { id: "Gagne", label: "Gagné (Client)" },
  { id: "Perdu", label: "Perdu" },
];

export default function PipelineKanban({
  leads,
  currentUser,
  onUpdateLeadStatus,
  onSelectLead,
  onOpenCreateModal,
}: PipelineKanbanProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<string>("Nouveau");

  // RBAC: Commercial sees only their leads. Admin, Manager, Marketing see all.
  const isCommercial = currentUser.role === "commercial";
  const filteredLeadsByRole = isCommercial 
    ? leads.filter(l => l.commercialId === currentUser.id)
    : leads;

  // Filter based on search & selectors
  const filteredLeads = filteredLeadsByRole.filter((lead) => {
    const matchesSearch = 
      (lead.entrepriseNom || "Particulier").toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = selectedSource === "All" || (lead.source || "Autre") === selectedSource;
    const matchesPriority = selectedPriority === "All" || lead.priorite === selectedPriority;

    return matchesSearch && matchesSource && matchesPriority;
  });

  // Unique sources for the filter dropdown
  const allSources = Array.from(new Set(leads.map(l => l.source || "Autre")));

  const getColumnLeads = (status: string) => {
    return filteredLeads.filter((lead) => lead.statut === status);
  };

  const getColumnTotalValue = (status: string) => {
    return getColumnLeads(status).reduce((sum, lead) => sum + Number(lead.valeurEstimee || 0), 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(val) + " DH";
  };

  // Helper to check if a user is allowed to move leads
  const canMoveLead = (lead: Lead, direction: "forward" | "backward", targetStatus: string) => {
    // Agent Marketing can ONLY do Nouveau -> Qualification
    if (currentUser.role === "marketing") {
      return lead.statut === "Nouveau" && targetStatus === "Qualification" && direction === "forward";
    }
    // Commercial can move only their own leads
    if (currentUser.role === "commercial") {
      return lead.commercialId === currentUser.id;
    }
    // Admin & Manager can move everything
    return true;
  };

  const handleMove = (e: React.MouseEvent, lead: Lead, direction: "forward" | "backward") => {
    e.stopPropagation(); // Prevent opening modal
    const currentIndex = COLUMNS.findIndex(col => col.id === lead.statut);
    if (currentIndex === -1) return;

    let targetIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < COLUMNS.length) {
      const targetStatus = COLUMNS[targetIndex].id;
      if (canMoveLead(lead, direction, targetStatus)) {
        onUpdateLeadStatus(lead.id, targetStatus);
      }
    }
  };

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("text/plain", String(lead.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadIdStr = e.dataTransfer.getData("text/plain");
    const leadId = parseInt(leadIdStr);
    if (isNaN(leadId)) return;

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (lead.statut !== targetStatus) {
      const currentIndex = COLUMNS.findIndex(col => col.id === lead.statut);
      const targetIndex = COLUMNS.findIndex(col => col.id === targetStatus);
      const direction = targetIndex > currentIndex ? "forward" : "backward";

      if (canMoveLead(lead, direction, targetStatus)) {
        onUpdateLeadStatus(lead.id, targetStatus);
      }
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Haute":
        return "border-rosepine-love/20 text-rosepine-love bg-rosepine-love/10 font-bold rounded-full px-2 py-0.5 text-[9px]";
      case "Moyenne":
        return "border-rosepine-gold/20 text-rosepine-gold bg-rosepine-gold/10 font-bold rounded-full px-2 py-0.5 text-[9px]";
      case "Basse":
      default:
        return "border-rosepine-pine/20 text-rosepine-pine bg-rosepine-pine/10 font-bold rounded-full px-2 py-0.5 text-[9px]";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-sans">
      {/* Search & Filters Subheader */}
      <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-sub/30 dark:bg-drac-sub/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-3xl">
          {/* Search */}
          <div className="relative flex-1">
            <input
              id="search-leads-input"
              type="text"
              placeholder="Rechercher par société ou contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="blunt-input pl-9 bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg rounded-xl text-xs"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dracl-muted dark:text-drac-comment" />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <select
              id="source-filter"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="blunt-input bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg pr-8 appearance-none min-w-[140px] rounded-xl text-xs"
            >
              <option value="All">Toutes les sources</option>
              {allSources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-dracl-muted dark:text-drac-comment pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              id="priority-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="blunt-input bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg pr-8 appearance-none min-w-[130px] rounded-xl text-xs"
            >
              <option value="All">Priorités</option>
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
            </select>
            <Filter className="absolute right-3 top-3.5 h-3 w-3 text-dracl-muted dark:text-drac-comment pointer-events-none" />
          </div>
        </div>

        {/* Action button */}
        {(currentUser.role === "admin" || currentUser.role === "manager" || currentUser.role === "marketing") && (
          <button
            id="new-lead-kanban-btn"
            onClick={onOpenCreateModal}
            className="bg-rosepine-iris hover:bg-rosepine-iris/90 text-white font-bold px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 h-9 shrink-0 transition-all cursor-pointer shadow-lg shadow-rosepine-iris/15"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Lead</span>
          </button>
        )}
      </div>

      {/* Visual Instruction Banner */}
      <div className="px-4 py-2 bg-rosepine-iris/5 border-b border-neutral-200/60 dark:border-neutral-800/40 text-[11px] text-dracl-muted dark:text-drac-comment flex items-center gap-2 font-mono shrink-0 select-none">
        <Sparkles className="h-3.5 w-3.5 text-rosepine-rose shrink-0" />
        <span className="font-semibold text-dracl-muted dark:text-drac-comment">
          PIPELINE DE VENTES AUTOMATISÉ : Glissez-déposez les leads ou cliquez sur les flèches rapides pour mettre à jour.
        </span>
      </div>

      {/* Mobile Column Selector Tab Bar */}
      <div className="flex md:hidden border-b border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card overflow-x-auto shrink-0 p-1">
        {COLUMNS.map((col) => {
          const colLeads = filteredLeads.filter(l => l.statut === col.id);
          const isActive = mobileActiveColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveColumn(col.id)}
              className={`flex-1 min-w-[100px] text-center py-2 px-1 text-[11px] font-bold border-b-2 transition-all shrink-0 ${
                isActive 
                  ? "border-rosepine-iris text-rosepine-iris dark:border-rosepine-rose dark:text-rosepine-rose" 
                  : "border-transparent text-dracl-muted dark:text-drac-comment"
              }`}
            >
              <div>{col.label}</div>
              <div className="font-mono text-[9px] opacity-75 mt-0.5">({colLeads.length})</div>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto flex items-stretch p-4 gap-4 bg-transparent">
        {COLUMNS.map((column) => {
          const columnLeads = getColumnLeads(column.id);
          const totalValue = getColumnTotalValue(column.id);
          const isCurrentMobileColumn = mobileActiveColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col min-w-[285px] md:w-1/5 bg-dracl-sub/35 dark:bg-drac-card/35 border rounded-2xl h-[calc(100vh-210px)] overflow-hidden shrink-0 transition-all ${
                isCurrentMobileColumn ? "flex flex-1 w-full" : "hidden md:flex"
              } ${
                dragOverColumn === column.id 
                  ? "border-rosepine-iris dark:border-rosepine-rose ring-2 ring-rosepine-iris/10 dark:ring-rosepine-rose/10 bg-dracl-sub/60 dark:bg-drac-sub/30" 
                  : "border-neutral-200/60 dark:border-neutral-800/40"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-neutral-200/60 dark:border-neutral-800/40 flex items-center justify-between bg-dracl-card dark:bg-drac-card shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-dracl-fg dark:text-neutral-200 flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-rosepine-iris dark:bg-rosepine-rose inline-block animate-pulse"></span>
                    {column.label}
                  </h3>
                  <p className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment mt-0.5">
                    {columnLeads.length} {columnLeads.length > 1 ? "leads" : "lead"}
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-rosepine-iris dark:text-rosepine-rose bg-rosepine-iris/10 dark:bg-rosepine-rose/10 px-2 py-1 rounded-lg border border-rosepine-iris/15 dark:border-rosepine-rose/15">
                  {formatCurrency(totalValue)}
                </div>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {columnLeads.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200/50 dark:border-neutral-800/30 rounded-2xl text-center p-4">
                    <p className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment uppercase tracking-widest font-bold">
                      Vide
                    </p>
                    <p className="text-[9px] text-dracl-muted/70 dark:text-drac-comment/75 mt-1">
                      Déposez un lead ici
                    </p>
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const currentIndex = COLUMNS.findIndex(col => col.id === lead.statut);
                    const canMoveLeft = currentIndex > 0 && canMoveLead(lead, "backward", COLUMNS[currentIndex - 1].id);
                    const canMoveRight = currentIndex < COLUMNS.length - 1 && canMoveLead(lead, "forward", COLUMNS[currentIndex + 1].id);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className="p-4 bg-dracl-card dark:bg-drac-card border border-neutral-200/50 dark:border-neutral-800/40 rounded-xl cursor-grab active:cursor-grabbing hover:border-rosepine-iris/40 dark:hover:border-rosepine-rose/40 hover:-translate-y-0.5 transition-all duration-150 group shadow-[0_2px_8px_rgba(87,82,121,0.015)] dark:shadow-none"
                      >
                        {/* Header: Source & Priority */}
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[9px] font-mono text-dracl-muted dark:text-drac-comment font-bold uppercase tracking-wider">
                            {lead.source || "Autre"}
                          </span>
                          <span className={`text-[9px] font-mono border ${getPriorityStyle(lead.priorite)}`}>
                            {lead.priorite}
                          </span>
                        </div>

                        {/* Title: Company Name */}
                        <h4 className="text-xs font-bold text-dracl-fg dark:text-neutral-50 mt-1.5 truncate">
                          {lead.entrepriseNom || "Particulier"}
                        </h4>
                        
                        {/* Contact Name */}
                        <p className="text-[11px] text-dracl-muted dark:text-drac-comment mt-0.5">
                          {lead.prenom} {lead.nom}
                        </p>

                        {/* Value & Score */}
                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-neutral-200/40 dark:border-neutral-800/20">
                          <span className="text-xs font-mono font-bold text-dracl-fg dark:text-neutral-100">
                            {formatCurrency(lead.valeurEstimee)}
                          </span>

                          {/* IA Score */}
                          <div className="flex items-center gap-1 bg-rosepine-gold/10 dark:bg-rosepine-gold/15 border border-rosepine-gold/15 dark:border-rosepine-gold/20 px-1.5 py-0.5 rounded-lg text-[10px] font-mono">
                            <Sparkles className="h-3 w-3 text-rosepine-gold shrink-0 animate-pulse" />
                            <span className="font-bold text-rosepine-gold">
                              {lead.score}
                            </span>
                          </div>
                        </div>

                        {/* Assignee & Fast Navigation Arrows */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-250/20 dark:border-neutral-800/20">
                          <div className="flex items-center gap-1 text-[10px] text-dracl-muted dark:text-drac-comment truncate max-w-[120px]">
                            <UserIcon className="h-3.5 w-3.5 text-dracl-muted dark:text-drac-comment shrink-0" />
                            <span className="truncate font-medium">{lead.commercialNomComplet || "Non attribué"}</span>
                          </div>

                          {/* Quick change buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            {canMoveLeft && (
                              <button
                                id={`move-back-${lead.id}`}
                                title="Déplacer à l'étape précédente"
                                onClick={(e) => handleMove(e, lead, "backward")}
                                className="p-1 border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-sub dark:bg-drac-sub rounded-lg hover:border-rosepine-iris cursor-pointer"
                              >
                                <ArrowLeft className="h-2.5 w-2.5 text-dracl-muted dark:text-drac-comment hover:text-rosepine-iris" />
                              </button>
                            )}
                            {canMoveRight && (
                              <button
                                id={`move-forward-${lead.id}`}
                                title="Déplacer à l'étape suivante"
                                onClick={(e) => handleMove(e, lead, "forward")}
                                className="p-1 border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-sub dark:bg-drac-sub rounded-lg hover:border-rosepine-iris cursor-pointer"
                              >
                                <ArrowRight className="h-2.5 w-2.5 text-dracl-muted dark:text-drac-comment hover:text-rosepine-iris" />
                              </button>
                            )}
                            <button
                              id={`view-${lead.id}`}
                              title="Voir détails"
                              className="p-1 border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-sub dark:bg-drac-sub rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              <ChevronRight className="h-2.5 w-2.5 text-dracl-muted" />
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
  );
}
