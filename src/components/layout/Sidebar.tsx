import React from "react";
import { User, Shield, Activity, AlertTriangle } from "lucide-react";
import { AdminTab, UserTab } from "../../types";

interface SidebarProps {
  userRole: string;
  adminTab: AdminTab;
  userTab: UserTab;
  onAdminTabChange: (tab: AdminTab) => void;
  onUserTabChange: (tab: UserTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  adminTab,
  userTab,
  onAdminTabChange,
  onUserTabChange,
}) => {
  const isAdmin = userRole === "admin";

  return (
    <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200/60 dark:border-neutral-800/40 p-4 flex flex-col gap-2 shrink-0 bg-dracl-sub dark:bg-drac-sub">
      <div className="text-[10px] font-bold text-dracl-muted dark:text-drac-comment uppercase tracking-widest mb-2 px-1">
        Navigation
      </div>

      {isAdmin ? (
        <>
          <button
            onClick={() => onAdminTabChange("users")}
            className={`w-full text-left p-2.5 rounded-lg border uppercase text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              adminTab === "users"
                ? "border-rosepine-iris/20 text-rosepine-iris bg-rosepine-iris/10"
                : "border-transparent text-dracl-fg dark:text-drac-fg hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <User className="w-4 h-4 text-rosepine-iris" />
            <span>Annuaire des utilisateurs</span>
          </button>
          <button
            onClick={() => onAdminTabChange("matrix")}
            className={`w-full text-left p-2.5 rounded-lg border uppercase text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              adminTab === "matrix"
                ? "border-rosepine-iris/20 text-rosepine-iris bg-rosepine-iris/10"
                : "border-transparent text-dracl-fg dark:text-drac-fg hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Shield className="w-4 h-4 text-rosepine-iris" />
            <span>Matrice des habilitations</span>
          </button>
          <button
            onClick={() => onAdminTabChange("logs")}
            className={`w-full text-left p-2.5 rounded-lg border uppercase text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              adminTab === "logs"
                ? "border-rosepine-iris/20 text-rosepine-iris bg-rosepine-iris/10"
                : "border-transparent text-dracl-fg dark:text-drac-fg hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Activity className="w-4 h-4 text-rosepine-iris" />
            <span>Journal d'activité</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => onUserTabChange("host")}
            className={`w-full text-left p-2.5 rounded-lg border uppercase text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              userTab === "host"
                ? "border-rosepine-iris/20 text-rosepine-iris bg-rosepine-iris/10"
                : "border-transparent text-dracl-fg dark:text-drac-fg hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Shield className="w-4 h-4 text-rosepine-iris" />
            <span>Espace personnel</span>
          </button>
          <button
            onClick={() => onUserTabChange("matrix")}
            className={`w-full text-left p-2.5 rounded-lg border uppercase text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              userTab === "matrix"
                ? "border-rosepine-iris/20 text-rosepine-iris bg-rosepine-iris/10"
                : "border-transparent text-dracl-fg dark:text-drac-fg hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Shield className="w-4 h-4 text-rosepine-iris" />
            <span>Matrice des habilitations</span>
          </button>
        </>
      )}

      {/* Left Alert Warning box */}
      <div className="mt-auto hidden md:block">
        <div className="p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-rosepine-gold">
            <AlertTriangle className="w-4 h-4" />
            <span>Contrôle de sécurité</span>
          </p>
          <p className="text-[9.5px] leading-relaxed mt-1 text-dracl-muted dark:text-drac-comment font-mono uppercase">
            {isAdmin
              ? "ACCÈS ADMINISTRATEUR ACTIF. TOUTES LES ACTIONS SONT ENREGISTRÉES."
              : `Habilitations : [${userRole.toUpperCase()}]. Les actions non assignées sont restreintes.`}
          </p>
        </div>
      </div>
    </nav>
  );
};
