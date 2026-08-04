import React from "react";
import { LogOut, UserRound } from "lucide-react";
import { User } from "../types";
import { setAccessToken } from "../api";
import { usePreferences } from "../AppPreferences";

interface HeaderProps {
  activeUser: User;
}

export default function Header({ activeUser }: HeaderProps) {
  const { t } = usePreferences();

  const handleLogout = () => {
    setAccessToken(null);
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-slate-100 text-slate-800 h-16 flex items-center justify-end px-6 sticky top-0 z-40 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" id="app-header">
      <div className="flex items-center gap-3">
        {/* User Identity */}
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 dark:bg-slate-850 dark:text-slate-200 dark:border-slate-700">
          <UserRound className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeUser.nom}</span>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title={t("header.logout") || "Log Out"}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
