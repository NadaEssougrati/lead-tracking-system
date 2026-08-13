import React, { useState, useEffect, useRef } from "react";
import { 
  PlusCircle,
  Building,
  User,
  BadgeCent,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { Lead, LeadSource, LeadPriority, LeadStatus } from "../types";

interface LeadFormProps {
  onAddLead: (lead: Omit<Lead, "id" | "dateCreation" | "derniereActivite" | "documents" | "score">) => void;
  commercials: Array<{ id: string; nom: string }>;
  existingLeads: Lead[];
}

const ALL_COUNTRIES = Array.from(new Set([
  "Maroc", "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", "Arabie Saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi", "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Chili", "Chine", "Chypre", "Colombie", "Comores", "Congo-Brazzaville", "Congo-Kinshasa", "Corée du Nord", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti", "Dominique", "Égypte", "Émirats Arabes Unis", "Équateur", "Érythrée", "Espagne", "Estonie", "États-Unis", "Éthiopie", "Fidji", "Finlande", "France", "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée-Bissau", "Guinée équatoriale", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie", "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kirghizistan", "Kiribati", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Libéria", "Libye", "Liechtenstein", "Lituanie", "Luxembourg", "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigéria", "Norvège", "Nouvelle-Zélande", "Oman", "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République centrafricaine", "République Dominicaine", "République tchèque", "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Saint-Christophe-et-Niévès", "Sainte-Lucie", "Saint-Marin", "Saint-Vincent-et-les-Grenadines", "Salomon", "Salvador", "Samoa", "Sao Tomé-et-Principe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Eswatini", "Syrie", "Tadjikistan", "Taïwan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental", "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu", "Vatican", "Venezuela", "Viêt Nam", "Yémen", "Zambie", "Zimbabwe"
]));

interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  allowCustom?: boolean;
  required?: boolean;
}

function SearchableDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  allowCustom = false,
  required = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (allowCustom && search !== value) {
          onChange(search);
        } else {
          setSearch(value);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [search, value, allowCustom, onChange]);

  // If the user has not typed anything new (search matches the selected value), display the full list.
  // Otherwise, filter options based on the active query.
  const isSearching = search && search !== value;
  const filteredOptions = isSearching
    ? options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "Enter") {
      if (!allowCustom) {
        if (filteredOptions.length > 0 && search !== value) {
          const bestMatch = filteredOptions[0];
          onChange(bestMatch);
          setSearch(bestMatch);
        } else {
          setSearch(value);
        }
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={search}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select(); // Highlight text to allow easy typing/overwriting
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (allowCustom) {
              onChange(e.target.value);
            }
          }}
          className="w-full bg-white rounded-lg p-2.5 pr-8 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
        >
          <ChevronDown className={`h-4 w-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto backdrop-blur-md dark:bg-slate-900 dark:border-slate-700">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                  opt === value ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {opt}
              </button>
            ))
          ) : (
            allowCustom && search.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onChange(search);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold dark:text-blue-400 cursor-pointer"
              >
                Créer : "{search}"
              </button>
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400">Aucun résultat</div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadForm({ onAddLead, commercials, existingLeads }: LeadFormProps) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [societe, setSociete] = useState("");
  const [nomProjet, setNomProjet] = useState("");
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

  // Extract unique companies from existing leads list for autocomplete options
  const uniqueCompanies = Array.from(
    new Set(
      existingLeads
        .map(l => l.societe)
        .filter((s): s is string => !!s && s.trim().length > 0)
    )
  );

  const handleSocieteChange = (val: string) => {
    setSociete(val);

    // Look for matching company to auto-fill address info
    const matched = existingLeads.find(l => l.societe?.toLowerCase() === val.toLowerCase());
    if (matched) {
      if (matched.adresse) setAdresse(matched.adresse);
      if (matched.ville) setVille(matched.ville);
      if (matched.pays) setPays(matched.pays);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !societe || !email) {
      alert("Veuillez remplir les champs obligatoires (Société, Email, Prénom, Nom).");
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
      notes: notes || "Aucune note complémentaire lors de la création.",
      nomProjet: nomProjet || `Projet chez ${societe}`
    });

    setNom("");
    setPrenom("");
    setSociete("");
    setNomProjet("");
    setEmail("");
    setTelephone("");
    setAdresse("");
    setVille("");
    setNotes("");

    setFeedback("Le prospect a été créé avec succès et enregistré dans le pipeline !");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="text-slate-800 w-full" id="lead-form-root">
      {feedback && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-450">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* SECTION 1: SOCIÉTÉ / ORGANISATION */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 dark:bg-slate-900/40 dark:border-slate-800">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-blue-600" />
            1. Informations de l'Entreprise / Organisation
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Société / Organisation *</label>
              <SearchableDropdown
                value={societe}
                onChange={handleSocieteChange}
                options={uniqueCompanies}
                placeholder="Ex: TechSolutions S.A."
                allowCustom={true}
                required={true}
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Nom du Projet / Offre *</label>
              <input
                type="text"
                required
                placeholder="Ex: Refonte Site E-commerce"
                value={nomProjet}
                onChange={(e) => setNomProjet(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Pays d'origine</label>
              <SearchableDropdown
                value={pays}
                onChange={(val) => setPays(val)}
                options={ALL_COUNTRIES}
                placeholder="Choisissez un pays"
                allowCustom={false}
                required={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Ville d'origine</label>
              <input
                type="text"
                placeholder="Ex: Casablanca, Paris..."
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Adresse physique complète</label>
              <input
                type="text"
                placeholder="Ex: Boulevard de la Corniche"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT PRINCIPAL */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 dark:bg-slate-900/40 dark:border-slate-800">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-600" />
            2. Contact Principal / Interlocuteur
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Prénom *</label>
              <input
                type="text"
                required
                placeholder="Ex: Youssef"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Nom de famille *</label>
              <input
                type="text"
                required
                placeholder="Ex: Alami"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Adresse email *</label>
              <input
                type="email"
                required
                placeholder="Ex: y.alami@societe.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Téléphone</label>
              <input
                type="text"
                placeholder="Ex: +212 600-000000"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: DÉTAILS PIPELINE & ASSIGNATION */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 dark:bg-slate-900/40 dark:border-slate-800">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BadgeCent className="h-3.5 w-3.5 text-blue-600" />
            3. Suivi Commercial & Assignation
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Budget Estimé (MAD) *</label>
              <input
                type="number"
                required
                min={1}
                value={valeurEstimee}
                onChange={(e) => setValeurEstimee(Number(e.target.value))}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
            
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Priorité commerciale</label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as LeadPriority)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              >
                <option value={LeadPriority.LOW}>Basse</option>
                <option value={LeadPriority.MEDIUM}>Moyenne</option>
                <option value={LeadPriority.HIGH}>Haute</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Source d'acquisition</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              >
                {Object.values(LeadSource).map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Attribuer à un commercial</label>
              <select
                value={commercialId}
                onChange={(e) => setCommercialId(e.target.value)}
                className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 cursor-pointer dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              >
                <option value="">-- Non attribué (Pool commun) --</option>
                {commercials.map((comm) => (
                  <option key={comm.id} value={comm.id}>{comm.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Commentaire initial / Besoin</label>
            <textarea
              rows={2}
              placeholder="Renseignez l'expression de besoin du prospect, l'historique rapide de la prise de contact..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white rounded-lg p-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Créer le prospect
          </button>
        </div>
      </form>
    </div>
  );
}
