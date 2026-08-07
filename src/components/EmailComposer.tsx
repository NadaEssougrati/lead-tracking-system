import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Loader2, 
  FileText, 
  User, 
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Lead } from "../types";
import { api } from "../api";
import { usePreferences } from "../AppPreferences";

interface EmailComposerProps {
  activeLeadId?: string;
  onSelectLead: (id: string) => void;
  onEmailSent: () => void;
}

const TEMPLATES = [
  {
    id: "welcome",
    labelKey: "email.template.welcome",
    defaultSubject: "Bienvenue chez LeadFlow - Prise de contact",
    defaultBody: "Bonjour [Nom],\n\nC'est un plaisir d'entrer en contact avec vous. J'ai bien reçu votre demande d'informations concernant nos services.\n\nQuelle serait votre meilleure disponibilité cette semaine pour un rapide échange téléphonique de 10 minutes afin de qualifier au mieux votre projet ?\n\nCordialement,\n[MonNom]"
  },
  {
    id: "proposal_followup",
    labelKey: "email.template.followup",
    defaultSubject: "Suivi de notre proposition commerciale - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nJe me permets de vous recontacter afin de savoir si vous aviez pu prendre connaissance de la proposition commerciale envoyée récemment.\n\nAvez-vous des questions particulières ou des ajustements à y apporter ?\n\nDans l'attente de votre retour,\n[MonNom]"
  },
  {
    id: "meeting_confirm",
    labelKey: "email.template.meeting",
    defaultSubject: "Confirmation de notre rendez-vous",
    defaultBody: "Bonjour [Nom],\n\nJe vous confirme notre rendez-vous calé pour le [Date] à [Heure].\n\nVoici le lien d'accès à la visioconférence : [Lien]. Si vous rencontrez le moindre contretemps, n'hésitez pas à m'en informer.\n\nBonne journée,\n[MonNom]"
  },
  {
    id: "negotiation",
    labelKey: "email.template.negotiation",
    defaultSubject: "Ajustement budgétaire - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nFaisant suite à nos récents échanges, j'ai le plaisir de vous soumettre une offre finale réévaluée afin de mieux correspondre à vos contraintes budgétaires.\n\nVous trouverez le détail des remises de fin d'année sur votre espace client.\n\nCordialement,\n[MonNom]"
  }
];

export default function EmailComposer({
  activeLeadId,
  onSelectLead,
  onEmailSent
}: EmailComposerProps) {
  const { t } = usePreferences();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState("professional");

  // Load leads lists to populate selector
  useEffect(() => {
    api<Lead[]>("/leads")
      .then((data) => {
        setLeads(data);
        if (activeLeadId) {
          const matched = data.find(l => l.id === activeLeadId);
          if (matched) setSelectedLead(matched);
        }
      })
      .catch(console.error);
  }, [activeLeadId]);

  // Update recipient details when lead changes
  const handleLeadChange = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      onSelectLead(lead.id);
    }
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const leadName = selectedLead ? `${selectedLead.prenom} ${selectedLead.nom}` : "Client";
    const parsedSubject = tpl.defaultSubject.replace("[Nom]", leadName);
    const parsedBody = tpl.defaultBody
      .replace("[Nom]", leadName)
      .replace("[MonNom]", "Votre conseiller CRM");

    setSubject(parsedSubject);
    setBody(parsedBody);
  };

  // AI assist copy generation simulation
  const handleAIGenerate = async () => {
    if (!selectedLead) {
      alert("Veuillez sélectionner un destinataire d'abord.");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate smart copywriter generator based on tone and lead profile details
    setTimeout(() => {
      const leadName = `${selectedLead.prenom} ${selectedLead.nom}`;
      const company = selectedLead.societe || "votre entreprise";
      const budget = selectedLead.valeurEstimee ? `${selectedLead.valeurEstimee} €` : "votre budget";
      
      let generatedSubject = "";
      let generatedBody = "";

      if (aiTone === "professional") {
        generatedSubject = `Partenariat commercial & opportunités - ${company}`;
        generatedBody = `Bonjour ${leadName},\n\nJ'espère que vous allez bien.\n\nJe fais suite à notre analyse prédictive IA concernant votre projet chez ${company}. Nous aimerions vous proposer une démonstration sur mesure adaptée à vos besoins et à votre budget estimé de ${budget}.\n\nPourriez-vous me faire part de vos disponibilités cette semaine ?\n\nSincères salutations,\nL'équipe commerciale LeadFlow`;
      } else if (aiTone === "friendly") {
        generatedSubject = `Ravi d'échanger avec vous, ${selectedLead.prenom} !`;
        generatedBody = `Salut ${selectedLead.prenom},\n\nJ'espère que tu passes une super semaine !\n\nJe voulais simplement faire le point sur ton projet chez ${company}. J'ai vu qu'on parlait d'un budget d'environ ${budget}, ce qui correspond parfaitement à ce qu'on peut accomplir ensemble.\n\nFais-moi signe si tu as un moment pour un petit café virtuel cette semaine !\n\nÀ très vite,\nL'équipe LeadFlow`;
      } else {
        generatedSubject = `🔒 Action requise : Suivi urgent de votre projet - ${company}`;
        generatedBody = `Bonjour ${leadName},\n\nJe reviens vers vous car notre proposition commerciale arrive bientôt à échéance.\n\nNous aimerions finaliser la commande pour lancer le déploiement sur ${company} dans les plus brefs délais.\n\nMerci de me recontacter d'ici la fin de journée pour bloquer le tarif préférentiel.\n\nCordialement,\nDirection Commerciale`;
      }

      setSubject(generatedSubject);
      setBody(generatedBody);
      setIsGenerating(false);
    }, 1500);
  };

  // Submit and log email as an activity in the timeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) {
      alert("Veuillez choisir un destinataire.");
      return;
    }
    if (!selectedLead.email) {
      alert("Ce destinataire n'a pas d'adresse email configurée.");
      return;
    }
    if (!subject || !body) {
      alert("Le sujet et le contenu sont obligatoires.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Log as an activity in CRM
      await api("/activities", {
        method: "POST",
        body: JSON.stringify({
          type: "Email",
          dateActivite: new Date().toISOString(),
          description: `Sujet : ${subject}\n\n${body}`,
          leadId: selectedLead.id
        })
      });

      // 2. Open local mail client via mailto link
      const mailtoUrl = `mailto:${encodeURIComponent(selectedLead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      setSubject("");
      setBody("");
      onEmailSent();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de l'activité.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto max-h-screen text-slate-800" id="email-composer-root">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Templates & Parameters (1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Templates Section */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-white dark:border-slate-800">
              <FileText className="h-4 w-4 text-blue-600" />
              Modèles d'emails
            </h3>
            
            <div className="space-y-2">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.id)}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/20 text-xs font-semibold text-slate-700 transition-all cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/40"
                >
                  {tpl.defaultSubject}
                </button>
              ))}
            </div>
          </div>

          {/* AI Assistance Tone Selector */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-white dark:border-slate-800">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Rédacteur Assisté par IA
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Tonalité souhaitée</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="professional">Professionnel & Formel</option>
                  <option value="friendly">Amical & Décontracté</option>
                  <option value="urgent">Direct & Urgent</option>
                </select>
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || !selectedLead}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Rédiger avec l'IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Message Editor (2 Columns) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
          
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Mail className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Envoyer un email de suivi</h2>
          </div>

          {/* Select Lead Recipient */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Destinataire (Lead)</label>
            <select
              value={selectedLead?.id || ""}
              onChange={(e) => handleLeadChange(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="">-- Sélectionner un contact dans le CRM --</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.societe ? `${l.societe} - ` : ""}{l.prenom} {l.nom} ({l.email})
                </option>
              ))}
            </select>
          </div>

          {/* Email To Display (read only) */}
          {selectedLead && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs dark:bg-slate-800 dark:border-slate-700">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Envoyer à :</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedLead.email}</span>
            </div>
          )}

          {/* Subject Line */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Objet du message</label>
            <input
              type="text"
              required
              placeholder="Ex: Suite à notre réunion..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Body Text Editor */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Corps du message</label>
            <textarea
              required
              rows={12}
              placeholder="Rédigez votre email ici ou appliquez un modèle d'IA..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-sans focus:outline-none focus:bg-white leading-relaxed dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSending || !selectedLead}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-40"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer et Enregistrer
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
