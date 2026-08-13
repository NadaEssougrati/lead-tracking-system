/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Percent, 
  BadgeCheck, 
  AlertOctagon, 
  Briefcase, 
  HelpCircle,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  CalendarDays,
  Target,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  Filter,
  Coins,
  TrendingDown,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ListFilter,
  UserRound
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Lead, LeadStatus, LeadSource, User, Activity, LeadPriority, Role } from "../types";
import { usePreferences } from "../AppPreferences";

interface DashboardStatsProps {
  leads: Lead[];
  users: User[];
  activities: Activity[];
  onSelectLead: (id: string) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function DashboardStats({ leads, users, activities = [], onSelectLead }: DashboardStatsProps) {
  const { t } = usePreferences();
  // --- A. Dynamic Dashboard States ---
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedCommercial, setSelectedCommercial] = useState<string>("all");
  const [minValFilter, setMinValFilter] = useState<number>(0);
  const [salesGoal, setSalesGoal] = useState<number>(150000);
  const [activityViewType, setActivityViewType] = useState<"timeline" | "cards">("timeline");

  // Filter leads based on selected states
  const filteredLeads = leads.filter(l => {
    const matchesPriority = selectedPriority === "all" || l.priorite === selectedPriority;
    const matchesCommercial = selectedCommercial === "all" || l.commercialId === selectedCommercial;
    const matchesValue = l.valeurEstimee >= minValFilter;
    return matchesPriority && matchesCommercial && matchesValue;
  });

  // --- B. Calculations based on filtered leads ---
  const totalLeads = filteredLeads.length;
  
  const activeStages = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
    LeadStatus.NEGOTIATION
  ];
  
  const activeLeads = filteredLeads.filter(l => activeStages.includes(l.statut));
  const activeValue = activeLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
  
  const wonLeads = filteredLeads.filter(l => l.statut === LeadStatus.WON);
  const wonValue = wonLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
  
  const lostLeads = filteredLeads.filter(l => l.statut === LeadStatus.LOST || l.statut === LeadStatus.CLOSED);
  
  const totalResolved = wonLeads.length + lostLeads.length;
  const conversionRate = totalResolved > 0 ? Math.round((wonLeads.length / totalResolved) * 100) : 0;

  // --- Translation label helpers ---
  const statusLabel = (status: LeadStatus): string => {
    const map: Record<LeadStatus, string> = {
      [LeadStatus.NEW]: t("kanban.nouveau"),
      [LeadStatus.CONTACTED]: t("kanban.contacte"),
      [LeadStatus.QUALIFIED]: t("kanban.qualifie"),
      [LeadStatus.PROPOSAL]: t("kanban.proposition"),
      [LeadStatus.NEGOTIATION]: t("kanban.negociation"),
      [LeadStatus.WON]: t("kanban.gagne"),
      [LeadStatus.LOST]: t("kanban.perdu"),
      [LeadStatus.CLOSED]: t("kanban.ferme"),
    };
    return map[status] || status;
  };

  const sourceLabel = (source: LeadSource): string => {
    const map: Record<LeadSource, string> = {
      [LeadSource.WEBSITE]: t("source.website"),
      [LeadSource.SOCIAL]: t("source.social"),
      [LeadSource.REFERRAL]: t("source.referral"),
      [LeadSource.EMAIL]: t("source.email"),
      [LeadSource.SALON]: t("source.salon"),
      [LeadSource.PHONE]: t("source.phone"),
    };
    return map[source] || source;
  };

  // --- C. Chart Data ---
  const stageData = Object.values(LeadStatus).map(status => {
    const stageLeads = filteredLeads.filter(l => l.statut === status);
    const totalVal = stageLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
    return {
      name: status,
      label: statusLabel(status),
      valeur: totalVal,
      count: stageLeads.length
    };
  });

  const sourceData = Object.values(LeadSource).map(source => {
    const sourceLeads = filteredLeads.filter(l => l.source === source);
    const totalVal = sourceLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
    return {
      name: source,
      label: sourceLabel(source),
      value: sourceLeads.length,
      valeurTotale: totalVal
    };
  }).filter(d => d.value > 0);

// --- D. Leaderboard (Sales Performance per commercial) ---
  const commercials = users.filter(u => u.role === Role.COMMERCIAL);
  const leaderboard = commercials.map(comm => {
    const commLeads = filteredLeads.filter(l => l.commercialId === comm.id);
    const won = commLeads.filter(l => l.statut === LeadStatus.WON);
    const wonVal = won.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
    const active = commLeads.filter(l => activeStages.includes(l.statut));
    const activeVal = active.reduce((acc, curr) => acc + curr.valeurEstimee, 0);
    
    return {
      id: comm.id,
      nom: comm.nom,
      role: comm.role,
      wonCount: won.length,
      wonAmount: wonVal,
      activeCount: active.length,
      activeAmount: activeVal,
      totalCount: commLeads.length
    };
  }).sort((a, b) => b.wonAmount - a.wonAmount);

  // --- E. Recent high potential leads ---
  const highPotentialLeads = [...filteredLeads]
    .filter(l => activeStages.includes(l.statut))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // --- F. Goal Simulator Computations ---
  const progressPercent = Math.min(Math.round((wonValue / (salesGoal || 1)) * 100), 100);
  const remainingToGoal = Math.max(salesGoal - wonValue, 0);
  const avgOpportunityValue = Math.round(activeValue / (activeLeads.length || 1)) || 15000;
  const neededDeals = Math.ceil(remainingToGoal / avgOpportunityValue);

  return (
    <div className="space-y-6" id="dashboard-stats-root">
      
      {/* 1. Interactive Filters and Control Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t("dashboard.filters.title")}</h3>
              <p className="text-[11px] text-slate-500">{t("dashboard.filters.subtitle")}</p>
            </div>
          </div>
          {/* Quick reset button */}
          {(selectedPriority !== "all" || selectedCommercial !== "all" || minValFilter > 0) && (
            <button
              onClick={() => {
                setSelectedPriority("all");
                setSelectedCommercial("all");
                setMinValFilter(0);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              {t("dashboard.filters.reset")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Filter 1: Priority */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> {t("dashboard.filters.priority")}
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">{t("dashboard.filters.allPriorities")}</option>
              <option value={LeadPriority.HIGH}>{t("dashboard.filters.highOnly")}</option>
              <option value={LeadPriority.MEDIUM}>{t("dashboard.filters.mediumOnly")}</option>
              <option value={LeadPriority.LOW}>{t("dashboard.filters.lowOnly")}</option>
            </select>
          </div>

          {/* Filter 2: Assigned Commercial */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" /> {t("dashboard.filters.commercial")}
            </label>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="all">{t("dashboard.filters.allTeam")}</option>
              {commercials.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.role})</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Minimum Budget Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-slate-400" /> {t("dashboard.filters.minBudget")}
              </label>
              <span className="text-blue-600 font-extrabold text-[11px]">{minValFilter.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400">0 MAD</span>
              <input
                type="range"
                min="0"
                max="150000"
                step="5000"
                value={minValFilter}
                onChange={(e) => setMinValFilter(Number(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">150k MAD</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 2. Top Banner KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Widget 1: Total Pipeline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("dashboard.kpi.activePipeline")}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{(activeValue).toLocaleString('fr-FR')} MAD</h3>
            </div>
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("dashboard.kpi.activeOpps")}</span>
            <span className="font-bold text-slate-900">{activeLeads.length}</span>
          </div>
        </div>

        {/* Widget 2: Total leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("dashboard.kpi.totalLeads")}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</h3>
            </div>
            <span className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("dashboard.kpi.treatmentRate")}</span>
            <span className="font-bold text-slate-900">
              {totalLeads > 0 ? Math.round(((totalLeads - filteredLeads.filter(l => l.statut === LeadStatus.NEW).length) / totalLeads) * 100) : 0} %
            </span>
          </div>
        </div>

        {/* Widget 3: Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("dashboard.kpi.conversionRate")}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{conversionRate} %</h3>
            </div>
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Percent className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("dashboard.kpi.closedDeals")}</span>
            <span className="font-bold text-slate-900">{totalResolved}</span>
          </div>
        </div>

        {/* Widget 4: Won Deals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("dashboard.kpi.wonLeads")}</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{(wonValue).toLocaleString('fr-FR')} MAD</h3>
            </div>
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <BadgeCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("dashboard.kpi.contracts")}</span>
            <span className="font-bold text-slate-900">{wonLeads.length}</span>
          </div>
        </div>

        {/* Widget 5: Lost Deals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("dashboard.kpi.lostClosed")}</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{lostLeads.length}</h3>
            </div>
            <span className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertOctagon className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("dashboard.kpi.dominantReason")}</span>
            <span className="font-bold text-slate-700">{t("dashboard.kpi.tarif")}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
{/* Chart 1: Value by Stage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-800">{t("dashboard.chart1.title")}</h4>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} MAD`, t("dashboard.chart1.value")]}
                />
                <Bar dataKey="valeur" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Source Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="h-4.5 w-4.5 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-800">{t("dashboard.chart2.title")}</h4>
          </div>
          <div className="h-72 flex flex-col md:flex-row items-center justify-between">
            <div className="h-full w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                    formatter={(val: any, _name: any, props: any) => [
                      `${val} (${props.payload.valeurTotale.toLocaleString('fr-FR')} MAD)`,
                      t("dashboard.chart2.volume")
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full md:w-1/2 space-y-2 text-xs">
              {sourceData.map((d, index) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-slate-600 font-medium">{d.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{d.value}</span>
                    <span className="text-slate-400 text-[10px] block">{d.valeurTotale.toLocaleString('fr-FR')} MAD</span>
                  </div>
                </div>
              ))}
              {sourceData.length === 0 && (
                <div className="text-slate-400 text-center py-4 text-xs">{t("dashboard.leads.empty")}</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Interactive Goal Simulator & Recent CRM Activities (NEW SECTION requested by user) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Simulateur d'Objectifs Annuels Interactif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
<div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 animate-pulse" />
                <h4 className="font-bold text-sm text-slate-800">{t("dashboard.goal.title")}</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded">{t("dashboard.goal.badge")}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {t("dashboard.goal.subtitle")}
            </p>

            {/* Slider control */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-700 font-bold">
                <span>{t("dashboard.goal.target")}</span>
                <span className="text-base text-blue-600 font-extrabold">{salesGoal.toLocaleString('fr-FR')} MAD</span>
              </div>
              <input
                type="range"
                min="20000"
                max="500000"
                step="10000"
                value={salesGoal}
                onChange={(e) => setSalesGoal(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>20k MAD</span>
                <span>250k MAD</span>
                <span>500k MAD</span>
              </div>
            </div>

{/* Progress Metrics bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t("dashboard.goal.progress")} <strong className="text-slate-800">{wonValue.toLocaleString('fr-FR')} MAD</strong> {t("dashboard.goal.secured")}</span>
                <span className="font-extrabold text-blue-600">{progressPercent} %</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ${progressPercent >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Forecast response */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
            {progressPercent >= 100 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 flex items-start gap-2">
                <span className="text-base">{t("dashboard.goal.reached.emoji")}</span>
                <div>
                  <span className="font-bold block">{t("dashboard.goal.reached.title")}</span>
                  <span className="text-[11px] text-emerald-700">{t("dashboard.goal.reached.subtitle")}</span>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 flex items-start gap-2">
                <span className="text-base">{t("dashboard.goal.forecast.emoji")}</span>
                <div>
                  <span className="font-bold block">{t("dashboard.goal.forecast.title")}</span>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    {t("dashboard.goal.leftToSign")} <strong className="font-extrabold">{remainingToGoal.toLocaleString('fr-FR')} MAD</strong> {t("dashboard.goal.toSign")}
                    {t("dashboard.goal.convertText")} <strong className="font-extrabold text-blue-900">{neededDeals}</strong> {t("dashboard.goal.leadsOfPipeline")} {avgOpportunityValue.toLocaleString('fr-FR')} MAD).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dernières Activités Récentes du CRM */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between" id="recent-crm-activities-container">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-800">{t("dashboard.activity.title")}</h4>
              </div>
              
              {/* Modern View Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setActivityViewType("timeline")}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    activityViewType === "timeline"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title={t("dashboard.activity.timeline")}
                >
                  {t("dashboard.activity.timeline")}
                </button>
                <button
                  type="button"
                  onClick={() => setActivityViewType("cards")}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    activityViewType === "cards"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title={t("dashboard.activity.cards")}
                >
                  {t("dashboard.activity.cards")}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              {t("dashboard.activity.subtitle")}
            </p>

            {activityViewType === "timeline" ? (
              /* --- Redesigned TIMELINE View --- */
              <div className="relative pl-3 border-l-2 border-slate-150 space-y-4 max-h-72 overflow-y-auto pr-1 py-1">
                {activities.slice(0, 4).map((act) => {
                  const actLead = leads.find(l => l.id === act.leadId);
                  
                  // Pick icon & colors
                  let IconComponent = MessageSquare;
                  let colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
                  if (act.type === "Appel") {
                    IconComponent = Phone;
                    colorClasses = "bg-blue-50 text-blue-600 border-blue-200";
                  } else if (act.type === "Email") {
                    IconComponent = Mail;
                    colorClasses = "bg-indigo-50 text-indigo-600 border-indigo-200";
                  } else if (act.type === "Rendez-vous") {
                    IconComponent = Calendar;
                    colorClasses = "bg-amber-50 text-amber-600 border-amber-200";
                  }

                  return (
                    <div 
                      key={act.id}
                      onClick={() => actLead && onSelectLead(actLead.id)}
                      className="relative pl-5 group cursor-pointer"
                    >
                      {/* Timeline Dot with Icon */}
                      <div className={`absolute -left-[21px] top-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${colorClasses} group-hover:scale-110 shadow-sm`}>
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>

                      {/* Content */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {act.auteur}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(act.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {act.description}
                        </p>
                        {actLead && (
                          <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 pt-0.5">
                            <span className="text-blue-600 hover:underline">{actLead.societe}</span>
                            <span>•</span>
                            <span className="text-slate-500 font-medium">{act.type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <div className="text-slate-400 text-center py-8 text-xs">{t("dashboard.activity.empty")}</div>
                )}
              </div>
) : (
              /* --- Redesigned CARDS View --- */
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activities.slice(0, 4).map((act) => {
                  const actLead = leads.find(l => l.id === act.leadId);
                  return (
                    <div 
                      key={act.id} 
                      onClick={() => actLead && onSelectLead(actLead.id)}
                      className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150 cursor-pointer text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{act.auteur}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                          act.type === "Appel" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          act.type === "Email" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                          act.type === "Rendez-vous" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {act.type}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-snug">{act.description}</p>
                      {actLead && (
                        <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-100/50">
                          <span className="font-bold text-slate-500 truncate max-w-[120px]">{actLead.societe}</span>
                          <span>{new Date(act.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <div className="text-slate-400 text-center py-8 text-xs">{t("dashboard.activity.emptyCards")}</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-blue-600 font-bold inline-flex items-center gap-0.5 hover:underline">
              {t("dashboard.activity.history")} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

      </div>

      {/* 5. Grid: Commercial Leaderboard & High Potential Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Commercial Leaderboard - 3 Columns */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-3">
<h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="h-4.5 w-4.5 text-blue-600" />
            {t("dashboard.leaderboard.title")}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">{t("dashboard.leaderboard.colSales")}</th>
                  <th className="pb-2.5 text-center">{t("dashboard.leaderboard.colWon")}</th>
                  <th className="pb-2.5 text-right">{t("dashboard.leaderboard.colRevenue")}</th>
                  <th className="pb-2.5 text-center">{t("dashboard.leaderboard.colActive")}</th>
                  <th className="pb-2.5 text-right">{t("dashboard.leaderboard.colActiveVal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leaderboard.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                        <UserRound className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">{comm.nom}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">{comm.role}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">
                        {comm.wonCount}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      {comm.wonAmount.toLocaleString('fr-FR')} MAD
                    </td>
                    <td className="py-3 text-center text-slate-600 font-semibold">
                      {comm.activeCount}
                    </td>
                    <td className="py-3 text-right text-slate-500 font-medium">
                      {comm.activeAmount.toLocaleString('fr-FR')} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Potential Opportunities - 2 Columns */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            {t("dashboard.priority.title")}
          </h4>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
            {highPotentialLeads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className="p-3 bg-slate-50/50 rounded-lg border border-slate-150 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{lead.societe}</span>
                    <span className="text-[10px] text-slate-500 font-medium">({lead.prenom} {lead.nom})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" /> {lead.ville}
                    </span>
                    <span className="text-blue-600 font-bold">{lead.valeurEstimee.toLocaleString('fr-FR')} MAD</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-xs ${
                    lead.score >= 80 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                      : lead.score >= 60 
                      ? "bg-amber-50 text-amber-600 border border-amber-200" 
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`} title={t("dashboard.priority.aiScore")}>
                    {lead.score}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">{t("dashboard.priority.aiScore")}</span>
                </div>
              </div>
            ))}
            {highPotentialLeads.length === 0 && (
              <div className="text-slate-400 text-center py-8 text-xs">{t("dashboard.priority.empty")}</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

