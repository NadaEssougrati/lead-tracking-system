import React, { useState } from "react";
import { 
  PlusCircle,
  Building,
  User,
  BadgeCent,
  CheckCircle2,
  Mail
} from "lucide-react";
import { Lead, LeadSource, LeadPriority, LeadStatus } from "../types";

interface LeadFormProps {
  onAddLead: (lead: Omit<Lead, "id" | "dateCreation" | "derniereActivite" | "documents" | "score">) => void;
  commercials: Array<{ id: string; nom: string }>;
}

export default function LeadForm({ onAddLead, commercials }: LeadFormProps) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("Maroc");
  const [source, setSource] = useState<LeadSource>(LeadSource.WEBSITE);
  const [priorite, setPriorite] = useState<LeadPriority>(LeadPriority.MEDIUM);
  const [valeurEstimee, setValeurEstimee] = useState(15000);
  const [commercialId, setCommercialId] = useState("");
  const [notes, setNotes] = useState("");

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !societe || !email) {
      alert("Veuillez remplir les champs obligatoires (Nom, Prénom, Société, Email).");
      return;
    }

    onAddLead({
      nom,
      prenom,
      societe,
      email,
      telephone,
      adresse,
      ville,
      pays,
      source,
      statut: LeadStatus.NEW,
      priorite,
      valeurEstimee: Number(valeurEstimee) || 0,
      commercialId: commercialId || undefined,
      notes: notes || "Aucune note complémentaire lors de la création."
    });

    setNom("");
    setPrenom("");
    setSociete("");
    setEmail("");
    setTelephone("");
    setAdresse("");
    setVille("");
    setNotes("");

    setFeedback("Le prospect a été créé avec succès et enregistré dans le pipeline !");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850" id="lead-form-root">
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building className="h-4.5 w-4.5 text-blue-600" />
          Saisie d'un nouveau prospect dans le CRM
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Prénom *</label>
              <input
                type="text"
                required
                placeholder="Ex: Jean"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Nom de famille *</label>
              <input
                type="text"
                required
                placeholder="Ex: Dupont"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Société / Organisation *</label>
              <input
                type="text"
                required
                placeholder="Ex: TechSolutions S.A."
                value={societe}
                onChange={(e) => setSociete(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Adresse email *</label>
              <input
                type="email"
                required
                placeholder="Ex: j.dupont@societe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Téléphone</label>
              <input
                type="text"
                placeholder="Ex: +212 600-000000"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Budget Estimé (EUR) *</label>
              <input
                type="number"
                required
                min={1}
                value={valeurEstimee}
                onChange={(e) => setValeurEstimee(Number(e.target.value))}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Priorité commerciale</label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as LeadPriority)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer"
              >
                <option value={LeadPriority.LOW}>Basse</option>
                <option value={LeadPriority.MEDIUM}>Moyenne</option>
                <option value={LeadPriority.HIGH}>Haute</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Source d'acquisition</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer"
              >
                {Object.values(LeadSource).map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Attribuer à un commercial</label>
              <select
                value={commercialId}
                onChange={(e) => setCommercialId(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer"
              >
                <option value="">-- Non attribué (Pool commun) --</option>
                {commercials.map((comm) => (
                  <option key={comm.id} value={comm.id}>{comm.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Pays d'origine</label>
              <input
                type="text"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Ville d'origine</label>
              <input
                type="text"
                placeholder="Ex: Casablanca, Paris..."
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Adresse physique complète</label>
              <input
                type="text"
                placeholder="Ex: Boulevard de la Corniche"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[10px]">Commentaire initial ou expression de besoin</label>
            <textarea
              rows={3}
              placeholder="Renseignez l'expression de besoin du prospect, l'historique rapide de la prise de contact..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Ajouter et insérer dans le Kanban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
