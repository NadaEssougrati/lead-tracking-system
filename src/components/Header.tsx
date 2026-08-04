/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Bell, Search, ShieldCheck, UserCheck, CheckCircle2, AlertTriangle, Info, LogOut } from "lucide-react";
import { User, SystemNotification } from "../types";
import { setAccessToken } from "../api";
import { usePreferences } from "../AppPreferences";

interface HeaderProps {
  activeUser: User;
  notifications: SystemNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  currentPageTitle: string;
}

export default function Header({
  activeUser,
  notifications,
  onMarkNotificationAsRead,
  onClearNotifications,
  searchTerm,
  onSearchChange,
  currentPageTitle,
}: HeaderProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const { t } = usePreferences();
  const unreadCount = notifications.filter((n) => !n.lue).length;

  const handleLogout = () => {
    setAccessToken(null);
    window.location.reload();
  };

  return (
<header className="bg-white border-b border-slate-100 text-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" id="app-header">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          {currentPageTitle}
        </h1>
        {searchTerm !== undefined && (
          <div className="relative max-w-xs hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={t("header.search.placeholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-lg pl-9 pr-4 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Active Role / Profil Bar */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>{activeUser.role}</span>
          </div>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors relative"
            title={t("header.notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-slate-800">
                <span className="font-semibold text-sm">{t("header.notifications")} ({unreadCount})</span>
                {notifications.length > 0 && (
                  <button
                    onClick={onClearNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    {t("header.notifications.clearl")}
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    {t("header.notifications.empty")}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationAsRead(notif.id)}
                      className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        !notif.lue ? "bg-slate-100/50 font-medium" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {notif.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {notif.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-800 font-semibold">{notif.titre}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{notif.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {new Date(notif.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!notif.lue && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 self-center"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Banner */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200">
            {activeUser.nom.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800">{activeUser.nom}</p>
            <p className="text-[10px] text-slate-500 font-medium">{activeUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
            title={t("header.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
