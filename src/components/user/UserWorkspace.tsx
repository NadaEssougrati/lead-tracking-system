import React from "react";
import { Shield, Activity } from "lucide-react";
import { UserProfile } from "../../types";

interface UserWorkspaceProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const UserWorkspace: React.FC<UserWorkspaceProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full blunt-card bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] text-center space-y-6">
        <div className="inline-flex bg-rosepine-iris/10 text-rosepine-iris p-4 rounded-2xl border border-rosepine-iris/20 mx-auto">
          <Shield className="w-12 h-12 text-rosepine-iris animate-pulse mx-auto" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-dracl-muted dark:text-drac-comment bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full inline-block">
            [ ESPACE PERSONNEL SÉCURISÉ ]
          </span>
          <h2 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight text-dracl-fg dark:text-white">
            INTERFACE D'HABILITATION
          </h2>
        </div>

        <div className="border-t border-b border-dashed border-neutral-200 dark:border-neutral-800 py-4 text-left space-y-2.5 font-mono text-xs">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-dracl-muted dark:text-drac-comment font-bold uppercase text-[10px]">
              ID AUTORISÉ :
            </span>
            <span className="col-span-2 font-bold text-dracl-fg dark:text-white">#{currentUser.id}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-dracl-muted dark:text-drac-comment font-bold uppercase text-[10px]">
              NOM D'UTILISATEUR :
            </span>
            <span className="col-span-2 font-bold text-dracl-fg dark:text-white">
              {currentUser.username}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-dracl-muted dark:text-drac-comment font-bold uppercase text-[10px]">
              ADRESSE E-MAIL :
            </span>
            <span className="col-span-2 font-bold text-dracl-fg dark:text-white lowercase">
              {currentUser.email}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-dracl-muted dark:text-drac-comment font-bold uppercase text-[10px]">
              HABILITATION :
            </span>
            <span className="col-span-2 font-mono bg-rosepine-iris/10 text-rosepine-iris px-2.5 py-0.5 rounded uppercase inline-block font-bold w-fit">
              {currentUser.role}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-dracl-muted dark:text-drac-comment font-bold uppercase text-[10px]">
              STATUT SYSTÈME :
            </span>
            <span className="col-span-2 font-mono bg-rosepine-pine/10 text-rosepine-pine px-2.5 py-0.5 rounded uppercase inline-block font-bold w-fit">
              EN LIGNE
            </span>
          </div>
        </div>

        {/* Role clearance details */}
        <div className="rounded-xl border border-rosepine-gold/20 bg-rosepine-gold/5 p-4 text-left">
          <h3 className="font-display font-bold uppercase text-xs border-b border-rosepine-gold/10 pb-2 mb-3 tracking-wider flex items-center gap-1.5 text-rosepine-gold">
            <Activity className="w-4 h-4" />
            <span>SPÉCIFICATION DES ACCÈS SÉCURISÉS</span>
          </h3>

          {currentUser.role === "manager" && (
            <div className="space-y-2 text-xs">
              <p className="font-bold leading-normal text-dracl-fg dark:text-drac-fg">
                Votre profil dispose des droits de{" "}
                <strong className="bg-rosepine-iris/10 text-rosepine-iris px-1.5 rounded">
                  RESPONSABLE
                </strong>
                . Les autorisations côté serveur permettent de :
              </p>
              <ul className="space-y-1 list-inside list-disc font-semibold text-[11px] text-dracl-fg dark:text-drac-fg">
                <li>Importer ou charger des fichiers de pistes (Leads) généraux</li>
                <li>Déléguer des comptes et attribuer des pistes aux agents commerciaux</li>
                <li>Consulter les indicateurs de vente, les pipelines et les graphiques d'activité</li>
                <li>Modifier les variables d'état du workflow des pistes</li>
              </ul>
            </div>
          )}

          {currentUser.role === "commercial" && (
            <div className="space-y-2 text-xs">
              <p className="font-bold leading-normal text-dracl-fg dark:text-drac-fg">
                Votre profil dispose des droits de{" "}
                <strong className="bg-rosepine-iris/10 text-rosepine-iris px-1.5 rounded">
                  COMMERCIAL
                </strong>
                . Les autorisations côté serveur permettent de :
              </p>
              <ul className="space-y-1 list-inside list-disc font-semibold text-[11px] text-dracl-fg dark:text-drac-fg">
                <li>Consulter uniquement les pistes attribuées à votre identifiant d'agent</li>
                <li>Modifier l'état d'avancement et les paramètres de vente des pistes</li>
                <li>Enregistrer des comptes rendus d'interaction (appels, visites, propositions)</li>
                <li>* Accès restreint pour la réattribution des pistes et la suppression d'éléments.</li>
              </ul>
            </div>
          )}

          {currentUser.role === "marketing" && (
            <div className="space-y-2 text-xs">
              <p className="font-bold leading-normal text-dracl-fg dark:text-drac-fg">
                Votre profil dispose des droits de{" "}
                <strong className="bg-rosepine-iris/10 text-rosepine-iris px-1.5 rounded">
                  MARKETING
                </strong>
                . Les autorisations côté serveur permettent de :
              </p>
              <ul className="space-y-1 list-inside list-disc font-semibold text-[11px] text-dracl-fg dark:text-drac-fg">
                <li>Créer de nouvelles fiches de prospects dans la base de données centrale</li>
                <li>Modifier le statut de "Nouveau" à "Qualifié"</li>
                <li>Consulter les statistiques globales des canaux d'acquisition</li>
                <li>* Accès restreint concernant les paramètres tarifaires ou la délégation CRM.</li>
              </ul>
            </div>
          )}

          {currentUser.role === "user" && (
            <div className="space-y-2 text-xs">
              <p className="font-bold leading-normal text-dracl-muted dark:text-drac-comment italic">
                Votre profil dispose actuellement de droits{" "}
                <strong className="bg-neutral-200 dark:bg-neutral-800 text-dracl-fg dark:text-white px-1.5 rounded">
                  UTILISATEUR
                </strong>{" "}
                standards. Aucun module de travail n'est attribué à ce groupe.
              </p>
              <p className="text-[11px] text-dracl-muted dark:text-drac-comment leading-normal">
                Veuillez contacter l'administrateur système pour élever votre habilitation vers un rôle
                de <strong>Responsable</strong>, <strong>Commercial</strong> ou <strong>Marketing</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onLogout}
            className="blunt-button blunt-button-primary px-8 py-3 uppercase font-bold tracking-widest text-xs transition-all cursor-pointer shadow-[0_4px_12px_rgba(144,122,169,0.2)] hover:shadow-none"
          >
            SE DÉCONNECTER
          </button>
        </div>
      </div>
    </div>
  );
};
