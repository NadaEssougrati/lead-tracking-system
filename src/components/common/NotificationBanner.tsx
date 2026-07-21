import React from "react";
import { AlertTriangle, Check } from "lucide-react";

interface NotificationBannerProps {
  apiError: string | null;
  apiSuccess: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  apiError,
  apiSuccess,
  onClearError,
  onClearSuccess,
}) => {
  if (!apiError && !apiSuccess) return null;

  return (
    <div className="p-4 empty:hidden space-y-2 bg-dracl-sub dark:bg-drac-sub border-b border-neutral-200/60 dark:border-neutral-800/40">
      {apiError && (
        <div className="bg-rosepine-love/10 border border-rosepine-love/30 p-3 rounded-lg flex items-start gap-3">
          <div className="bg-rosepine-love text-white p-1 rounded-md shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold font-display uppercase text-rosepine-love text-xs tracking-tight">Erreur</h4>
            <p className="text-xs font-medium mt-0.5 leading-normal">{apiError}</p>
          </div>
          <button
            onClick={onClearError}
            className="font-bold text-xs text-dracl-muted hover:text-dracl-fg dark:text-drac-comment dark:hover:text-drac-fg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {apiSuccess && (
        <div className="bg-rosepine-pine/10 border border-rosepine-pine/30 p-3 rounded-lg flex items-start gap-3">
          <div className="bg-rosepine-pine text-white p-1 rounded-md shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold font-display uppercase text-rosepine-pine text-xs tracking-tight">Succès</h4>
            <p className="text-xs font-medium mt-0.5 leading-normal">{apiSuccess}</p>
          </div>
          <button
            onClick={onClearSuccess}
            className="font-bold text-xs text-dracl-muted hover:text-dracl-fg dark:text-drac-comment dark:hover:text-drac-fg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
