import React from "react";
import { Shield, Sun, Moon, LogOut } from "lucide-react";
import { UserProfile } from "../../types";

interface HeaderProps {
  currentUser: UserProfile | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  return (
    <header className="bg-dracl-card dark:bg-drac-card border-b border-neutral-200/60 dark:border-neutral-800/40 p-4 flex justify-between items-center sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-4">
        <Shield className="w-6 h-6 text-rosepine-iris animate-pulse shrink-0" />
        <h1 className="text-xl font-display font-bold tracking-tight">LEADFLOW</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme switcher */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle Theme"
          className="p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-card dark:bg-drac-card hover:bg-dracl-sub dark:hover:bg-drac-sub text-dracl-fg dark:text-drac-fg transition-all cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-rosepine-gold" />
          ) : (
            <Moon className="w-4 h-4 text-rosepine-iris" />
          )}
        </button>

        {currentUser && (
          <div className="flex items-center gap-3 border-l border-neutral-200 dark:border-neutral-800 pl-3">
            <div className="text-right hidden md:block">
              <p className="text-[9px] leading-none text-dracl-muted dark:text-drac-comment uppercase tracking-wider">
                Connecté en tant que :
              </p>
              <p className="text-xs font-bold mt-0.5 uppercase tracking-tight">
                {currentUser.username} [{currentUser.role}]
              </p>
            </div>
            <button
              onClick={onLogout}
              id="header-logout-btn"
              className="blunt-button blunt-button-secondary text-[11px] px-3 py-1.5 flex items-center gap-1.5 hover:bg-rosepine-love/10 hover:text-rosepine-love hover:border-rosepine-love/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
