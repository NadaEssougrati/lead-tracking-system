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
  UserRound,
  Eye,
  EyeOff,
  Key,
  Sparkles,
  RefreshCw,
  Pencil,
  X
} from "lucide-react";
import { User, Role } from "../types";
import { usePreferences } from "../AppPreferences";

interface UserManagementProps {
  users: User[];
  activeUser: User;
  onUpdateUserStatus: (id: string, active: boolean) => void;
  onUpdateUser?: (id: string, data: { nom?: string; email?: string; telephone?: string; role?: Role; motDePasse?: string }) => Promise<void>;
  onAddUser: (user: Omit<User, "id"> & { motDePasse: string }) => Promise<void>;
  onUpdateProfile: (data: { nom?: string; email?: string; telephone?: string; avatar?: string }) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function UserManagement({
  users,
  activeUser,
  onUpdateUserStatus,
  onUpdateUser,
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

  // Password Visibility and Generator States
  const [showPassword, setShowPassword] = useState(false);
  const [showGenPopup, setShowGenPopup] = useState(false);
  const [genLength, setGenLength] = useState(12);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genLowercase, setGenLowercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const handleQuickNumericGen = () => {
    const digits = "0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += digits[Math.floor(Math.random() * 10)];
    }
    setMotDePasse(pwd);
    setShowPassword(true);
  };

  const handleComplexGen = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    let chars = "";
    if (genUppercase) chars += upper;
    if (genLowercase) chars += lower;
    if (genNumbers) chars += nums;
    if (genSymbols) chars += syms;
    
    if (!chars) chars = nums;
    
    let pwd = "";
    if (genUppercase) pwd += upper[Math.floor(Math.random() * upper.length)];
    if (genLowercase) pwd += lower[Math.floor(Math.random() * lower.length)];
    if (genNumbers) pwd += nums[Math.floor(Math.random() * nums.length)];
    if (genSymbols) pwd += syms[Math.floor(Math.random() * syms.length)];
    
    const remaining = genLength - pwd.length;
    for (let i = 0; i < remaining; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const shuffled = pwd.split("").sort(() => 0.5 - Math.random()).join("");
    setMotDePasse(shuffled);
    setShowPassword(true);
    setShowGenPopup(false);
  };



  // Edit User Form States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [editRole, setEditRole] = useState<Role>(Role.COMMERCIAL);
  const [editMotDePasse, setEditMotDePasse] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setEditNom(u.nom);
    setEditEmail(u.email);
    setEditTelephone(u.telephone || "");
    setEditRole(u.role);
    setEditMotDePasse("");
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !onUpdateUser) return;
    setIsSavingEdit(true);
    try {
      await onUpdateUser(editingUser.id, {
        nom: editNom,
        email: editEmail,
        telephone: editTelephone,
        role: editRole,
        ...(editMotDePasse ? { motDePasse: editMotDePasse } : {})
      });
      setEditingUser(null);
    } catch (err: any) {
      alert("Erreur lors de la mise à jour de l'utilisateur : " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

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
                    {isAdmin && <th className="pb-2.5 text-right">Actions</th>}
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
                      {isAdmin && (
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer animate-fade-in"
                            title="Modifier les informations"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      )}
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

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-500 font-bold uppercase text-[9px]">{t("team.tempPassword")}</label>
                    {isAdmin && (
                      <div className="flex items-center gap-2 text-[10px]">
                        {/* Quick 8-Numbers Gen Button */}
                        <button
                          type="button"
                          onClick={handleQuickNumericGen}
                          className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer flex items-center gap-0.5"
                          title="Générer rapidement un code à 8 chiffres"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Code 8-chiffres</span>
                        </button>
                        
                        <span>|</span>
                        
                        {/* Custom Gen Settings Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowGenPopup(!showGenPopup)}
                          className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer flex items-center gap-0.5 relative"
                        >
                          <Key className="h-3 w-3 text-slate-400" />
                          <span>Générer...</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Password Gen settings dropdown overlay popup */}
                  {showGenPopup && (
                    <div className="absolute right-0 top-6 z-50 w-64 bg-white border border-slate-200 p-4 rounded-lg shadow-lg text-slate-700 space-y-3 animate-fade-in dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                      <div className="font-bold text-xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-blue-500" />
                        <span>Générateur de mot de passe</span>
                      </div>
                      
                      {/* Length Slider */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1 font-semibold">
                          <span>Longueur :</span>
                          <span className="font-bold text-blue-600">{genLength}</span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={32}
                          value={genLength}
                          onChange={(e) => setGenLength(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genUppercase}
                            onChange={(e) => setGenUppercase(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Majuscules</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genLowercase}
                            onChange={(e) => setGenLowercase(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Minuscules</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genNumbers}
                            onChange={(e) => setGenNumbers(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Chiffres</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genSymbols}
                            onChange={(e) => setGenSymbols(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Symboles</span>
                        </label>
                      </div>

                      {/* Generate Button */}
                      <button
                        type="button"
                        onClick={handleComplexGen}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Générer & Appliquer
                      </button>
                    </div>
                  )}

                  {/* Input field with eye icon inside */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      disabled={!isAdmin}
                      placeholder={t("team.passwordHint")}
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      className="w-full bg-slate-50 rounded p-2 pr-9 border border-slate-200 text-slate-800 disabled:opacity-40 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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



        {/* Edit User Modal */}
        {editingUser && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingUser(null);
              }
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer animate-fade-in"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative cursor-default dark:bg-slate-900 dark:border-slate-800">
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="mb-5 flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 grid place-items-center dark:bg-blue-900/20 dark:text-blue-400">
                  <Pencil className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Modifier le Collaborateur</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Mettez à jour les informations du compte.</p>
                </div>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-bold">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-bold">Adresse Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-bold">Rôle Système</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-800 focus:outline-none dark:bg-slate-850 dark:border-slate-700 dark:text-white cursor-pointer font-medium"
                    >
                      <option value={Role.ADMIN}>{Role.ADMIN}</option>
                      <option value={Role.MANAGER}>{Role.MANAGER}</option>
                      <option value={Role.COMMERCIAL}>{Role.COMMERCIAL}</option>
                      <option value={Role.MARKETING}>{Role.MARKETING}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-bold">Téléphone</label>
                    <input
                      type="text"
                      value={editTelephone}
                      onChange={(e) => setEditTelephone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-bold">Nouveau Mot de Passe (Optionnel)</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour ne pas modifier"
                    value={editMotDePasse}
                    onChange={(e) => setEditMotDePasse(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-semibold text-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
