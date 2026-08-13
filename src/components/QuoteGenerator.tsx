/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Trash, 
  Receipt, 
  Printer, 
  ChevronRight, 
  ChevronLeft,
  User, 
  Sparkles, 
  Search,
  Building,
  Plus,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSignature
} from "lucide-react";
import { Lead, Quote, User as UserType } from "../types";

interface QuoteGeneratorProps {
  quotes: Quote[];
  leads: Lead[];
  activeLeadId?: string | null;
  onCreateQuote: (quote: Omit<Quote, "id" | "reference">) => void;
  onUpdateQuoteStatus: (id: string, statut: Quote["statut"]) => void;
  activeUser: UserType;
}

export default function QuoteGenerator({
  quotes,
  leads,
  activeLeadId,
  onCreateQuote,
  onUpdateQuoteStatus,
  activeUser
}: QuoteGeneratorProps) {
  // Navigation states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // Search and filter states for landing lists
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [quoteSearchTerm, setQuoteSearchTerm] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>("all");

  // New quote line items state
  const [articles, setArticles] = useState<Array<{ description: string; quantite: number; prixUnitaire: number }>>([
    { description: "Abonnement Annuel Tracking Lead System (Entreprise)", quantite: 1, prixUnitaire: 12000 },
    { description: "Prestation d'installation et de formation des équipes", quantite: 1, prixUnitaire: 3500 }
  ]);
  
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(500);
  const [customValidityDays, setCustomValidityDays] = useState(30);

  // Sync activeLeadId from props (e.g. redirected from lead details page)
  useEffect(() => {
    if (activeLeadId) {
      const leadMatch = leads.find(l => l.id === activeLeadId);
      if (leadMatch) {
        setSelectedLead(leadMatch);
        setSelectedQuote(null);
      }
    }
  }, [activeLeadId, leads]);

  const handlePrint = () => {
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

    // Gather data for the invoice
    const lead = selectedLead || (selectedQuote ? leads.find(l => l.id === selectedQuote.leadId) : null);
    const lineItems = selectedQuote ? selectedQuote.articles : articles;
    const total = selectedQuote ? selectedQuote.montant : draftTotal;
    const ref = selectedQuote ? selectedQuote.reference : "DRAFT-PROPOSAL";
    const dateEmission = new Date(selectedQuote ? selectedQuote.dateEmission : Date.now()).toLocaleDateString("fr-FR");
    const dateValidite = new Date(selectedQuote ? selectedQuote.dateValidite : (Date.now() + customValidityDays * 24 * 60 * 60 * 1000)).toLocaleDateString("fr-FR");

    const rowsHtml = lineItems.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:12px 8px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${item.description}</td>
        <td style="padding:12px 8px;font-size:13px;color:#475569;text-align:center;border-bottom:1px solid #e2e8f0;">${item.quantite}</td>
        <td style="padding:12px 8px;font-size:13px;color:#475569;text-align:right;border-bottom:1px solid #e2e8f0;">${item.prixUnitaire.toLocaleString("fr-FR")} MAD</td>
        <td style="padding:12px 8px;font-size:13px;font-weight:700;color:#1e293b;text-align:right;border-bottom:1px solid #e2e8f0;">${(item.quantite * item.prixUnitaire).toLocaleString("fr-FR")} MAD</td>
      </tr>
    `).join("");

    const clientHtml = lead ? `
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">${lead.nomProjet || lead.societe}</p>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155;">${lead.societe}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;">À l'attention de : ${lead.prenom} ${lead.nom}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;">${lead.adresse || 'Casablanca'}, ${lead.ville || 'Maroc'}</p>
      <p style="margin:0;font-size:12px;color:#64748b;">${lead.email}</p>
    ` : `<p style="color:#94a3b8;font-style:italic;">Aucun client lié.</p>`;

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <title>Devis ${ref}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"/>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            line-height: 1.6;
            color: #1e293b;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 1.8cm;
            margin: 0 auto;
            background: #fff;
          }
          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
          .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
          .brand-icon { width: 36px; height: 36px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 14px; flex-shrink: 0; }
          .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; }
          .brand-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #94a3b8; }
          .company-address { font-size: 12px; color: #64748b; line-height: 1.7; }
          .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; }
          .ref { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .date-meta { font-size: 12px; color: #94a3b8; line-height: 1.7; }
          /* Address cards */
          .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }
          .addr-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
          .addr-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; }
          /* Table */
          .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { border-bottom: 2px solid #e2e8f0; }
          thead th { padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
          thead th:first-child { text-align: left; }
          thead th:not(:first-child) { text-align: right; }
          thead th:nth-child(2) { text-align: center; }
          /* Footer */
          .footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
          .footer-inner { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; }
          .legal { font-size: 10px; color: #94a3b8; line-height: 1.7; max-width: 50%; }
          .totals { min-width: 240px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; }
          .total-grand { display: flex; justify-content: space-between; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #2563eb; }
          .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
          .sig-box { height: 80px; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; }
          .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
          .sig-hint { font-size: 11px; font-style: italic; color: #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="page">

          <!-- Header -->
          <div class="header">
            <div>
              <div class="brand-row">
                <div class="brand-icon">LP</div>
                <div>
                  <div class="brand-name">LeedPro S.A.R.L.</div>
                  <div class="brand-sub">Solutions CRM &amp; Sales</div>
                </div>
              </div>
              <div class="company-address">
                Technopark, Bd Dammam, Entrée A<br/>
                Casablanca, 20150, Maroc<br/>
                RC : 542019 &bull; IF : 1245089<br/>
                contact@leedpro.ma &bull; www.leedpro.ma
              </div>
            </div>
            <div style="text-align:right;">
              <div class="badge">DEVIS COMMERCIAL</div>
              <div class="ref">Réf : ${ref}</div>
              <div class="date-meta">
                Émis le : ${dateEmission}<br/>
                Valide jusqu'au : ${dateValidite}
              </div>
            </div>
          </div>

          <!-- Address Cards -->
          <div class="addresses">
            <div class="addr-card">
              <div class="addr-label">Chargé d'affaires (Émetteur)</div>
              <p style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">${activeUser.nom}</p>
              <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Conseiller Technique &amp; Intégrations</p>
              <p style="font-size:12px;color:#64748b;margin-bottom:4px;">${activeUser.email}</p>
              ${activeUser.telephone ? `<p style="font-size:12px;color:#64748b;">${activeUser.telephone}</p>` : ''}
            </div>
            <div class="addr-card">
              <div class="addr-label">Client Bénéficiaire</div>
              ${clientHtml}
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="section-label">Désignation des prestations</div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Libellé du produit / service</th>
                <th style="text-align:center;width:60px;">Qté</th>
                <th style="text-align:right;width:120px;">Prix Unit. HT</th>
                <th style="text-align:right;width:120px;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Footer: Totals + Legal + Signatures -->
          <div class="footer">
            <div class="footer-inner">
              <div class="legal">
                <strong>Notes légales &amp; Règlements :</strong> Devis valable pour une durée de ${customValidityDays} jours à compter de sa date d'émission. Règlement par virement bancaire : BMCE Bank – RIB 011780001452900030018449. T.V.A non applicable – Exonération d'impôt (art. 293 B du CGI).
              </div>
              <div class="totals">
                <div class="total-row"><span>Total Brut HT :</span><span>${total.toLocaleString("fr-FR")} MAD</span></div>
                <div class="total-row"><span>TVA (0%) :</span><span>0,00 MAD</span></div>
                <div class="total-grand"><span>MONTANT NET À PAYER :</span><span>${total.toLocaleString("fr-FR")} MAD</span></div>
              </div>
            </div>

            <div class="sigs">
              <div class="sig-box">
                <div class="sig-label">Signature Client (Bon pour accord)</div>
                <div class="sig-hint">Date, signature et cachet commercial</div>
              </div>
              <div class="sig-box" style="text-align:right;">
                <div class="sig-label">Pour LeedPro S.A.R.L.</div>
                <div class="sig-hint">Date et signature</div>
              </div>
            </div>
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
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 500);
  };


  // Filters
  const filteredLeads = leads.filter(l => {
    const term = leadSearchTerm.toLowerCase();
    const leadQuotes = quotes.filter(q => q.leadId === l.id);
    const hasMatchingQuote = leadQuotes.some(q => q.reference.toLowerCase().includes(term));
    return (
      (l.nomProjet && l.nomProjet.toLowerCase().includes(term)) ||
      l.societe.toLowerCase().includes(term) ||
      l.prenom.toLowerCase().includes(term) ||
      l.nom.toLowerCase().includes(term) ||
      hasMatchingQuote
    );
  });


  // Calculate totals
  const draftTotal = articles.reduce((acc, curr) => acc + (curr.quantite * curr.prixUnitaire), 0);

  // Add line item
  const handleAddLineItem = () => {
    if (!newDesc.trim()) return;
    setArticles([...articles, {
      description: newDesc.trim(),
      quantite: Number(newQty) || 1,
      prixUnitaire: Number(newPrice) || 0
    }]);
    setNewDesc("");
    setNewQty(1);
    setNewPrice(500);
  };


  // Delete line item
  const handleDeleteLineItem = (index: number) => {
    setArticles(articles.filter((_, idx) => idx !== index));
  };

  // Submit quote
  const handleCreateQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (articles.length === 0) {
      alert("Le devis doit contenir au moins un article.");
      return;
    }

    onCreateQuote({
      leadId: selectedLead.id,
      dateEmission: new Date().toISOString().split("T")[0],
      dateValidite: new Date(Date.now() + customValidityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      montant: draftTotal,
      statut: "Brouillon",
      articles
    });

    // Reset draft
    setArticles([
      { description: "Abonnement Annuel Tracking Lead System (Entreprise)", quantite: 1, prixUnitaire: 12000 },
      { description: "Prestation d'installation et de formation des équipes", quantite: 1, prixUnitaire: 3550 }
    ]);
    setSelectedLead(null);
    alert("Le devis commercial a été créé avec succès en mode Brouillon !");
  };

  // Check which lead relates to selected quote
  const quoteLead = selectedQuote ? leads.find(l => l.id === selectedQuote.leadId) : null;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen text-slate-800 dark:text-slate-100 overflow-hidden" id="quote-workstation-root">
      
      {/* Printable Style Injection */}
      <style>{`
        #invoice-print-area {
          background-color: white !important;
          color: #1e293b !important;
          border-color: #e2e8f0 !important;
          line-height: 1.5 !important;
        }
        #invoice-print-area p {
          margin: 0 0 0.35rem 0 !important;
        }
        #invoice-print-area p:last-child {
          margin-bottom: 0 !important;
        }
        #invoice-print-area tr td {
          padding-top: 0.75rem !important;
          padding-bottom: 0.75rem !important;
        }
        #invoice-print-area [class*="bg-slate-50"] {
          background-color: rgba(248, 250, 252, 0.9) !important;
        }
        #invoice-print-area [class*="border-slate-200"] {
          border-color: rgba(226, 232, 240, 0.8) !important;
        }
        #invoice-print-area .text-slate-400 {
          color: #94a3b8 !important;
        }
        #invoice-print-area .text-slate-500 {
          color: #64748b !important;
        }
        #invoice-print-area .text-slate-700 {
          color: #334155 !important;
        }
        #invoice-print-area .text-slate-800 {
          color: #1e293b !important;
        }
        #invoice-print-area .text-slate-900 {
          color: #0f172a !important;
        }
        #invoice-print-area .text-blue-600 {
          color: #2563eb !important;
        }
        #invoice-print-area .bg-blue-50 {
          background-color: #eff6ff !important;
        }
        #invoice-print-area .border-blue-100 {
          border-color: #dbeafe !important;
        }
        #invoice-print-area .divide-slate-100 tr {
          border-color: #f1f5f9 !important;
        }

        @media print {
          /* Hide all UI shell chrome components */
          nav, aside, header, .no-print, .w-80, .w-\[38\%\] {
            display: none !important;
          }
          
          /* Remove all layout boundary, height, scroll and overflow limits */
          html, body, #root, #root > *, main, div, section {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Force exact print visibility for the invoice sheet container */
          #invoice-print-area {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            margin: 0 auto !important;
            width: 21cm !important;
            min-height: 29.7cm !important;
            padding: 1.8cm !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }

          #invoice-print-area * {
            visibility: visible !important;
          }
        }
      `}</style>

      {/* LANDING SCREEN: No selection */}
      {!selectedLead && !selectedQuote ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Receipt className="h-4.5 w-4.5 text-blue-600" />
              Gestion des Devis Commerciaux
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Consultez ci-dessous la liste de vos prospects et opportunités. Vous pouvez visualiser l'historique des devis associés ou en générer un nouveau.
            </p>

            {/* Search input */}
            <div className="relative max-w-md pt-2">
              <Search className="absolute left-3 top-4.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par projet, société, contact ou référence de devis..."
                value={leadSearchTerm}
                onChange={(e) => setLeadSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((l) => {
              const leadQuotes = quotes.filter(q => q.leadId === l.id);
              return (
                <div
                  key={l.id}
                  className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[180px]" title={l.nomProjet || `Opportunité - ${l.prenom} ${l.nom}`}>
                        {l.nomProjet || `Opportunité - ${l.prenom} ${l.nom}`}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 flex-shrink-0">
                        {l.priorite}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <p className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {l.societe || "Indépendant"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {l.prenom} {l.nom}
                      </p>
                    </div>

                    {/* Associated Quotes List */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                        Devis Associés ({leadQuotes.length})
                      </span>
                      {leadQuotes.length === 0 ? (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic py-1">
                          Aucun devis créé pour ce prospect.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {leadQuotes.map((q) => (
                            <div
                              key={q.id}
                              onClick={() => {
                                setSelectedQuote(q);
                                setSelectedLead(null);
                              }}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer dark:bg-slate-800/50 dark:border-slate-800 dark:hover:border-blue-900"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-[10px] text-slate-700 dark:text-slate-200 truncate flex items-center gap-1">
                                  <Receipt className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                  {q.reference}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  {new Date(q.dateEmission).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 flex items-center gap-2">
                                <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">
                                  {q.montant.toLocaleString("fr-FR")} MAD
                                </span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  q.statut === "Accepté" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-450" 
                                    : q.statut === "Envoyé" 
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400" 
                                    : q.statut === "Refusé"
                                    ? "bg-rose-50 text-rose-700 border border-rose-150 dark:bg-rose-950/20 dark:text-rose-450"
                                    : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-850 dark:text-slate-400"
                                }`}>
                                  {q.statut}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Budget Estimé</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{l.valeurEstimee.toLocaleString("fr-FR")} MAD</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLead(l);
                        setSelectedQuote(null);
                      }}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Nouveau Devis
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeads.length === 0 && (
            <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-xs rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
              Aucun prospect ne correspond à votre recherche.
            </div>
          )}
        </div>
      ) : (
        
        /* WORKSTATION VIEW (when selectedLead or selectedQuote is active) */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 dark:bg-slate-900 dark:border-slate-800 shadow-sm no-print">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setSelectedQuote(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center justify-center cursor-pointer dark:hover:bg-slate-800 dark:text-slate-300"
                title="Retour à la liste"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Planification Commerciale Devis</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Receipt className="h-4.5 w-4.5 text-blue-600" />
                  {selectedLead 
                    ? `Nouveau devis pour : ${selectedLead.nomProjet || selectedLead.societe}` 
                    : `Visualisation Devis : ${selectedQuote?.reference}`
                  }
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Printer className="h-4 w-4" /> Imprimer le Devis / PDF
              </button>

              <button
                onClick={() => {
                  setSelectedLead(null);
                  setSelectedQuote(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 font-semibold text-xs hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
              >
                Fermer la fiche
              </button>
            </div>
          </div>

          {/* Core workstation layout */}
          <div className="flex-1 flex overflow-hidden p-6 gap-6">
            
            {/* Left side: Editor or Status Manager (2/5) */}
            <div className="w-[38%] flex flex-col gap-6 overflow-y-auto no-print">
              
              {selectedLead ? (
                /* CREATE FORM */
                <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm dark:bg-slate-900 dark:border-slate-800 flex-shrink-0 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <PlusCircle className="h-4.5 w-4.5 text-blue-600" />
                    Offres & Articles du Devis
                  </h3>

                  <form onSubmit={handleCreateQuoteSubmit} className="space-y-4">
                    
                    {/* Expiration date */}
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Durée de validité de l'offre :</label>
                      <select
                        value={customValidityDays}
                        onChange={(e) => setCustomValidityDays(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium cursor-pointer text-slate-800 focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      >
                        <option value={15}>15 Jours</option>
                        <option value={30}>30 Jours (Recommandé)</option>
                        <option value={60}>60 Jours</option>
                        <option value={90}>90 Jours</option>
                      </select>
                    </div>

                    {/* Articles list */}
                    <div className="space-y-2.5 border border-slate-200 bg-slate-50/50 p-3 rounded-lg dark:bg-slate-800/50 dark:border-slate-800">
                      <span className="font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider block">Articles rédigés :</span>
                      
                      {articles.length === 0 ? (
                        <p className="text-slate-400 text-xs italic text-center py-4">Aucun article ajouté. Veuillez en créer un ci-dessous.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {articles.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.description}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">{item.quantite} x {item.prixUnitaire.toLocaleString('fr-FR')} MAD</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} MAD</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLineItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}


                      {/* Article Inline Form */}
                      <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Ajouter une ligne d'article personnalisée :</span>
                        <input
                          type="text"
                          placeholder="Description / Libellé de la ligne..."
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-white rounded-lg p-2 border border-slate-200 text-slate-800 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:border-slate-700 dark:text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Qte"
                            min={1}
                            value={newQty}
                            onChange={(e) => setNewQty(Number(e.target.value))}
                            className="bg-white rounded-lg p-2 border border-slate-200 text-slate-800 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:border-slate-700 dark:text-white"
                          />
                          <input
                            type="number"
                            placeholder="Prix Unit"
                            min={0}
                            value={newPrice}
                            onChange={(e) => setNewPrice(Number(e.target.value))}
                            className="bg-white rounded-lg p-2 border border-slate-200 text-slate-800 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddLineItem}
                          className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 font-bold border border-slate-200 rounded text-center transition-colors text-[10px] uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700"
                        >
                          Insérer cette ligne
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={articles.length === 0}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-all uppercase tracking-wide text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Générer et sauvegarder le devis
                    </button>
                  </form>
                </div>
              ) : (
                /* MANAGE VIEW */
                <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm dark:bg-slate-900 dark:border-slate-800 flex-shrink-0 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <FileSignature className="h-4.5 w-4.5 text-blue-600" />
                    Statut & Gestion Devis
                  </h3>
                  
                  {selectedQuote && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">État d'avancement du devis :</label>
                        <select
                          value={selectedQuote.statut}
                          onChange={(e) => {
                            const newStatus = e.target.value as Quote["statut"];
                            onUpdateQuoteStatus(selectedQuote.id, newStatus);
                            setSelectedQuote({ ...selectedQuote, statut: newStatus });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold cursor-pointer text-slate-800 focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                          <option value="Brouillon">Brouillon</option>
                          <option value="Envoyé">Envoyé</option>
                          <option value="Accepté">Accepté</option>
                          <option value="Refusé">Refusé</option>
                        </select>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3 dark:bg-slate-800/50 dark:border-slate-800 space-y-2">
                        <span className="font-bold text-slate-655 dark:text-slate-400 text-[10px] uppercase tracking-wider block">Récapitulatif Dossier :</span>
                        <div className="space-y-1">
                          <p><strong className="text-slate-700 dark:text-slate-350">Prospect :</strong> {quoteLead?.prenom} {quoteLead?.nom}</p>
                          <p><strong className="text-slate-700 dark:text-slate-350">Société :</strong> {quoteLead?.societe || "Indépendant"}</p>
                          <p><strong className="text-slate-700 dark:text-slate-350">Projet :</strong> {quoteLead?.nomProjet || "Opportunité directe"}</p>
                          <p><strong className="text-slate-700 dark:text-slate-350">Montant :</strong> {selectedQuote.montant.toLocaleString('fr-FR')} MAD</p>
                          <p><strong className="text-slate-700 dark:text-slate-350">Date d'émission :</strong> {new Date(selectedQuote.dateEmission).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side: High-Fidelity Professional Printable PDF Sheet (3/5) */}
            <div className="flex-1 overflow-y-auto bg-slate-100 border border-slate-200/80 rounded-xl p-6 flex flex-col items-center dark:bg-slate-950 dark:border-slate-900 relative">
              


              {/* PDF Document sheet container */}
              <div 
                id="invoice-print-area"
                className="bg-white w-[21cm] min-h-[29.7cm] p-[1.8cm] shadow-xl border border-slate-200 text-slate-800 text-sm flex flex-col"
                style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
              >
                
                {/* Main Content Area */}
                <div>
                  
                  {/* Company/Provider details and logo header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                    <div>
                      {/* Stylized branding badge logo */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm">
                          LP
                        </div>
                        <div>
                          <span className="font-extrabold text-lg text-slate-900 tracking-tight block">LeedPro S.A.R.L.</span>
                          <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-bold">Solutions CRM & Sales</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Technopark, Bd Dammam, Entrée A<br />
                        Casablanca, 20150, Maroc<br />
                        RC : 542019 • IF : 1245089<br />
                        contact@leedpro.ma • www.leedpro.ma
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-3.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold tracking-wider uppercase border border-blue-100 mb-3">
                        DEVIS COMMERCIAL
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        Réf : {selectedQuote ? selectedQuote.reference : "DRAFT-PROPOSAL"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Émis le : {new Date(selectedQuote ? selectedQuote.dateEmission : Date.now()).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="text-xs text-slate-400">
                        Valide jusqu'au : {new Date(selectedQuote ? selectedQuote.dateValidite : (Date.now() + customValidityDays * 24 * 60 * 60 * 1000)).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  {/* Issuer and Client Address Cards */}
                  <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Chargé d'affaires (Émetteur)</span>
                      <p className="font-bold text-slate-900 text-sm">{activeUser.nom}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Conseiller Technique & Intégrations</p>
                      <p className="text-slate-500 text-xs mt-1">{activeUser.email}</p>
                      {activeUser.telephone && <p className="text-slate-500 text-xs">{activeUser.telephone}</p>}
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Client Bénéficiaire</span>
                      {selectedLead || quoteLead ? (
                        <>
                          <p className="font-bold text-slate-900 text-sm">{selectedLead ? selectedLead.nomProjet : quoteLead?.nomProjet}</p>
                          <p className="text-slate-700 text-xs font-semibold mt-1">
                            {selectedLead ? selectedLead.societe : quoteLead?.societe}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            À l'attention de : {selectedLead ? `${selectedLead.prenom} ${selectedLead.nom}` : `${quoteLead?.prenom} ${quoteLead?.nom}`}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {selectedLead ? `${selectedLead.adresse || 'Casablanca'}, ${selectedLead.ville || 'Maroc'}` : `${quoteLead?.adresse || 'Casablanca'}, ${quoteLead?.ville || 'Maroc'}`}
                          </p>
                          <p className="text-slate-550 text-xs mt-0.5">{selectedLead ? selectedLead.email : quoteLead?.email}</p>
                        </>
                      ) : (
                        <p className="text-slate-400 italic py-3 text-center">Aucun prospect ou client lié à cette offre.</p>
                      )}
                    </div>
                  </div>

                  {/* Description of Offer details */}
                  <div className="mb-4 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Désignation des prestations</span>
                  </div>

                  {/* Itemized Billing Table */}
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5">Libellé du produit / service</th>
                        <th className="py-2.5 text-center w-20">Qté</th>
                        <th className="py-2.5 text-right w-28">Prix Unit. HT</th>
                        <th className="py-2.5 text-right w-28">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedQuote ? (
                        selectedQuote.articles.map((item, i) => (
                          <tr key={i}>
                            <td className="py-3 font-semibold text-slate-800">{item.description}</td>
                            <td className="py-3 text-center">{item.quantite}</td>
                            <td className="py-3 text-right">{item.prixUnitaire.toLocaleString('fr-FR')} MAD</td>
                            <td className="py-3 text-right font-extrabold text-slate-900">
                              {(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} MAD
                            </td>
                          </tr>
                        ))
                      ) : (
                        articles.map((item, i) => (
                          <tr key={i}>
                            <td className="py-3 font-semibold text-slate-800">{item.description}</td>
                            <td className="py-3 text-center">{item.quantite}</td>
                            <td className="py-3 text-right">{item.prixUnitaire.toLocaleString('fr-FR')} MAD</td>
                            <td className="py-3 text-right font-extrabold text-slate-900">
                              {(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} MAD
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub totals and signatures */}
                <div className="mt-12 border-t border-slate-200 pt-5">
                  <div className="flex justify-between items-start gap-8">
                    
                    {/* Legal terms */}
                    <div className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                      <strong>Notes légales & Règlements :</strong> Devis valable pour une durée de {customValidityDays} jours à compter de sa date d'émission. Règlement par virement bancaire : BMCE Bank - RIB 011780001452900030018449. T.V.A non applicable - Exonération d'impôt (art. 293 B du CGI).
                    </div>
                    
                    {/* Sum details */}
                    <div className="text-right space-y-2 w-72 text-sm text-slate-600 font-medium flex-shrink-0">
                      <div className="flex justify-between">
                        <span>Total Brut HT :</span>
                        <span>{(selectedQuote ? selectedQuote.montant : draftTotal).toLocaleString('fr-FR')} MAD</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>TVA (0%) :</span>
                        <span>0,00 MAD</span>
                      </div>
                      <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-2 text-base font-extrabold">
                        <span className="text-blue-600">MONTANT NET À PAYER :</span>
                        <span className="text-blue-600 whitespace-nowrap">{(selectedQuote ? selectedQuote.montant : draftTotal).toLocaleString('fr-FR')} MAD</span>
                      </div>
                    </div>
                  </div>

                  {/* Official Signatures blocks */}
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-5 mt-14 text-sm text-slate-500">
                    <div className="h-24 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Signature Client (Bon pour accord) :</span>
                      <span className="text-xs italic text-slate-300">Date, signature et cachet commercial</span>
                    </div>
                    
                    <div className="h-24 border border-dashed border-slate-200 rounded-xl p-3 flex flex-col justify-between text-right relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-right">Pour LeedPro S.A.R.L. :</span>
                      <div className="absolute right-4 bottom-5 opacity-15">
                        {/* Simulated stamp/cachet */}
                        <div className="h-10 w-24 border-2 border-blue-600 rounded flex items-center justify-center font-extrabold text-blue-600 text-[8px] uppercase tracking-widest rotate-6">
                          LeedPro S.A.R.L.
                        </div>
                      </div>
                      <span className="text-xs italic text-slate-300">Date et signature</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
