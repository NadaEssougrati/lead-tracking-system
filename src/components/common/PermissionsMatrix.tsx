import React from "react";
import { Shield } from "lucide-react";

interface PermissionsMatrixProps {
  userRole?: string;
  isUserView?: boolean;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  userRole,
  isUserView = false,
}) => {
  const matrixItems = [
    {
      capability: isUserView ? "Edit / Create / Delete Accounts" : "Créer / Modifier / Supprimer des comptes",
      user: false,
      marketing: false,
      commercial: false,
      manager: false,
      admin: true,
    },
    {
      capability: isUserView ? "View System Security Logs" : "Consulter les journaux de sécurité",
      user: false,
      marketing: false,
      commercial: false,
      manager: false,
      admin: true,
    },
    {
      capability: isUserView ? "Configure Database Mappings" : "Configurer la base de données",
      user: false,
      marketing: false,
      commercial: false,
      manager: false,
      admin: true,
    },
    {
      capability: isUserView ? "Reassign & Delegate Leads" : "Réassigner et déléguer des pistes (Leads)",
      user: false,
      marketing: false,
      commercial: false,
      manager: true,
      admin: true,
    },
    {
      capability: isUserView ? "Ingest & Qualify New Leads" : "Importer et qualifier de nouvelles pistes (Leads)",
      user: false,
      marketing: true,
      commercial: false,
      manager: true,
      admin: true,
    },
    {
      capability: isUserView ? "Alter Opportunity Sales Status" : "Modifier l'état d'avancement des ventes",
      user: false,
      marketing: false,
      commercial: true,
      manager: true,
      admin: true,
    },
    {
      capability: isUserView ? "Personal Account Log Stream" : "Consulter son propre flux d'activité",
      user: true,
      marketing: true,
      commercial: true,
      manager: true,
      admin: true,
    },
  ];

  const getCellClass = (roleName: string) => {
    if (isUserView && userRole === roleName) {
      return "bg-rosepine-iris/10 font-bold";
    }
    return "";
  };

  return (
    <div className={`flex-1 flex flex-col p-4 md:p-6 overflow-y-auto ${isUserView ? "max-w-4xl w-full mx-auto" : ""}`}>
      <div className="blunt-card max-w-4xl w-full mx-auto bg-dracl-card dark:bg-drac-card p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-neutral-200/60 dark:border-neutral-800/40">
        <h2 className="text-sm font-display font-bold uppercase border-b border-neutral-200/60 dark:border-neutral-800/40 pb-3 mb-3 flex items-center gap-2 text-dracl-fg dark:text-white">
          <Shield className="w-4 h-4 text-rosepine-gold" />
          <span>Matrice des habilitations système</span>
        </h2>
        <p className="text-xs text-dracl-muted dark:text-drac-comment uppercase leading-relaxed mb-6 font-bold font-mono">
          {isUserView && userRole
            ? `Comparez votre niveau d'habilitation (${userRole.toUpperCase()}) avec les différents vecteurs d'autorisation standards.`
            : "Habilitations opérationnelles associées aux rôles de sécurité. Les niveaux d'accès sont audités et vérifiés de manière stricte côté serveur."}
        </p>

        <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-800/40">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-dracl-sub dark:bg-drac-sub text-dracl-muted dark:text-drac-comment text-[10px] uppercase border-b border-neutral-200/60 dark:border-neutral-800/40">
                <th className="p-3">{isUserView ? "Operational Capability" : "Habilitation opérationnelle"}</th>
                <th className="p-3 text-center">{isUserView ? "User" : "Utilisateur"}</th>
                <th className="p-3 text-center">Marketing</th>
                <th className="p-3 text-center">Commercial</th>
                <th className="p-3 text-center">{isUserView ? "Manager" : "Responsable"}</th>
                <th className="p-3 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/40 text-dracl-fg dark:text-drac-fg">
              {matrixItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold">{item.capability}</td>
                  
                  <td className={`p-3 text-center ${getCellClass("user") || (item.user ? "bg-rosepine-pine/5" : "bg-rosepine-love/5")}`}>
                    {item.user ? (
                      <span className="text-rosepine-pine font-bold uppercase text-[10px] tracking-wide bg-rosepine-pine/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✓ Yes" : "✓ Oui"}
                      </span>
                    ) : (
                      <span className="text-rosepine-love font-bold uppercase text-[10px] tracking-wide bg-rosepine-love/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✗ No" : "✗ Non"}
                      </span>
                    )}
                  </td>

                  <td className={`p-3 text-center ${getCellClass("marketing") || (item.marketing ? "bg-rosepine-pine/5" : "bg-rosepine-love/5")}`}>
                    {item.marketing ? (
                      <span className="text-rosepine-pine font-bold uppercase text-[10px] tracking-wide bg-rosepine-pine/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✓ Yes" : "✓ Oui"}
                      </span>
                    ) : (
                      <span className="text-rosepine-love font-bold uppercase text-[10px] tracking-wide bg-rosepine-love/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✗ No" : "✗ Non"}
                      </span>
                    )}
                  </td>

                  <td className={`p-3 text-center ${getCellClass("commercial") || (item.commercial ? "bg-rosepine-pine/5" : "bg-rosepine-love/5")}`}>
                    {item.commercial ? (
                      <span className="text-rosepine-pine font-bold uppercase text-[10px] tracking-wide bg-rosepine-pine/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✓ Yes" : "✓ Oui"}
                      </span>
                    ) : (
                      <span className="text-rosepine-love font-bold uppercase text-[10px] tracking-wide bg-rosepine-love/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✗ No" : "✗ Non"}
                      </span>
                    )}
                  </td>

                  <td className={`p-3 text-center ${getCellClass("manager") || (item.manager ? "bg-rosepine-pine/5" : "bg-rosepine-love/5")}`}>
                    {item.manager ? (
                      <span className="text-rosepine-pine font-bold uppercase text-[10px] tracking-wide bg-rosepine-pine/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✓ Yes" : "✓ Oui"}
                      </span>
                    ) : (
                      <span className="text-rosepine-love font-bold uppercase text-[10px] tracking-wide bg-rosepine-love/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✗ No" : "✗ Non"}
                      </span>
                    )}
                  </td>

                  <td className={`p-3 text-center ${getCellClass("admin") || (item.admin ? "bg-rosepine-pine/5" : "bg-rosepine-love/5")}`}>
                    {item.admin ? (
                      <span className="text-rosepine-pine font-bold uppercase text-[10px] tracking-wide bg-rosepine-pine/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✓ Yes" : "✓ Oui"}
                      </span>
                    ) : (
                      <span className="text-rosepine-love font-bold uppercase text-[10px] tracking-wide bg-rosepine-love/10 px-2 py-0.5 rounded-full inline-block">
                        {isUserView ? "✗ No" : "✗ Non"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
