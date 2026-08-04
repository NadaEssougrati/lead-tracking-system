/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, 
  PlusCircle, 
  Download, 
  Trash, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  Printer,
  ChevronRight,
  User,
  Sparkles,
  RefreshCw,
  Search
} from "lucide-react";
import { Lead, Quote, User as UserType } from "../types";

interface QuoteGeneratorProps {
  quotes: Quote[];
  leads: Lead[];
  onCreateQuote: (quote: Omit<Quote, "id" | "reference">) => void;
  onUpdateQuoteStatus: (id: string, statut: Quote["statut"]) => void;
  activeUser: UserType;
}

export default function QuoteGenerator({
  quotes,
  leads,
  onCreateQuote,
  onUpdateQuoteStatus,
  activeUser
}: QuoteGeneratorProps) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  
  // New quote line items state
  const [articles, setArticles] = useState<Array<{ description: string; quantite: number; prixUnitaire: number }>>([
    { description: "Abonnement Annuel Tracking Lead System (Entreprise)", quantite: 1, prixUnitaire: 12000 },
    { description: "Prestation d'installation et de formation des équipes", quantite: 1, prixUnitaire: 3500 }
  ]);
  
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(500);

  // Active Quote focused for PDF simulation
  const [focusedQuoteId, setFocusedQuoteId] = useState<string | null>(quotes[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuotes = quotes.filter(q => {
    const lead = leads.find(l => l.id === q.leadId);
    const query = searchTerm.toLowerCase();
    return q.reference.toLowerCase().includes(query) || (lead && lead.societe.toLowerCase().includes(query));
  });

  const activeQuote = filteredQuotes.find(q => q.id === focusedQuoteId) || filteredQuotes[0];
  const activeQuoteLead = leads.find(l => l.id === activeQuote?.leadId);

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
    if (!selectedLeadId) {
      alert("Veuillez sélectionner un prospect concerné par cette offre.");
      return;
    }
    if (articles.length === 0) {
      alert("Le devis doit contenir au moins un article.");
      return;
    }

    const totalMontant = articles.reduce((acc, curr) => acc + (curr.quantite * curr.prixUnitaire), 0);

    onCreateQuote({
      leadId: selectedLeadId,
      dateEmission: new Date().toISOString().split("T")[0],
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      montant: totalMontant,
      statut: "Brouillon",
      articles
    });

    // Reset draft
    setArticles([
      { description: "Abonnement Annuel Tracking Lead System (Entreprise)", quantite: 1, prixUnitaire: 12000 },
      { description: "Prestation d'installation et de formation des équipes", quantite: 1, prixUnitaire: 3500 }
    ]);
    setSelectedLeadId("");
    alert("Votre devis commercial a été généré avec succès en mode Brouillon !");
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] text-slate-850 dark:bg-slate-950" id="quote-generator-root">
      <div className="max-w-7xl mx-auto w-full space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Hand: Generator Form & List (3 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Quote Section */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-blue-600" />
              Générer une offre commerciale (Devis)
            </h3>

            <form onSubmit={handleCreateQuoteSubmit} className="space-y-4">
              
              {/* Select Prospect */}
              <div>
                <label className="block text-[11px] text-slate-500 font-bold mb-1.5 uppercase">Prospect bénéficiaire :</label>
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 cursor-pointer focus:bg-white"
                >
                  <option value="">-- Sélectionner un prospect qualifié --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.societe} - ({l.prenom} {l.nom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic list of articles draft */}
              <div className="space-y-2 border border-slate-200 bg-slate-50 p-3 rounded-lg">
                <p className="font-bold text-slate-600 text-[11px] uppercase tracking-wider mb-2">Lignes de l'offre commerciale :</p>
                
                {articles.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-2">Aucun article ajouté.</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {articles.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-150">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-750 truncate">{item.description}</p>
                          <p className="text-[10px] text-slate-400">{item.quantite} x {item.prixUnitaire.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-850">{(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} €</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLineItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Adder Form */}
                <div className="border-t border-slate-150 pt-2.5 mt-2.5 space-y-2.5">
                  <input
                    type="text"
                    placeholder="Libellé du produit ou service..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-white rounded p-2 border border-slate-250 text-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Qte"
                      min={1}
                      value={newQty}
                      onChange={(e) => setNewQty(Number(e.target.value))}
                      className="bg-white rounded p-2 border border-slate-250 text-slate-800"
                    />
                    <input
                      type="number"
                      placeholder="Prix Unit"
                      min={0}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="bg-white rounded p-2 border border-slate-250 text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 font-bold border border-slate-300 rounded text-center transition-colors text-[11px] uppercase tracking-wide text-slate-700"
                  >
                    Ajouter cette ligne
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-all uppercase tracking-wide text-xs"
              >
                Générer et sauvegarder le devis
              </button>
            </form>
          </div>

          {/* List of Quotes */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-blue-600" />
              Devis et propositions émis
            </h3>

            {/* Search Input */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un devis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-slate-750 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredQuotes.map((q) => {
                const lead = leads.find((l) => l.id === q.leadId);
                const isSelected = q.id === focusedQuoteId;

                return (
                  <div
                    key={q.id}
                    onClick={() => setFocusedQuoteId(q.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? "bg-slate-50 border-blue-600 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-850">{q.reference}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lead?.societe || "Client inconnu"}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-650">{q.montant.toLocaleString('fr-FR')} €</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold mt-1 ${
                        q.statut === "Accepté" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : q.statut === "Envoyé" 
                          ? "bg-blue-50 text-blue-600 border border-blue-200" 
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {q.statut}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Hand: High-Fidelity Printable PDF Simulation (3 Columns) */}
        <div className="lg:col-span-3">
          {activeQuote ? (
            <div className="bg-white text-slate-800 rounded-xl p-6 shadow-2xl relative border border-slate-200 flex flex-col justify-between min-h-[600px]" id="invoice-simulation">
              
              {/* PDF simulation watermark banner */}
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1.5 px-4 rounded-t-xl flex justify-between items-center text-[10px] font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse" /> Aperçu avant impression (Simulation PDF certifié)
                </span>
                <span>ID: {activeQuote.reference}</span>
              </div>

              {/* Main invoice */}
              <div className="pt-6">
                
                {/* PDF Header logo / address */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 tracking-tight flex items-center gap-1.5">
                      LeedPro S.A.R.L.
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Technopark, Bd Dammam<br />
                      Casablanca, Maroc<br />
                      contact@leedpro.ma
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-slate-700 tracking-wide uppercase">DEVIS COMMERCIAL</h3>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Ref : {activeQuote.reference}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Émis le : {new Date(activeQuote.dateEmission).toLocaleDateString("fr-FR")}</p>
                    <p className="text-[10px] text-slate-400">Valide jusqu'au : {new Date(activeQuote.dateValidite).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                {/* Customer / Beneficiary address */}
                <div className="my-6 bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Émetteur :</p>
                    <p className="font-bold text-slate-700 mt-1">{activeUser.nom}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{activeUser.role} - LeedPro</p>
                    <p className="text-slate-500 text-[10px]">{activeUser.telephone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bénéficiaire :</p>
                    {activeQuoteLead ? (
                      <>
                        <p className="font-bold text-slate-700 mt-1">{activeQuoteLead.societe}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">À l'attention de : {activeQuoteLead.prenom} {activeQuoteLead.nom}</p>
                        <p className="text-slate-500 text-[10px]">{activeQuoteLead.adresse}, {activeQuoteLead.ville}</p>
                        <p className="text-slate-500 text-[10px]">{activeQuoteLead.email}</p>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">Aucun bénéficiaire renseigné</p>
                    )}
                  </div>
                </div>

                {/* Table of Articles */}
                <div className="mt-6">
                  <table className="w-full text-left border-collapse text-xs">
                     <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-2">Description</th>
                        <th className="py-2 text-center">Quantité</th>
                        <th className="py-2 text-right">Prix Unitaire</th>
                        <th className="py-2 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeQuote.articles.map((item, i) => (
                        <tr key={i}>
                          <td className="py-3 font-medium">{item.description}</td>
                          <td className="py-3 text-center">{item.quantite}</td>
                          <td className="py-3 text-right">{item.prixUnitaire.toLocaleString('fr-FR')} €</td>
                          <td className="py-3 text-right font-bold text-slate-800">
                            {(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Sub totals and signatures */}
              <div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-start my-6">
                  <div className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                    <strong>Conditions de règlement :</strong> Règlement à 30 jours nets à réception de facture. Devis valable un mois. T.V.A non applicable, art. 293 B du CGI.
                  </div>
                  <div className="text-right space-y-1.5 w-60 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Brut HT :</span>
                      <span>{activeQuote.montant.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Remise (0%) :</span>
                      <span>0,00 €</span>
                    </div>
                    <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-1.5 text-sm font-bold">
                      <span className="text-blue-600">MONTANT TOTAL NET :</span>
                      <span className="text-blue-600">{activeQuote.montant.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-5 text-xs text-slate-500">
                  <div className="h-20 border border-dashed border-slate-200 rounded p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Bon pour accord (Signature client) :</span>
                    <span className="text-[10px] italic text-slate-300">Date et mention manuscrite</span>
                  </div>
                  <div className="h-20 border border-dashed border-slate-200 rounded p-2 flex flex-col justify-between text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Pour LeedPro S.A.R.L. :</span>
                    <span className="font-bold text-slate-600 italic">Signature Numérique Validée</span>
                  </div>
                </div>

                {/* Quick PDF status manager buttons */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-400">Statut du devis :</span>
                    <select
                      value={activeQuote.statut}
                      onChange={(e) => onUpdateQuoteStatus(activeQuote.id, e.target.value as Quote["statut"])}
                      className="bg-slate-100 text-[10px] text-slate-700 font-bold border-none rounded focus:ring-1 focus:ring-blue-500 py-0.5 px-1 pr-6 cursor-pointer"
                    >
                      <option value="Brouillon">Brouillon</option>
                      <option value="Envoyé">Envoyé</option>
                      <option value="Accepté">Accepté</option>
                      <option value="Refusé">Refusé</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded text-[10px] font-bold border border-slate-200 transition-colors"
                  >
                    <Printer className="h-3 w-3" /> Imprimer en PDF
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
              Veuillez générer ou sélectionner un devis commercial pour visualiser sa fiche d'aperçu PDF.
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}
