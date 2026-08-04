/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Home, 
  Users, 
  KanbanSquare, 
  Building2, 
  User, 
  CheckSquare, 
  Phone, 
  Mail, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings, 
  ChevronDown,
  LogOut
} from "lucide-react";
import { Role, User as UserType } from "../types";
import { setAccessToken } from "../api";
import { usePreferences } from "../AppPreferences";

export type SidebarTab = 
  | "dashboard"
  | "leads"
  | "opportunities"
  | "companies"
  | "contacts"
  | "tasks"
  | "calls"
  | "emails"
  | "meetings"
  | "dashboards_analysis"
  | "reports"
  | "team"
  | "settings";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  userRole: Role;
  selectedLeadId: string | null;
  activeUser: UserType;
  users?: UserType[];
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  userRole, 
  selectedLeadId,
  activeUser,
  users,
  onUserChange
}: SidebarProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = usePreferences();

  const handleLogout = () => {
    setAccessToken(null);
    window.location.reload();
  };

  const getUserAvatar = (user: UserType) => {
    if (user.avatar) return user.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nom)}&background=0B1528&color=93c5fd&size=128`;
  };

  const mainItem = { id: "dashboard" as SidebarTab, labelKey: "nav.dashboard", icon: Home };

  const sections = [
    {
      titleKey: "nav.section.leads",
      items: [
        { id: "leads" as SidebarTab, labelKey: "nav.leads", icon: Users },
        { id: "opportunities" as SidebarTab, labelKey: "nav.opportunities", icon: KanbanSquare },
        { id: "companies" as SidebarTab, labelKey: "nav.companies", icon: Building2 },
        { id: "contacts" as SidebarTab, labelKey: "nav.contacts", icon: User }
      ]
    },
    {
      titleKey: "nav.section.activities",
      items: [
        { id: "tasks" as SidebarTab, labelKey: "nav.tasks", icon: CheckSquare },
        { id: "calls" as SidebarTab, labelKey: "nav.calls", icon: Phone },
        { id: "emails" as SidebarTab, labelKey: "nav.emails", icon: Mail },
        { id: "meetings" as SidebarTab, labelKey: "nav.meetings", icon: Calendar }
      ]
    },
    {
      titleKey: "nav.section.analytics",
      items: [
        { id: "reports" as SidebarTab, labelKey: "nav.reports", icon: FileText },
        { id: "dashboards_analysis" as SidebarTab, labelKey: "nav.analytics", icon: BarChart3 }
      ]
    },
    {
      titleKey: "nav.section.management",
      items: [
        { id: "team" as SidebarTab, labelKey: "nav.team", icon: Users },
        { id: "settings" as SidebarTab, labelKey: "nav.settings", icon: Settings }
      ]
    }
  ];

  const getFilteredSections = () => {
    return sections.map(section => {
      const filteredItems = section.items.filter(item => {
        if (item.id === "settings") {
          return activeUser.role === Role.ADMIN;
        }
        if (item.id === "team") {
          return activeUser.role === Role.ADMIN || activeUser.role === Role.MANAGER;
        }
        if (item.id === "reports") {
          return activeUser.role !== Role.MARKETING;
        }
        if (item.id === "dashboards_analysis") {
          return activeUser.role === Role.ADMIN || activeUser.role === Role.MANAGER;
        }
        if (activeUser.role === Role.MARKETING) {
          if (["opportunities", "tasks", "calls", "emails", "meetings"].includes(item.id)) {
            return false;
          }
        }
        return true;
      });
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  };

  const filteredSections = getFilteredSections();

  return (
    <aside className="w-60 bg-[#0B1528] border-r border-blue-950 flex flex-col h-screen text-slate-200 font-sans" id="app-sidebar">
      
      <div className="flex-1 overflow-y-auto px-2 py-4 select-none">
        
        <button
          onClick={() => onTabChange(mainItem.id)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 mb-4 cursor-pointer ${
            activeTab === mainItem.id
              ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20"
              : "hover:bg-white/5 text-slate-300 hover:text-white"
          }`}
        >
<Home className="h-4 w-4" />
          <span>{t(mainItem.labelKey)}</span>
        </button>

        {filteredSections.map((section) => (
          <div key={section.titleKey} className="mb-5">
            <h3 className="text-[9.5px] font-bold text-blue-400 uppercase tracking-widest px-3.5 mb-1.5">
              {t(section.titleKey)}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20"
                        : "hover:bg-white/5 text-slate-300 hover:text-white"
                    }`}
                  >
<Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-blue-950 bg-[#070e1b]">
        <div className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-900/70">
          <img 
            src={getUserAvatar(activeUser)} 
            alt={activeUser.nom} 
            className="h-10 w-10 rounded-full object-cover border border-blue-900/50"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate leading-tight">{activeUser.nom}</h4>
            <p className="text-[10px] text-blue-300 font-medium truncate">{activeUser.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-colors text-sm font-semibold"
        >
<LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
