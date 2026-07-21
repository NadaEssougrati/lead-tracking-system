import React from "react";
import { Plus, Edit3 } from "lucide-react";
import { UserProfile, NewUserFormState, EditUserFormState } from "../../types";

interface AdminUserFormsProps {
  currentUserId: number;
  isCreatingUser: boolean;
  editingUser: UserProfile | null;
  newUserForm: NewUserFormState;
  newUserErrors: Record<string, string>;
  editUserForm: EditUserFormState;
  editUserErrors: Record<string, string>;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onNewUserFormChange: (data: Partial<NewUserFormState>) => void;
  onEditUserFormChange: (data: Partial<EditUserFormState>) => void;
  onAdminCreateUser: (e: React.FormEvent) => void;
  onAdminUpdateUser: (e: React.FormEvent) => void;
}

export const AdminUserForms: React.FC<AdminUserFormsProps> = ({
  currentUserId,
  isCreatingUser,
  editingUser,
  newUserForm,
  newUserErrors,
  editUserForm,
  editUserErrors,
  onCloseCreate,
  onCloseEdit,
  onNewUserFormChange,
  onEditUserFormChange,
  onAdminCreateUser,
  onAdminUpdateUser,
}) => {
  if (!isCreatingUser && !editingUser) return null;

  return (
    <div className="w-full lg:w-[360px] shrink-0 overflow-y-auto">
      {/* EDITING USER CONTROL CARD */}
      {editingUser && (
        <div className="blunt-card p-5 bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 shadow-[0_4px_25px_rgba(0,0,0,0.04)] mb-4">
          <div className="flex justify-between items-center border-b border-neutral-200/60 dark:border-neutral-800/40 pb-3 mb-4">
            <h3 className="font-display font-bold uppercase text-xs flex items-center gap-1.5 text-dracl-fg dark:text-white">
              <Edit3 className="w-4 h-4 text-rosepine-gold" />
              <span>MODIFIER LE PROFIL #{editingUser.id}</span>
            </h3>
            <button
              onClick={onCloseEdit}
              className="text-[10px] font-bold border border-rosepine-love/30 px-2 py-1 rounded bg-rosepine-love/10 text-rosepine-love hover:bg-rosepine-love hover:text-white transition-all cursor-pointer"
            >
              ANNULER
            </button>
          </div>

          <form onSubmit={onAdminUpdateUser} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                NOM D'UTILISATEUR
              </label>
              <input
                type="text"
                value={editUserForm.username}
                onChange={(e) => onEditUserFormChange({ username: e.target.value })}
                className="blunt-input"
              />
              {editUserErrors.username && (
                <span className="text-[9px] text-rosepine-love font-semibold block mt-1">
                  ▲ {editUserErrors.username}
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                ADRESSE E-MAIL
              </label>
              <input
                type="email"
                value={editUserForm.email}
                onChange={(e) => onEditUserFormChange({ email: e.target.value })}
                className="blunt-input"
              />
              {editUserErrors.email && (
                <span className="text-[9px] text-rosepine-love font-semibold block mt-1">
                  ▲ {editUserErrors.email}
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                RÔLE ASSIGNÉ
              </label>
              <select
                value={editUserForm.role}
                onChange={(e) => onEditUserFormChange({ role: e.target.value })}
                className="blunt-input text-xs"
              >
                <option value="user">UTILISATEUR</option>
                <option value="marketing">MARKETING</option>
                <option value="commercial">COMMERCIAL</option>
                <option value="manager">RESPONSABLE</option>
                <option value="admin">ADMINISTRATEUR</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                STATUT DE L'ACCÈS
              </label>
              <select
                value={editUserForm.status}
                disabled={editingUser.id === currentUserId}
                onChange={(e) => onEditUserFormChange({ status: e.target.value })}
                className="blunt-input text-xs disabled:opacity-50"
              >
                <option value="active">ACTIF</option>
                <option value="disabled">SUSPENDU</option>
              </select>
              {editingUser.id === currentUserId && (
                <span className="text-[8px] text-rosepine-gold font-bold block mt-1 uppercase leading-tight">
                  * Impossible de désactiver votre propre compte administrateur.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full blunt-button blunt-button-primary py-2 text-xs font-bold uppercase tracking-wider"
            >
              ENREGISTRER LES MODIFICATIONS [✓]
            </button>
          </form>
        </div>
      )}

      {/* PROVISION USER CONTROL CARD */}
      {isCreatingUser && (
        <div className="blunt-card p-5 bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center border-b border-neutral-200/60 dark:border-neutral-800/40 pb-3 mb-4">
            <h3 className="font-display font-bold uppercase text-xs flex items-center gap-1.5 text-dracl-fg dark:text-white">
              <Plus className="w-4 h-4 text-rosepine-pine" />
              <span>CRÉER UN NOUVEL UTILISATEUR</span>
            </h3>
            <button
              onClick={onCloseCreate}
              className="text-[10px] font-bold border border-neutral-200 dark:border-neutral-800 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-transparent text-dracl-fg dark:text-drac-fg transition-all cursor-pointer"
            >
              [X]
            </button>
          </div>

          <form onSubmit={onAdminCreateUser} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                NOM D'UTILISATEUR
              </label>
              <input
                type="text"
                placeholder="Ex: agent_commercial_1"
                value={newUserForm.username}
                onChange={(e) => onNewUserFormChange({ username: e.target.value })}
                className="blunt-input"
              />
              {newUserErrors.username && (
                <span className="text-[9px] text-rosepine-love font-semibold block mt-1">
                  ▲ {newUserErrors.username}
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                ADRESSE E-MAIL
              </label>
              <input
                type="email"
                placeholder="agent@example.com"
                value={newUserForm.email}
                onChange={(e) => onNewUserFormChange({ email: e.target.value })}
                className="blunt-input"
              />
              {newUserErrors.email && (
                <span className="text-[9px] text-rosepine-love font-semibold block mt-1">
                  ▲ {newUserErrors.email}
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                MOT DE PASSE INITIAL
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newUserForm.password}
                onChange={(e) => onNewUserFormChange({ password: e.target.value })}
                className="blunt-input"
              />
              {newUserErrors.password && (
                <span className="text-[9px] text-rosepine-love font-semibold block mt-1">
                  ▲ {newUserErrors.password}
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                CONFIGURATION DU RÔLE
              </label>
              <select
                value={newUserForm.role}
                onChange={(e) => onNewUserFormChange({ role: e.target.value })}
                className="blunt-input text-xs"
              >
                <option value="user">UTILISATEUR</option>
                <option value="marketing">MARKETING</option>
                <option value="commercial">COMMERCIAL</option>
                <option value="manager">RESPONSABLE</option>
                <option value="admin">ADMINISTRATEUR</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
                STATUT
              </label>
              <select
                value={newUserForm.status}
                onChange={(e) => onNewUserFormChange({ status: e.target.value })}
                className="blunt-input text-xs"
              >
                <option value="active">ACTIF</option>
                <option value="disabled">SUSPENDU</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full blunt-button blunt-button-primary py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              CRÉER LE COMPTE
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
