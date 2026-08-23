/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Flame, 
  BarChart3, 
  PieChart as PieIcon,
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  User,
  ArrowRight,
  Info,
  Sliders,
  Printer
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from "recharts";
import { Lead, LeadStatus, LeadSource, User as UserType } from "../types";
import { usePreferences } from "../AppPreferences";

interface AnalyticsPerformanceProps {
  leads: Lead[];
  users: UserType[];
}

export default function AnalyticsPerformance({ leads, users }: AnalyticsPerformanceProps) {
  const { t } = usePreferences();
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [aiScoreThreshold, setAiScoreThreshold] = useState<number>(50);

  // --- 1. Basic computations ---
  const activeStages = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.PROPOSAL,
    LeadStatus.NEGOTIATION
  ];

  const filteredLeads = leads.filter(l => {
    const matchesSource = selectedSource === "all" || l.source === selectedSource;
    return matchesSource;
  });

  const activeLeads = filteredLeads.filter(l => activeStages.includes(l.statut));
  const wonLeads = filteredLeads.filter(l => l.statut === LeadStatus.WON);
  
  // KPI 1: Average AI Score
  const avgAiScore = filteredLeads.length > 0
    ? Math.round(filteredLeads.reduce((acc, curr) => acc + curr.score, 0) / filteredLeads.length)
    : 0;

  // KPI 2: Average Ticket Size
  const avgOpportunityValue = activeLeads.length > 0
    ? Math.round(activeLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0) / activeLeads.length)
    : 0;

  // KPI 3: Engagement Rate (% of leads with score > threshold)
  const highScoreLeads = filteredLeads.filter(l => l.score >= aiScoreThreshold);
  const engagementRate = filteredLeads.length > 0
    ? Math.round((highScoreLeads.length / filteredLeads.length) * 100)
    : 0;

  // KPI 4: Probabilistic Pipeline Value (Sum of Opportunity Value * AI Score%)
  const probabilisticPipelineValue = activeLeads.reduce((acc, curr) => {
    return acc + Math.round(curr.valeurEstimee * (curr.score / 100));
  }, 0);

  // --- 2. Chart: AI Score Ranges Distribution ---
  const range0_25 = filteredLeads.filter(l => l.score <= 25).length;
  const range26_50 = filteredLeads.filter(l => l.score > 25 && l.score <= 50).length;
  const range51_75 = filteredLeads.filter(l => l.score > 50 && l.score <= 75).length;
  const range76_100 = filteredLeads.filter(l => l.score > 75).length;

  const scoreDistributionData = [
    { range: "0 - 25 (Froid)", count: range0_25, color: "#ef4444" },
    { range: "26 - 50 (Moyen)", count: range26_50, color: "#f59e0b" },
    { range: "51 - 75 (Chaud)", count: range51_75, color: "#3b82f6" },
    { range: "76 - 100 (Très Chaud)", count: range76_100, color: "#10b981" }
  ];

  // --- 3. Chart: Projected Closing Trends (using estimated values vs. AI probability weight) ---
  const sourcePerformanceData = Object.values(LeadSource).map(source => {
    const sourceLeads = leads.filter(l => l.source === source);
    const wonCount = sourceLeads.filter(l => l.statut === LeadStatus.WON).length;
    const lostCount = sourceLeads.filter(l => l.statut === LeadStatus.LOST || l.statut === LeadStatus.CLOSED).length;
    const resolved = wonCount + lostCount;
    const rate = resolved > 0 ? Math.round((wonCount / resolved) * 100) : 0;
    
    // Simulate estimated acquisition cost vs. won revenue
    // Standard mock costs per acquisition source
    const mockCosts: Record<string, number> = {
      "Site Web": 2500,
      "Réseaux Sociaux": 4000,
      "Recommandation": 500,
      "Salon Professionnel": 12000,
      "Prospection Téléphonique": 3500,
      "Autre": 1000
    };
    const cost = mockCosts[source] || 1500;
    const revenue = sourceLeads.filter(l => l.statut === LeadStatus.WON).reduce((acc, curr) => acc + curr.valeurEstimee, 0);
    const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;

    return {
      name: source,
      conversionRate: rate,
      revenue: revenue,
      cost: cost,
      roi: roi
    };
  }).filter(d => d.revenue > 0 || d.cost > 0);

  // --- 4. Interactive Simulation Calculations ---
  const estimatedSignValue = activeLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);

  const handleExportPDF = () => {
    // Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    iframe.style.top = "-9999px";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Computed figures
    const totalLeadsCount = filteredLeads.length;
    const totalWonRevenue = wonLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0);

    // Build lead source split rows
    const sourceRows = sourcePerformanceData.map((data, index) => {
      const pipeVal = leads
        .filter(l => l.source === data.name && activeStages.includes(l.statut))
        .reduce((acc, curr) => acc + curr.valeurEstimee, 0);
      
      const convRateColor = data.conversionRate >= 40 ? "#10b981" : data.conversionRate >= 20 ? "#3b82f6" : "#f59e0b";
      const roiColor = data.roi >= 300 ? "#10b981" : data.roi >= 0 ? "#3b82f6" : "#ef4444";
      
      return `
        <tr style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0;">${data.name}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;border-bottom:1px solid #e2e8f0;">
            <span style="background:${convRateColor}15;color:${convRateColor};padding:3px 8px;border-radius:12px;font-weight:700;font-size:10px;">
              ${data.conversionRate}%
            </span>
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;text-align:right;border-bottom:1px solid #e2e8f0;">${pipeVal.toLocaleString('fr-FR')} MAD</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">${data.revenue.toLocaleString('fr-FR')} MAD</td>
          <td style="padding:10px 12px;font-size:12px;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">${data.cost.toLocaleString('fr-FR')} MAD</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:800;color:${roiColor};text-align:right;border-bottom:1px solid #e2e8f0;">
            ${data.roi > 0 ? '+' : ''}${data.roi}%
          </td>
        </tr>
      `;
    }).join("");

    // Build grouped leads by acquisition source
    const groupedLeadsHtml = Object.values(LeadSource).map(source => {
      const sourceLeads = filteredLeads.filter(l => l.source === source);
      if (sourceLeads.length === 0) return "";

      const sortedSourceLeads = [...sourceLeads].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
      
      const rows = sortedSourceLeads.map((l, index) => {
        const acqDate = new Date(l.dateCreation).toLocaleDateString("fr-FR", {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const scoreColor = l.score >= 70 ? "#10b981" : l.score >= 40 ? "#3b82f6" : "#f59e0b";
        return `
          <tr style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
            <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#1e293b;border-bottom:1px solid #e2e8f0;width:35%;">
              <div>${l.nomProjet || 'Prospect'}</div>
              <div style="font-size:9px;color:#64748b;font-weight:400;margin-top:2px;">${l.societe || 'Indépendant'} • ${l.prenom} ${l.nom}</div>
            </td>
            <td style="padding:8px 12px;font-size:11px;color:#475569;border-bottom:1px solid #e2e8f0;">${acqDate}</td>
            <td style="padding:8px 12px;font-size:11px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <span style="color:${scoreColor};font-weight:800;">${l.score}</span>
            </td>
            <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#1e293b;text-align:right;border-bottom:1px solid #e2e8f0;">
              ${l.valeurEstimee.toLocaleString("fr-FR")} MAD
            </td>
            <td style="padding:8px 12px;font-size:10px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:700;">${l.statut}</span>
            </td>
          </tr>
        `;
      }).join("");

      return `
        <div style="margin-top: 15px; margin-bottom: 20px; page-break-inside: avoid;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block; border-left: 2px solid #2563eb;">
            ${source} — ${sourceLeads.length} prospect(s)
          </div>
          <table class="table-source" style="margin-bottom:0;">
            <thead>
              <tr>
                <th style="text-align:left;border-top-left-radius:6px;border-bottom-left-radius:6px;width:35%;">Prospect / Projet</th>
                <th style="text-align:left;">Date d'Acquisition</th>
                <th style="text-align:center;">Score IA</th>
                <th style="text-align:right;">Valeur Estimée</th>
                <th style="text-align:center;border-top-right-radius:6px;border-bottom-right-radius:6px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join("");

    const reportDate = new Date().toLocaleDateString("fr-FR", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <title>Rapport de Performance Acquisition Marketing</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"/>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #1e293b;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            width: 21cm;
            padding: 1.5cm;
            margin: 0 auto;
            background: #fff;
          }
          .container {
            width: 100%;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo {
            width: 32px;
            height: 32px;
            background: #2563eb;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 800;
            font-size: 14px;
          }
          .logo-text {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }
          .logo-sub {
            font-size: 8px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .report-meta {
            text-align: right;
          }
          .report-title {
            font-size: 14px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .report-date {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
            margin-top: 20px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .grid-kpis {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .kpi-label {
            font-size: 8px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .kpi-value {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 4px;
          }
          .table-source {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .table-source th {
            background: #1e293b;
            color: #fff;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            padding: 10px 12px;
          }
          .table-source td {
            border-bottom: 1px solid #e2e8f0;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            color: #94a3b8;
            margin-top: 40px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">LF</div>
                <div>
                  <div class="logo-text">LeadFlow CRM</div>
                  <div class="logo-sub">Marketing Intelligence</div>
                </div>
              </div>
              <div class="report-meta">
                <div class="report-title">Audit Acquisition & Performance</div>
                <div class="report-date">Généré le ${reportDate}</div>
              </div>
            </div>

            <!-- KPIs -->
            <div class="grid-kpis">
              <div class="kpi-card">
                <div class="kpi-label">Total Prospects</div>
                <div class="kpi-value">${totalLeadsCount}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Score d'Intérêt Moyen</div>
                <div class="kpi-value">${avgAiScore} / 100</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Pipe Commercial Actif</div>
                <div class="kpi-value" style="font-size: 13px;">${estimatedSignValue.toLocaleString('fr-FR')} MAD</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Conversion Est. (35%)</div>
                <div class="kpi-value" style="font-size: 13px; color: #10b981;">${(Math.round(estimatedSignValue * 0.35)).toLocaleString('fr-FR')} MAD</div>
              </div>
            </div>

            <!-- Table: Split by Source -->
            <div class="section-title">Analyse par Canal d'Acquisition (Source)</div>
            <table class="table-source">
              <thead>
                <tr>
                  <th style="text-align:left;border-top-left-radius:6px;border-bottom-left-radius:6px;">Canal / Source</th>
                  <th style="text-align:center;">Taux Conv.</th>
                  <th style="text-align:right;">Pipe Estimé</th>
                  <th style="text-align:right;">Revenus Gagnés</th>
                  <th style="text-align:right;">Budget Engagé</th>
                  <th style="text-align:right;border-top-right-radius:6px;border-bottom-right-radius:6px;">ROI Canal</th>
                </tr>
              </thead>
              <tbody>
                ${sourceRows}
              </tbody>
            </table>

            <!-- Section: Leads split by Acquisition Means -->
            <div class="section-title">Liste des Prospects Classés par Canal d'Acquisition</div>
            ${groupedLeadsHtml || '<p style="font-style:italic;color:#64748b;font-size:11px;">Aucun prospect disponible.</p>'}
          </div>

          <!-- Footer -->
          <div class="footer">
            <span>Document confidentiel destiné à l'usage interne de l'équipe Marketing. LeadFlow Intelligence Engine &copy; 2026.</span>
            <span>Page 1 sur 1</span>
          </div>
        </div>
      </body>
      </html>
    `;

    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }, 500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-screen bg-slate-50 dark:bg-slate-950" id="analytics-performance-root">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Filters and Export */}
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer border-0"
          >
            <Printer className="h-4 w-4" />
            Exporter le Rapport PDF
          </button>
          
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-blue-600" /> {t("analytics.segmentBy")}
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-250 font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t("analytics.allChannels")}</option>
              {Object.values(LeadSource).map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1: AI Score Moyen */}
<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("analytics.kpi1")}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{avgAiScore} / 100</h3>
            </div>
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Flame className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("analytics.kpi1Quality")}</span>
            <span className={`font-bold ${avgAiScore > 60 ? "text-emerald-600" : avgAiScore > 40 ? "text-amber-500" : "text-rose-600"}`}>
              {avgAiScore > 60 ? t("analytics.kpi1Excellent") : avgAiScore > 40 ? t("analytics.kpi1Average") : t("analytics.kpi1Low")}
            </span>
          </div>
        </div>

        {/* KPI 2: Panier Moyen */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("analytics.kpi2")}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{avgOpportunityValue.toLocaleString('fr-FR')} MAD</h3>
            </div>
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("analytics.kpi2Active")}</span>
            <span className="font-bold text-slate-900">{activeLeads.length} {t("analytics.kpi2Deals")}</span>
          </div>
        </div>

        {/* KPI 3: Engagement / Taux de Maturité */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("analytics.kpi3")}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{engagementRate} %</h3>
            </div>
            <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
            <div className="flex justify-between items-center">
              <span>{t("analytics.kpi3Threshold")}</span>
              <span className="font-bold text-slate-800">{aiScoreThreshold} %</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={aiScoreThreshold}
              onChange={(e) => setAiScoreThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-100 rounded-lg"
            />
          </div>
        </div>

        {/* KPI 4: Probabilistic Pipe */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{t("analytics.kpi4")}</p>
              <h3 className="text-2xl font-black text-blue-600 mt-1">{probabilisticPipelineValue.toLocaleString('fr-FR')} MAD</h3>
            </div>
            <span className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("analytics.kpi4Nominal")}</span>
            <span className="font-bold text-slate-700">{(activeLeads.reduce((acc, curr) => acc + curr.valeurEstimee, 0)).toLocaleString('fr-FR')} MAD</span>
          </div>
        </div>

      </div>

      {/* Main Charts & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: AI Score Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
<div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
              <h4 className="font-bold text-sm text-slate-800">{t("analytics.chart1.title")}</h4>
            </div>
            <span className="text-[10px] text-slate-400">{t("analytics.chart1.total")} {filteredLeads.length} {t("analytics.chart1.leads")}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistributionData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value: any) => [`${value} lead(s)`, "Volume"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
{t("analytics.chart1.note")}
          </p>
        </div>

        {/* Interactive Prediction Sandbox */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-600" />
<h4 className="font-bold text-sm text-slate-800">{t("analytics.simulator.title")}</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {t("analytics.simulator.subtitle")}
            </p>

            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {/* Slider 1: Target conversion rates */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
<span className="text-slate-700 font-bold">{t("analytics.simulator.conversion")}</span>
                  <span className="text-blue-600 font-extrabold">35 %</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[35%]"></div>
                </div>
              </div>

              {/* Summary outputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-150">
<span className="text-slate-400 text-[10px] block uppercase font-bold">{t("analytics.simulator.activePipe")}</span>
                  <span className="text-base font-black text-slate-900 mt-0.5">{estimatedSignValue.toLocaleString('fr-FR')} MAD</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-150">
<span className="text-slate-400 text-[10px] block uppercase font-bold">{t("analytics.simulator.estConversion")}</span>
                  <span className="text-base font-black text-emerald-600 mt-0.5">{(Math.round(estimatedSignValue * 0.35)).toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 mt-4 flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
<span className="font-bold block">{t("analytics.simulator.recTitle")}</span>
              <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
{t("analytics.simulator.recText1")} <strong className="font-bold text-blue-900">{filteredLeads.filter(l => l.score >= 70 && l.statut !== LeadStatus.WON).length}</strong> {t("analytics.simulator.recText2")}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Marketing Channels & Cost-Benefit Analysis Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4.5 w-4.5 text-emerald-600" />
<h4 className="font-bold text-sm text-slate-800">{t("analytics.chart2.title")}</h4>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{t("analytics.chart2.badge")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
<th className="pb-3">{t("analytics.chart2.colChannel")}</th>
                <th className="pb-3 text-center">{t("analytics.chart2.colRate")}</th>
                <th className="pb-3 text-right">{t("analytics.chart2.colBudget")}</th>
                <th className="pb-3 text-right">{t("analytics.chart2.colRevenue")}</th>
                <th className="pb-3 text-right">{t("analytics.chart2.colAdBudget")}</th>
                <th className="pb-3 text-right">{t("analytics.chart2.colRoi")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sourcePerformanceData.map((data) => {
                const pipeVal = leads
                  .filter(l => l.source === data.name && activeStages.includes(l.statut))
                  .reduce((acc, curr) => acc + curr.valeurEstimee, 0);

                return (
                  <tr key={data.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{data.name}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        data.conversionRate >= 40 ? "bg-emerald-50 text-emerald-700" :
                        data.conversionRate >= 20 ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {data.conversionRate} %
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-600">{pipeVal.toLocaleString('fr-FR')} MAD</td>
                    <td className="py-3 text-right font-bold text-slate-900">{data.revenue.toLocaleString('fr-FR')} MAD</td>
                    <td className="py-3 text-right font-medium text-slate-500">{data.cost.toLocaleString('fr-FR')} MAD</td>
                    <td className={`py-3 text-right font-black ${data.roi >= 300 ? "text-emerald-600" : data.roi >= 0 ? "text-blue-600" : "text-rose-500"}`}>
                      {data.roi > 0 ? `+${data.roi}%` : `${data.roi}%`}
                    </td>
                  </tr>
                );
              })}
              {sourcePerformanceData.length === 0 && (
                <tr>
<td colSpan={6} className="text-center text-slate-400 py-6">{t("analytics.chart2.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
