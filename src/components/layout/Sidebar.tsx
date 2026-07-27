import React from "react";
import {
  LayoutDashboard,
  Users,
  Columns3,
  Building2,
  Contact,
  SquareCheckBig,
  Phone,
  Mail,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  X
} from "lucide-react";
import { UserProfile } from "../../types";

interface SidebarProps {
  currentUser: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}) => {
  const userRole = currentUser?.role || "commercial";
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isMarketing = userRole === "marketing";

  const renderButton = (tabId: string, label: string, icon: React.ReactNode) => {
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => onTabChange(tabId)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg border-0 transition-all duration-150 cursor-pointer ${
          isActive
            ? "bg-rosepine-iris text-white shadow-lg shadow-rosepine-iris/15"
            : "text-dracl-muted dark:text-drac-comment hover:text-dracl-fg dark:hover:text-drac-fg hover:bg-dracl-select dark:hover:bg-drac-select"
        }`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-dracl-muted dark:text-drac-comment"}`,
          "aria-hidden": "true",
        })}
        <span className="font-sans text-left">{label}</span>
      </button>
    );
  };

  const renderNavContent = () => {
    if (isAdmin) {
      return (
        <>
          <div>
            {renderButton("dashboard", "Tableau de bord", <LayoutDashboard />)}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              LEADS &amp; OPPORTUNITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("workspace", "Leads", <Users />)}
              {renderButton("opportunities", "Opportunités", <Columns3 />)}
              {renderButton("companies", "Entreprises", <Building2 />)}
              {renderButton("contacts", "Contacts", <Contact />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ACTIVITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("tasks", "Tâches", <SquareCheckBig />)}
              {renderButton("calls", "Appels", <Phone />)}
              {renderButton("emails", "Emails", <Mail />)}
              {renderButton("appointments", "Rendez-vous", <Calendar />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ANALYSES
            </h3>
            <div className="space-y-0.5">
              {renderButton("reports", "Rapports", <FileText />)}
              {renderButton("analytics", "Analyses & Performance", <TrendingUp />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              GESTION
            </h3>
            <div className="space-y-0.5">
              {renderButton("users", "Gestion des utilisateurs", <Users />)}
              {renderButton("logs", "Journal d'activité", <Settings />)}
            </div>
          </div>
        </>
      );
    }

    if (isMarketing) {
      return (
        <>
          <div>
            {renderButton("dashboard", "Tableau de bord", <LayoutDashboard />)}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              LEADS &amp; OPPORTUNITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("workspace", "Leads", <Users />)}
              {renderButton("opportunities", "Opportunités", <Columns3 />)}
              {renderButton("companies", "Entreprises", <Building2 />)}
              {renderButton("contacts", "Contacts", <Contact />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ACTIVITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("tasks", "Tâches", <SquareCheckBig />)}
              {renderButton("emails", "Emails", <Mail />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ANALYSES
            </h3>
            <div className="space-y-0.5">
              {renderButton("reports", "Rapports", <FileText />)}
              {renderButton("analytics", "Analyses & Performance", <TrendingUp />)}
            </div>
          </div>
        </>
      );
    }

    if (isManager) {
      return (
        <>
          <div>
            {renderButton("dashboard", "Tableau de bord", <LayoutDashboard />)}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              LEADS &amp; OPPORTUNITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("workspace", "Leads", <Users />)}
              {renderButton("opportunities", "Opportunités", <Columns3 />)}
              {renderButton("companies", "Entreprises", <Building2 />)}
              {renderButton("contacts", "Contacts", <Contact />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ACTIVITÉS
            </h3>
            <div className="space-y-0.5">
              {renderButton("tasks", "Tâches", <SquareCheckBig />)}
              {renderButton("calls", "Appels", <Phone />)}
              {renderButton("emails", "Emails", <Mail />)}
              {renderButton("appointments", "Rendez-vous", <Calendar />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              ANALYSES
            </h3>
            <div className="space-y-0.5">
              {renderButton("reports", "Rapports", <FileText />)}
              {renderButton("analytics", "Analyses & Performance", <TrendingUp />)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
              GESTION
            </h3>
            <div className="space-y-0.5">
              {renderButton("team", "Équipe", <Users />)}
              {renderButton("settings", "Paramètres", <Settings />)}
            </div>
          </div>
        </>
      );
    }

    // Commercial / Default
    return (
      <>
        <div>
          {renderButton("dashboard", "Tableau de bord", <LayoutDashboard />)}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
            LEADS &amp; OPPORTUNITÉS
          </h3>
          <div className="space-y-0.5">
            {renderButton("workspace", "Leads", <Users />)}
            {renderButton("opportunities", "Opportunités", <Columns3 />)}
            {renderButton("companies", "Entreprises", <Building2 />)}
            {renderButton("contacts", "Contacts", <Contact />)}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
            ACTIVITÉS
          </h3>
          <div className="space-y-0.5">
            {renderButton("tasks", "Tâches", <SquareCheckBig />)}
            {renderButton("calls", "Appels", <Phone />)}
            {renderButton("emails", "Emails", <Mail />)}
            {renderButton("appointments", "Rendez-vous", <Calendar />)}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-[9px] font-mono font-bold tracking-widest text-dracl-muted/85 dark:text-drac-comment/85 uppercase px-4 pt-1 pb-1">
            ANALYSES
          </h3>
          <div className="space-y-0.5">
            {renderButton("reports", "Rapports", <FileText />)}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`fixed md:relative inset-y-0 left-0 z-40 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 ease-in-out shrink-0 h-full`}>
      <aside className="w-64 bg-dracl-sub dark:bg-drac-sub border-r border-neutral-200/60 dark:border-neutral-800/40 h-full font-sans shrink-0 select-none transition-colors duration-300 py-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 md:hidden border border-neutral-200/60 dark:border-neutral-800/40 text-dracl-fg dark:text-drac-fg bg-dracl-card dark:bg-drac-card hover:bg-dracl-select dark:hover:bg-drac-select rounded-lg cursor-pointer z-50 animate-fade-in"
          title="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar">
          {renderNavContent()}
        </div>
      </aside>
    </div>
  );
};
