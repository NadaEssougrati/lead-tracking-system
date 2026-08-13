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
  AlertCircle,
  Search,
  ArrowLeft,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Eye,
  RefreshCw
} from "lucide-react";
import { Lead, Task, TaskStatus, TaskType } from "../types";
import { api, getEmailConfig, getEmailHistory, sendEmail, simulateIncomingEmail } from "../api";
import { usePreferences } from "../AppPreferences";

interface EmailComposerProps {
  activeLeadId?: string;
  onSelectLead: (id: string) => void;
  onEmailSent: () => void;
  tasks?: Task[];
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
}

const TEMPLATES = [
  {
    id: "welcome",
    name: "Prise de contact / Bienvenue",
    desc: "Premier contact après inscription ou intérêt initial.",
    defaultSubject: "Bienvenue chez LeadFlow - Prise de contact",
    defaultBody: "Bonjour [Nom],\n\nC'est un plaisir d'entrer en contact avec vous. J'ai bien reçu votre demande d'informations concernant nos services.\n\nQuelle serait votre meilleure disponibilité cette semaine pour un rapide échange téléphonique de 10 minutes afin de qualifier au mieux votre projet ?\n\nCordialement,\n[MonNom]"
  },
  {
    id: "proposal_followup",
    name: "Suivi de proposition commerciale",
    desc: "Suivi structuré après envoi du devis ou de l'offre.",
    defaultSubject: "Suivi de notre proposition commerciale - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nJe me permets de vous recontacter afin de savoir si vous aviez pu prendre connaissance de la proposition commerciale envoyée récemment.\n\nAvez-vous des questions particulières ou des ajustements à y apporter ?\n\nDans l'attente de votre retour,\n[MonNom]"
  },
  {
    id: "meeting_confirm",
    name: "Confirmation de rendez-vous",
    desc: "Validation formelle de l'heure et du lien de visioconférence.",
    defaultSubject: "Confirmation de notre rendez-vous",
    defaultBody: "Bonjour [Nom],\n\nJe vous confirme notre rendez-vous calé pour le [Date] à [Heure].\n\nVoici le lien d'accès à la visioconférence : [Lien]. Si vous rencontrez le moindre contretemps, n'hésitez pas à m'en informer.\n\nBonne journée,\n[MonNom]"
  },
  {
    id: "negotiation",
    name: "Offre / Ajustement tarifaire",
    desc: "Proposition finale ajustée aux contraintes budgétaires.",
    defaultSubject: "Ajustement budgétaire - LeadFlow",
    defaultBody: "Bonjour [Nom],\n\nFaisant suite à nos récents échanges, j'ai le plaisir de vous soumettre une offre finale réévaluée afin de mieux correspondre à vos contraintes budgétaires.\n\nVous trouverez le détail des remises de fin d'année sur votre espace client.\n\nCordialement,\n[MonNom]"
  }
];

export default function EmailComposer({
  activeLeadId,
  onSelectLead,
  onEmailSent,
  tasks = [],
  onUpdateTaskStatus
}: EmailComposerProps) {
  const { t } = usePreferences();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailProvider, setEmailProvider] = useState<"resend" | "smtp">("smtp");
  const [hasResendApiKey, setHasResendApiKey] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // Composer Form
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState("professional");

  // Lead search
  const [leadSearch, setLeadSearch] = useState("");

  // History and simulations
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Load email configuration (Resend vs SMTP)
  useEffect(() => {
    getEmailConfig()
      .then((res) => {
        if (res) {
          setEmailProvider(res.emailProvider || "smtp");
          setHasResendApiKey(res.hasResendApiKey || false);
        }
      })
      .catch(console.error);
  }, []);

  // Load leads lists to populate selector
  const loadLeads = () => {
    api<any[]>("/leads")
      .then((data) => {
        const mapped = data.map((l: any) => ({
          ...l,
          societe: l.entreprise?.nom || "",
          valeurEstimee: Number(l.valeurEstimee)
        }));
        setLeads(mapped);
        if (activeLeadId) {
          const matched = mapped.find(l => l.id === activeLeadId);
          if (matched) {
            setSelectedLead(matched);
            loadHistory(matched.id);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadLeads();
  }, [activeLeadId]);

  // Load email history for the selected lead
  const loadHistory = async (leadId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await getEmailHistory(leadId);
      if (res) {
        setEmailHistory(res);
      }
    } catch (err) {
      console.error("Error loading email history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Update recipient details when lead changes
  const handleSelectLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    onSelectLead(lead.id);
    loadHistory(lead.id);

    // Auto check if there is a pending email task for this lead
    const matchedTask = tasks.find(t => t.leadId === lead.id && t.type === TaskType.EMAIL && t.statut !== TaskStatus.DONE);
    if (matchedTask) {
      setActiveTaskId(matchedTask.id);
      setSubject(matchedTask.titre);
      setBody(matchedTask.description || "");
    } else {
      setActiveTaskId(null);
      setSubject("");
      setBody("");
    }
  };

  const handleBackToList = () => {
    setSelectedLead(null);
    onSelectLead("");
    setEmailHistory([]);
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
    if (!selectedLead) return;
    setIsGenerating(true);
    
    // Simulate smart copywriter generator based on tone and lead profile details
    setTimeout(() => {
      const leadName = `${selectedLead.prenom} ${selectedLead.nom}`;
      const company = selectedLead.societe || "votre entreprise";
      const budget = selectedLead.valeurEstimee ? `${selectedLead.valeurEstimee.toLocaleString("fr-FR")} MAD` : "votre budget";
      
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
    }, 1200);
  };

  // Submit and log email on backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!selectedLead.email) {
      alert("Ce destinataire n'a pas d'adresse email configurée.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      alert("Le sujet et le corps du message sont obligatoires.");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendEmail({
        leadId: selectedLead.id,
        subject: subject.trim(),
        body: body.trim()
      });

      if (res) {
        setSubject("");
        setBody("");
        
        // Mark task as done if it was initiated from a task
        if (activeTaskId && onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTaskId, TaskStatus.DONE);
          setActiveTaskId(null);
        }

        // Reload history
        await loadHistory(selectedLead.id);
        onEmailSent();
      } else {
        alert("Une erreur s'est produite lors de l'envoi de l'e-mail.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Impossible d'envoyer l'e-mail pour le moment.");
    } finally {
      setIsSending(false);
    }
  };

  // Trigger simulated lead response
  const handleSimulateResponse = async () => {
    if (!selectedLead) return;
    setIsSimulating(true);
    try {
      const res = await simulateIncomingEmail(selectedLead.id);
      if (res) {
        await loadHistory(selectedLead.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Filter leads based on search term
  const filteredLeads = leads.filter(l =>
    l.prenom.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.nom.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.societe && l.societe.toLowerCase().includes(leadSearch.toLowerCase())) ||
    (l.email && l.email.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  const pendingEmailTasks = tasks.filter(t => t.type === TaskType.EMAIL && t.statut !== TaskStatus.DONE);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-955 overflow-hidden text-slate-800 dark:text-slate-100" id="email-workstation">
      
      {/* 2. Workspace View Routing */}
      {!selectedLead ? (
        
        /* FIRST STEP: SELECT A LEAD SCREEN */
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full flex flex-col justify-start space-y-6">
          <div className="text-center py-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Sélectionner un destinataire</h2>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Recherchez et choisissez le prospect à qui envoyer l'e-mail de suivi.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Column 1: Pending email tasks (1/3) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600 animate-pulse" />
                  E-mails planifiés ({pendingEmailTasks.length})
                </h3>

                <div className="space-y-3 mt-3 max-h-[480px] overflow-y-auto pr-1">
                  {pendingEmailTasks.map(t => {
                    const leadObj = leads.find(l => l.id === t.leadId);
                    return (
                      <div 
                        key={t.id} 
                        className="border border-slate-150 rounded-xl p-3 dark:border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-2.5 bg-slate-50/30 dark:bg-slate-850/10 cursor-pointer"
                        onClick={() => leadObj && handleSelectLeadClick(leadObj)}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight hover:text-blue-600 transition-colors">{t.titre}</span>
                            {t.critique && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-rose-50 text-rose-700 border border-rose-150 uppercase dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 flex-shrink-0">Urgente</span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-slate-505 mt-1 line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>
                          )}
                          <p className="text-[9px] text-blue-600 dark:text-blue-450 mt-1.5 font-bold">
                            Pour : {leadObj ? `${leadObj.prenom} ${leadObj.nom} (${leadObj.societe})` : "Client inconnu"}
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[9px] border-t border-slate-100 pt-2 dark:border-slate-800 mt-1 flex-shrink-0">
                          <span className="text-slate-400">Échéance : {t.dateEcheance}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateTaskStatus) onUpdateTaskStatus(t.id, TaskStatus.DONE);
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg transition-colors border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900 cursor-pointer"
                          >
                            Marquer fait
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {pendingEmailTasks.length === 0 && (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl p-5 dark:border-slate-800">
                      Aucun e-mail à faire planifié
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Search and leads list (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email, société..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250/70 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-850 dark:border-slate-750 dark:text-white transition-all font-semibold"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                </div>

                {/* List of Leads */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto pr-1">
                  {filteredLeads.map(l => (
                    <button
                      type="button"
                      key={l.id}
                      onClick={() => handleSelectLeadClick(l)}
                      className="w-full text-left py-3 px-4 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-all flex items-center justify-between cursor-pointer group mt-1 first:mt-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600/10 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {l.societe ? l.societe[0].toUpperCase() : (l.nomProjet ? l.nomProjet[0].toUpperCase() : l.prenom[0])}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-450 transition-colors truncate">
                            {l.nomProjet || `Opportunité - ${l.societe || `${l.prenom} ${l.nom}`}`}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold truncate mt-0.5">
                            {l.societe ? `${l.societe} • ` : ""}Contact : {l.prenom} {l.nom} {l.email ? `• ${l.email}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Actions / Info */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500 font-bold px-2 py-0.5 rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-slate-450">
                          {l.statut}
                        </span>
                        <span className="text-blue-600 group-hover:translate-x-1.5 transition-transform duration-150 font-bold text-xs flex items-center gap-0.5 dark:text-blue-450">
                          Sélectionner &rarr;
                        </span>
                      </div>
                    </button>
                  ))}

                  {filteredLeads.length === 0 && (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucun prospect trouvé pour "{leadSearch}"
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      ) : (

        /* SECOND STEP: COMPOSE & HISTORY WORKSTATION */
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANELS: Composer (2/3 width) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Back Button and Selected Lead Summary */}
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={handleBackToList}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-white font-bold cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la liste des prospects
              </button>

              <span className="text-[10px] text-slate-400 font-bold dark:text-slate-500">Destinataire sélectionné</span>
            </div>

            {/* Recipient summary card */}
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border border-blue-100 rounded-2xl p-4 flex items-center justify-between dark:from-slate-900/60 dark:to-slate-900/30 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/10">
                  {selectedLead.societe ? selectedLead.societe[0].toUpperCase() : selectedLead.prenom[0]}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-800 dark:text-white leading-none">{selectedLead.prenom} {selectedLead.nom}</h3>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold mt-1 leading-none">{selectedLead.societe || "Indépendant"}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-550 mt-1 leading-none">Email : {selectedLead.email} {selectedLead.telephone ? `• Tel : ${selectedLead.telephone}` : ""}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-blue-650 bg-blue-100/50 px-2 py-0.5 rounded border border-blue-200/50 font-bold dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900 uppercase tracking-wide">
                  {selectedLead.statut}
                </span>
                {selectedLead.valeurEstimee > 0 && (
                  <p className="text-[10px] text-slate-700 font-extrabold mt-1.5 dark:text-slate-300">
                    {selectedLead.valeurEstimee.toLocaleString("fr-FR")} MAD
                  </p>
                )}
              </div>
            </div>

            {/* Email Composer Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Objet du message</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Suite à notre réunion de présentation..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-850 dark:border-slate-750 dark:text-white transition-all font-medium"
                  />
                </div>

                {/* Templates Selector inside Composer */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Modèles :</span>
                  {TEMPLATES.map(tpl => (
                    <button
                      type="button"
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl.id)}
                      className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-750 cursor-pointer transition-colors"
                    >
                      {tpl.name.split(" / ")[0]}
                    </button>
                  ))}
                </div>

                {/* Body Content */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Message</label>
                  <textarea
                    required
                    rows={10}
                    placeholder="Rédigez votre email de suivi ici..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs font-sans focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-850 dark:border-slate-750 dark:text-white transition-all leading-relaxed"
                  />
                </div>

                {/* Submit & AI Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* AI Copywriter Assist Section */}
                  <div className="flex items-center gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="bg-slate-50 text-[10px] text-slate-700 font-bold border border-slate-200 rounded-lg py-1.5 px-2 dark:bg-slate-800 dark:border-slate-755 dark:text-slate-350 cursor-pointer"
                    >
                      <option value="professional">Ton Professionnel</option>
                      <option value="friendly">Ton Amical</option>
                      <option value="urgent">Ton Direct & Urgent</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={isGenerating}
                      className="bg-purple-550/10 hover:bg-purple-550/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Rédiger avec l'IA
                        </>
                      )}
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isSending}
                    className="bg-blue-650 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/15 font-semibold"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4.5 w-4.5" />
                        Envoyer et Enregistrer
                      </>
                    )}
                  </button>

                </div>

              </form>
            </div>
            
          </div>

          {/* RIGHT PANEL: Email History for the Selected Lead (1/3 width) */}
          <div className="w-96 border-l border-slate-200 bg-white flex flex-col dark:border-slate-800 dark:bg-slate-900 shrink-0">
            
            {/* History Panel Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-xs dark:text-white">Historique de discussion</h3>
              </div>

              {/* Simulation Reply Trigger (Resend mode only) */}
              {emailProvider === "resend" && (
                <button
                  type="button"
                  onClick={handleSimulateResponse}
                  disabled={isSimulating}
                  className="bg-slate-100 hover:bg-slate-250/80 border border-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-750 p-1.5 rounded-lg text-[10px] font-bold transition-all text-slate-700 dark:text-slate-300 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  title="Simuler une réponse par mail du lead"
                >
                  <RefreshCw className={`h-3 w-3 ${isSimulating ? "animate-spin" : ""}`} />
                  Simuler réponse
                </button>
              )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-450 dark:text-slate-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de l'historique...
                </div>
              ) : emailHistory.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl p-6 dark:border-slate-800">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  Aucun e-mail échangé avec ce lead.
                </div>
              ) : (
                emailHistory.map(email => {
                  const isSent = email.direction === "SENT";
                  const isExpanded = expandedEmailId === email.id;

                  return (
                    <div 
                      key={email.id} 
                      className={`flex flex-col gap-1 max-w-[85%] ${isSent ? "ml-auto text-right items-end" : "mr-auto text-left items-start"}`}
                    >
                      {/* Meta header (exp / date) */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-semibold px-1">
                        {isSent ? (
                          <>
                            <span>{email.auteurNom ? `Par : ${email.auteurNom}` : "Vous"}</span>
                            <span>•</span>
                          </>
                        ) : (
                          <>
                            <span>{email.expediteur}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{new Date(email.dateCreation).toLocaleDateString("fr-FR")} {new Date(email.dateCreation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* Message bubble */}
                      <div 
                        onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                        className={`rounded-2xl p-3 text-[11px] shadow-sm cursor-pointer transition-all border leading-relaxed text-left ${
                          isSent 
                            ? "bg-blue-600 border-blue-600 text-white rounded-tr-none hover:bg-blue-700" 
                            : "bg-slate-50 border-slate-200/80 text-slate-800 rounded-tl-none dark:bg-slate-850 dark:border-slate-750 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/85"
                        }`}
                      >
                        <p className="font-bold text-[10px] border-b pb-1.5 mb-1.5 opacity-90 border-current/20 flex items-center gap-1">
                          {isSent ? <ArrowUpRight className="h-3 w-3 flex-shrink-0" /> : <ArrowDownLeft className="h-3 w-3 flex-shrink-0" />}
                          Sujet : {email.sujet}
                        </p>
                        
                        <div className={`${isExpanded ? "whitespace-pre-line break-words" : "line-clamp-3 overflow-hidden text-ellipsis break-words"}`}>
                          {email.corps.split("\n").map((line: string, index: number) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      
                      {/* Collapse/Expand action link */}
                      <button
                        type="button"
                        onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                        className="text-[9px] text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 font-bold px-2 py-0.5 self-end"
                      >
                        {isExpanded ? "Réduire" : "Voir plus..."}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
