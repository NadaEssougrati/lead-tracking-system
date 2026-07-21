import React from "react";
import { UserCheck, Shield, UserX, RefreshCw } from "lucide-react";
import { UserProfile, NewUserFormState, EditUserFormState } from "../../types";
import { AdminUserForms } from "./AdminUserForms";

interface AdminUsersProps {
  users: UserProfile[];
  loadingUsers: boolean;
  currentUserId: number;
  isCreatingUser: boolean;
  editingUser: UserProfile | null;
  newUserForm: NewUserFormState;
  newUserErrors: Record<string, string>;
  editUserForm: EditUserFormState;
  editUserErrors: Record<string, string>;
  onRefresh: () => void;
  onToggleCreate: () => void;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onNewUserFormChange: (data: Partial<NewUserFormState>) => void;
  onEditUserFormChange: (data: Partial<EditUserFormState>) => void;
  onAdminCreateUser: (e: React.FormEvent) => void;
  onAdminUpdateUser: (e: React.FormEvent) => void;
  onAdminToggleStatus: (user: UserProfile) => void;
  onAdminChangeRole: (user: UserProfile, nextRole: string) => void;
  onAdminDeleteUser: (userId: number, username: string) => void;
  onStartEditing: (user: UserProfile) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  users,
  loadingUsers,
  currentUserId,
  isCreatingUser,
  editingUser,
  newUserForm,
  newUserErrors,
  editUserForm,
  editUserErrors,
  onRefresh,
  onToggleCreate,
  onCloseCreate,
  onCloseEdit,
  onNewUserFormChange,
  onEditUserFormChange,
  onAdminCreateUser,
  onAdminUpdateUser,
  onAdminToggleStatus,
  onAdminChangeRole,
  onAdminDeleteUser,
  onStartEditing,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Dynamic Action Header */}
      <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/40 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-dracl-sub dark:bg-drac-sub shrink-0">
        <h2 className="text-sm font-display font-bold uppercase tracking-tight flex items-center gap-2">
          <span>Annuaire des utilisateurs</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-dracl-card dark:bg-drac-card text-dracl-muted dark:text-drac-comment font-mono font-medium">
            {users.length} Enregistrements
          </span>
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={loadingUsers}
            className="blunt-button blunt-button-secondary text-[11px] px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={onToggleCreate}
            className="blunt-button blunt-button-primary text-[11px] px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-[0_2px_8px_rgba(144,122,169,0.15)]"
          >
            <span>{isCreatingUser ? "[-] Fermer" : "[+] Nouvel utilisateur"}</span>
          </button>
        </div>
      </div>

      {/* Top Stats Grid Inside Work Area */}
      <div className="px-4 pt-4 shrink-0 grid grid-cols-3 gap-4 font-mono">
        <div className="blunt-card p-4 flex justify-between items-center shadow-[0_4px_15px_rgba(0,0,0,0.01)] bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40">
          <div>
            <p className="text-[10px] text-dracl-muted dark:text-drac-comment font-bold uppercase leading-none tracking-wider">
              TOTAL UTILISATEURS
            </p>
            <p className="text-xl font-display font-black mt-1 text-dracl-fg dark:text-white">
              {users.length}
            </p>
          </div>
          <UserCheck className="w-5 h-5 text-rosepine-iris shrink-0 hidden sm:block" />
        </div>
        <div className="blunt-card p-4 flex justify-between items-center shadow-[0_4px_15px_rgba(0,0,0,0.01)] bg-rosepine-pine/5 border border-rosepine-pine/20">
          <div>
            <p className="text-[10px] text-rosepine-pine font-bold uppercase leading-none tracking-wider">
              COMPTES ACTIFS
            </p>
            <p className="text-xl font-display font-black mt-1 text-rosepine-pine">
              {users.filter((u) => u.status === "active").length}
            </p>
          </div>
          <Shield className="w-5 h-5 text-rosepine-pine shrink-0 hidden sm:block" />
        </div>
        <div className="blunt-card p-4 flex justify-between items-center shadow-[0_4px_15px_rgba(0,0,0,0.01)] bg-rosepine-love/5 border border-rosepine-love/20">
          <div>
            <p className="text-[10px] text-rosepine-love font-bold uppercase leading-none tracking-wider">
              COMPTES SUSPENDUS
            </p>
            <p className="text-xl font-display font-black mt-1 text-rosepine-love">
              {users.filter((u) => u.status === "disabled").length}
            </p>
          </div>
          <UserX className="w-5 h-5 text-rosepine-love shrink-0 hidden sm:block" />
        </div>
      </div>

      {/* Split Work View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* Form Control Block on left */}
        <AdminUserForms
          currentUserId={currentUserId}
          isCreatingUser={isCreatingUser}
          editingUser={editingUser}
          newUserForm={newUserForm}
          newUserErrors={newUserErrors}
          editUserForm={editUserForm}
          editUserErrors={editUserErrors}
          onCloseCreate={onCloseCreate}
          onCloseEdit={onCloseEdit}
          onNewUserFormChange={onNewUserFormChange}
          onEditUserFormChange={onEditUserFormChange}
          onAdminCreateUser={onAdminCreateUser}
          onAdminUpdateUser={onAdminUpdateUser}
        />

        {/* Database Directory Table (Spans remaining width) */}
        <div className="flex-1 blunt-card bg-dracl-card dark:bg-drac-card border border-neutral-200/60 dark:border-neutral-800/40 p-4 flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h3 className="font-display font-bold text-xs uppercase border-b border-neutral-200/60 dark:border-neutral-800/40 pb-3 mb-3 flex justify-between items-center tracking-wider shrink-0 text-dracl-fg dark:text-white">
            <span>Comptes utilisateurs</span>
            <span className="text-[10px] font-mono font-medium lowercase text-dracl-muted dark:text-drac-comment">
              affichage de {users.length} comptes
            </span>
          </h3>

          {loadingUsers && users.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl m-4">
              <RefreshCw className="animate-spin w-8 h-8 text-rosepine-iris mb-2" />
              <p className="text-[10px] font-mono uppercase text-dracl-muted dark:text-drac-comment">
                Chargement des données...
              </p>
            </div>
          ) : (
            <div className="flex-1 blunt-table-container">
              <table className="blunt-table">
                <thead className="blunt-table-thead">
                  <tr>
                    <th className="blunt-th">ID</th>
                    <th className="blunt-th">Utilisateur / Identifiants</th>
                    <th className="blunt-th">Rôle système</th>
                    <th className="blunt-th">Statut</th>
                    <th className="blunt-th text-center">Contrôles</th>
                  </tr>
                </thead>
                <tbody className="blunt-table-tbody">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`blunt-tr ${u.status === "disabled" ? "bg-rosepine-love/5" : ""}`}
                    >
                      <td className="blunt-td font-mono text-dracl-muted dark:text-drac-comment">
                        #{u.id}
                      </td>
                      <td className="blunt-td">
                        <p className="font-bold text-dracl-fg dark:text-white">{u.username}</p>
                        <p className="text-[10px] text-dracl-muted dark:text-drac-comment lowercase leading-tight">
                          {u.email}
                        </p>
                      </td>
                      <td className="blunt-td">
                        <select
                          value={u.role}
                          onChange={(e) => onAdminChangeRole(u, e.target.value)}
                          disabled={u.id === currentUserId}
                          className="bg-dracl-sub dark:bg-drac-sub border border-neutral-200/60 dark:border-neutral-800/40 p-1 rounded-md text-[10px] font-bold uppercase focus:outline-none cursor-pointer disabled:opacity-50 text-dracl-fg dark:text-drac-fg"
                        >
                          <option value="user">UTILISATEUR</option>
                          <option value="marketing">MARKETING</option>
                          <option value="commercial">COMMERCIAL</option>
                          <option value="manager">RESPONSABLE</option>
                          <option value="admin">ADMINISTRATEUR</option>
                        </select>
                      </td>
                      <td className="blunt-td">
                        {u.status === "active" ? (
                          <span className="blunt-badge-success">● Actif</span>
                        ) : (
                          <span className="blunt-badge-danger">■ Suspendu</span>
                        )}
                      </td>
                      <td className="blunt-td">
                        <div className="flex gap-2 justify-center items-center font-mono text-[10px]">
                          <button
                            onClick={() => onAdminToggleStatus(u)}
                            disabled={u.id === currentUserId}
                            className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-dracl-fg dark:text-drac-fg font-bold uppercase cursor-pointer disabled:opacity-30"
                          >
                            {u.status === "active" ? "Arrêter" : "Démarrer"}
                          </button>
                          <button
                            onClick={() => onStartEditing(u)}
                            className="px-2 py-1 rounded border border-rosepine-gold/30 bg-rosepine-gold/10 hover:bg-rosepine-gold hover:text-white text-rosepine-gold font-bold uppercase cursor-pointer"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => onAdminDeleteUser(u.id, u.username)}
                            disabled={u.id === currentUserId}
                            className="px-2 py-1 rounded border border-rosepine-love/30 bg-rosepine-love/10 hover:bg-rosepine-love hover:text-white text-rosepine-love font-bold uppercase cursor-pointer disabled:opacity-30"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
