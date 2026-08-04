/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
import React, { useState } from "react";
import { 
  Users, 
  Settings, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  Plus, 
  Mail,
  Phone,
  Building,
  UserRound
} from "lucide-react";
import { User, Role } from "../types";
import { usePreferences } from "../AppPreferences";

interface UserManagementProps {
  users: User[];
  activeUser: User;
  onUpdateUserStatus: (id: string, active: boolean) => void;
  onAddUser: (user: Omit<User, "id"> & { motDePasse: string }) => Promise<void>;
  onUpdateProfile: (data: { nom?: string; email?: string; telephone?: string; avatar?: string }) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function UserManagement({
  users,
  activeUser,
  onUpdateUserStatus,
  onAddUser,
  onUpdateProfile,
  onUpdatePassword
}: UserManagementProps) {
  const { t } = usePreferences();
  const isAdmin = activeUser.role === Role.ADMIN;

  // Profile editing state removed from équipe tab

  // Profile and password update handlers are only used in settings, not in équipe.

  // New User Form States
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.COMMERCIAL);
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  // CRM Config Parameter States
  const [leadSources, setLeadSources] = useState([
    "Site web", "Réseaux sociaux", "Recommandation", "Emailing", "Salon professionnel", "Appel téléphonique"
  ]);
  const [newSource, setNewSource] = useState("");

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email || !motDePasse) return;

    await onAddUser({
      nom,
      email,
      role,
      telephone: telephone || "+212 600-0000",
      motDePasse,
      actif: true
    });

    setNom("");
    setEmail("");
    setTelephone("");
    setMotDePasse("");
alert(`${t("team.successMessage")} ${nom} (${role}) ${t("team.successMessage2")}`);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim()) return;
    setLeadSources([...leadSources, newSource.trim()]);
    setNewSource("");
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850 dark:bg-slate-950" id="user-management-root">
      <div className="max-w-7xl mx-auto w-full">
      
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl mb-6 flex items-start gap-3 text-xs leading-relaxed shadow-xs">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
<span className="font-bold">{t("team.restrictedTitle")}</span> {t("team.restrictedText")} <strong>{activeUser.role}</strong>. {t("team.restrictedText2")}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: User list and addition (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* User List Table */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
<Users className="h-4.5 w-4.5 text-blue-600" />
              {t("team.registry")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-2.5">{t("team.colUser")}</th>
                    <th className="pb-2.5">{t("team.colEmail")}</th>
                    <th className="pb-2.5">{t("team.colRole")}</th>
                    <th className="pb-2.5 text-center">{t("team.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserRound className="h-3.5 w-3.5" />
                        </div>
                        {u.nom}
                      </td>
                      <td className="py-3 text-slate-500">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          u.role === Role.ADMIN 
                            ? "bg-rose-50 text-rose-600 border-rose-200" 
                            : u.role === Role.MANAGER 
                            ? "bg-amber-50 text-amber-600 border-amber-200" 
                            : u.role === Role.MARKETING 
                            ? "bg-purple-50 text-purple-600 border-purple-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          disabled={!isAdmin || u.id === activeUser.id}
                          onClick={() => onUpdateUserStatus(u.id, !u.actif)}
                          className={`p-1 rounded transition-colors ${
                            !isAdmin || u.id === activeUser.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
{u.actif ? (
                            <span className="text-emerald-600 flex items-center justify-center gap-1 font-bold text-[10px]">
                              <ToggleRight className="h-5 w-5 text-emerald-500" /> {t("team.active")}
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center justify-center gap-1 font-bold text-[10px]">
                              <ToggleLeft className="h-5 w-5 text-rose-400" /> {t("team.suspended")}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Form (Conditional) */}
          {isAdmin && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
<Plus className="h-4.5 w-4.5 text-blue-600" />
                {t("team.createTitle")}
              </h3>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">{t("team.fullName")}</label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      placeholder="Ex: Nada Amrani"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">{t("team.email")}</label>
                    <input
                      type="email"
                      required
                      disabled={!isAdmin}
                      placeholder="Ex: n.amrani@leedpro.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">{t("team.tempPassword")}</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    disabled={!isAdmin}
                    placeholder={t("team.passwordHint")}
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    className="w-full bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">{t("team.systemRole")}</label>
                    <select
                      disabled={!isAdmin}
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 disabled:opacity-40 cursor-pointer focus:bg-white focus:outline-none"
                    >
                      <option value={Role.ADMIN}>{Role.ADMIN}</option>
                      <option value={Role.MANAGER}>{Role.MANAGER}</option>
                      <option value={Role.COMMERCIAL}>{Role.COMMERCIAL}</option>
                      <option value={Role.MARKETING}>{Role.MARKETING}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase text-[9px]">{t("team.phone")}</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder="Ex: +212 655-0011"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="w-full bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-40 text-white font-bold rounded transition-all uppercase tracking-wide text-[10px]"
                >
                  {t("team.submitBtn")}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Side: Team Summary and Guidance (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
<ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
              {t("team.teamPerformance")}
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              {t("team.teamPerformanceText")}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">{t("team.activeMembers")}</p>
                <p className="text-2xl font-bold text-slate-900">{users.filter((u) => u.actif).length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">{t("team.suspendedAccounts")}</p>
                <p className="text-2xl font-bold text-slate-900">{users.filter((u) => !u.actif).length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">{t("team.configuredRoles")}</p>
                <p className="text-2xl font-bold text-slate-900">{new Set(users.map((u) => u.role)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
<Settings className="h-4.5 w-4.5 text-blue-600" />
              {t("team.crmSettings")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-500 font-bold mb-2 uppercase text-[9px]">{t("team.sources")}</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {leadSources.map((src) => (
                    <span key={src} className="px-2.5 py-1 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-600">
                      {src}
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSource} className="flex gap-2">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder={t("team.sourcePlaceholder")}
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="flex-1 bg-slate-50 rounded p-2 border border-slate-200 text-slate-800 text-xs disabled:opacity-40 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!isAdmin}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-200 font-bold text-xs px-3 rounded text-slate-700"
                  >
                    {t("team.addNewSource")}
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <p className="font-bold text-slate-700 text-[10px] uppercase">{t("team.businessRules")}</p>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-150 text-slate-500">
                  <span>{t("team.inactivityDelay")}</span>
                  <span className="font-bold text-slate-850">4 jours</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-150 text-slate-500">
                  <span>{t("team.minConfidence")}</span>
                  <span className="font-bold text-slate-850">60 %</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
