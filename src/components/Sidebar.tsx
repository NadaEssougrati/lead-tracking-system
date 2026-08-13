import React from "react";
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
  Target,
  LogOut,
  Sun,
  Moon,
  Receipt
} from "lucide-react";
import { Role, User as UserType } from "../types";
import { usePreferences } from "../AppPreferences";
import { setAccessToken } from "../api";

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
  | "quotes"
  | "team"
  | "settings"
  | "system_settings";

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
}: SidebarProps) {
  const { t, theme, setTheme } = usePreferences();

  const handleLogout = () => {
    setAccessToken(null);
    window.location.reload();
  };

  const mainItem = { id: "dashboard" as SidebarTab, labelKey: "nav.dashboard", icon: Home };

  const sections = [
    {
      titleKey: "nav.section.leads",
      items: [
        { id: "leads" as SidebarTab, labelKey: "nav.leads", icon: Users },
        { id: "opportunities" as SidebarTab, labelKey: "nav.opportunities", icon: KanbanSquare },
        { id: "companies" as SidebarTab, labelKey: "nav.companies", icon: Building2 },
        { id: "quotes" as SidebarTab, labelKey: "nav.quotes", icon: Receipt }
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
        { id: "dashboards_analysis" as SidebarTab, labelKey: "nav.analytics", icon: BarChart3 }
      ]
    },
    {
      titleKey: "nav.section.management",
      items: [
        { id: "team" as SidebarTab, labelKey: "nav.team", icon: Users },
        { id: "settings" as SidebarTab, labelKey: "nav.accountSettings", icon: User },
        { id: "system_settings" as SidebarTab, labelKey: "nav.systemSettings", icon: Settings }
      ]
    }
  ];

  const getFilteredSections = () => {
    return sections.map(section => {
      const filteredItems = section.items.filter(item => {
        if (item.id === "settings") {
          return true; // Available to all users!
        }
        if (item.id === "system_settings") {
          return activeUser.role === Role.ADMIN; // Restricted to admin only
        }
        if (item.id === "team") {
          return activeUser.role === Role.ADMIN || activeUser.role === Role.MANAGER;
        }
        if (item.id === "quotes") {
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
      {/* Brand Header & Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-blue-950/60 bg-[#090f1d] flex-shrink-0">
        <div className="h-7 w-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-md shadow-blue-500/5 text-blue-450 flex-shrink-0">
          <Target className="h-4.5 w-4.5 text-blue-400" />
        </div>
        <span className="font-bold text-xs text-white tracking-wide uppercase">LeadFlow CRM</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 select-none animate-fade-in">
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
    </aside>
  );
}
