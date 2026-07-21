import React from "react";
import { Activity, RefreshCw } from "lucide-react";
import { ActivityLog } from "../../types";

interface AdminLogsProps {
  logs: ActivityLog[];
  loadingLogs: boolean;
  logFilter: string;
  logActionFilter: string;
  onLogFilterChange: (val: string) => void;
  onLogActionFilterChange: (val: string) => void;
  onRefresh: () => void;
}

export const AdminLogs: React.FC<AdminLogsProps> = ({
  logs,
  loadingLogs,
  logFilter,
  logActionFilter,
  onLogFilterChange,
  onLogActionFilterChange,
  onRefresh,
}) => {
  const uniqueActions = ["LOGIN", "FAILED_LOGIN", "LOGOUT", "REGISTER", "UPDATE_USER", "DELETE_USER"];

  const filteredLogs = logs.filter((log) => {
    const matchKeyword =
      log.username.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(logFilter.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(logFilter.toLowerCase()));

    const matchAction = logActionFilter === "" || log.action === logActionFilter;

    return matchKeyword && matchAction;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Audit Header Controls */}
      <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/40 bg-dracl-sub dark:bg-drac-sub flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shrink-0">
        <h2 className="text-sm font-display font-bold uppercase tracking-tight flex items-center gap-2 text-dracl-fg dark:text-white">
          <Activity className="w-4 h-4 text-rosepine-iris" />
          <span>Journal d'activité et de sécurité</span>
        </h2>

        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          {/* Action selector */}
          <select
            value={logActionFilter}
            onChange={(e) => onLogActionFilterChange(e.target.value)}
            className="blunt-input text-xs py-1.5 px-3 w-full sm:w-auto"
          >
            <option value="">TOUTES LES ACTIONS</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* Search logs text */}
          <input
            type="text"
            placeholder="RECHERCHER DANS LES JOURNAUX..."
            value={logFilter}
            onChange={(e) => onLogFilterChange(e.target.value)}
            className="blunt-input text-xs py-1.5 px-3 w-full sm:w-48 placeholder:text-neutral-400"
          />

          {/* Refresh stream */}
          <button
            onClick={onRefresh}
            disabled={loadingLogs}
            className="blunt-button blunt-button-secondary py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Telemetry log output stream container */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 blunt-card bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="bg-neutral-100 dark:bg-neutral-900 text-dracl-muted dark:text-drac-comment px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest flex justify-between shrink-0 border-b border-neutral-200 dark:border-neutral-800">
            <span>Flux d'activité du système</span>
            <span className="animate-pulse text-rosepine-pine font-bold">[FLUX_ACTIF]</span>
          </div>

          {loadingLogs && logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl m-4">
              <RefreshCw className="animate-spin w-8 h-8 text-rosepine-iris mb-2" />
              <p className="text-[10px] font-mono uppercase text-dracl-muted dark:text-drac-comment">
                Récupération des données...
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs font-bold text-dracl-muted dark:text-drac-comment uppercase italic p-4">
              Aucun événement ne correspond aux filtres.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 p-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 leading-relaxed"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment">
                        #{log.id}
                      </span>
                      <span className="bg-rosepine-iris/10 text-rosepine-iris px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold">
                        {log.action}
                      </span>
                      <strong className="text-dracl-fg dark:text-white font-bold">
                        {log.username}
                      </strong>
                      <span className="text-[10px] font-mono text-dracl-muted dark:text-drac-comment bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200/40 dark:border-neutral-800/40">
                        IP: {log.ipAddress}
                      </span>
                    </div>
                    <p className="text-dracl-fg dark:text-drac-fg text-[11px] leading-relaxed mt-1 font-mono">
                      {log.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-dracl-muted dark:text-drac-comment font-mono md:text-right shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
