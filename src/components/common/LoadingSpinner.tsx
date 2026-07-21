import React from "react";
import { RefreshCw } from "lucide-react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-dracl-bg dark:bg-drac-bg text-dracl-fg dark:text-drac-fg flex flex-col justify-center items-center p-4">
      <div className="blunt-card p-8 max-w-sm w-full text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-dracl-card dark:bg-drac-card">
        <RefreshCw className="animate-spin mx-auto mb-4 w-10 h-10 text-rosepine-iris" />
        <h2 className="text-lg font-display font-black uppercase tracking-tight mb-2">Chargement...</h2>
        <p className="text-[10px] text-dracl-muted dark:text-drac-comment font-mono uppercase tracking-wider">
          Vérification de la session en cours...
        </p>
      </div>
    </div>
  );
};
