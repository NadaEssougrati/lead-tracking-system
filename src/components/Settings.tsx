/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User as UserIcon, 
  Lock, 
  Save, 
  Mail, 
  Phone, 
  Languages, 
  Palette, 
  CheckCircle2,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { User } from "../types";
import { usePreferences } from "../AppPreferences";
import { Language, ThemeMode } from "../i18n";

interface SettingsProps {
  activeUser: User;
  onUpdateProfile: (data: { nom?: string; email?: string; telephone?: string; avatar?: string }) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function Settings({ activeUser, onUpdateProfile, onUpdatePassword }: SettingsProps) {
  const { t, language, setLanguage, theme, setTheme } = usePreferences();
  const [profileNom, setProfileNom] = useState(activeUser.nom);
  const [profileEmail, setProfileEmail] = useState(activeUser.email);
  const [profileTelephone, setProfileTelephone] = useState(activeUser.telephone || "");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  const [prefsFeedback, setPrefsFeedback] = useState<string | null>(null);

  const handleProfileSave = async () => {
    try {
      await onUpdateProfile({ nom: profileNom, email: profileEmail, telephone: profileTelephone });
      setProfileFeedback(t("settings.account.saved"));
      setTimeout(() => setProfileFeedback(null), 3000);
    } catch {
      setProfileFeedback("Impossible de mettre à jour le profil pour le moment.");
      setTimeout(() => setProfileFeedback(null), 3000);
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordFeedback("Les mots de passe doivent correspondre.");
      setTimeout(() => setPasswordFeedback(null), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback("Le mot de passe doit contenir au moins 6 caractères.");
      setTimeout(() => setPasswordFeedback(null), 3000);
      return;
    }

    try {
      await onUpdatePassword(currentPassword, newPassword);
      setPasswordFeedback(t("settings.password.saved"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordFeedback(null), 3000);
    } catch {
      setPasswordFeedback("Erreur lors de la modification du mot de passe.");
      setTimeout(() => setPasswordFeedback(null), 3000);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setPrefsFeedback(t("settings.theme.saved"));
    setTimeout(() => setPrefsFeedback(null), 3000);
  };

  const handleThemeSelect = (thm: ThemeMode) => {
    setTheme(thm);
    setPrefsFeedback(t("settings.theme.saved"));
    setTimeout(() => setPrefsFeedback(null), 3000);
  };

  const languages: { code: Language; label: string }[] = [
    { code: "fr", label: t("settings.language.fr") },
    { code: "en", label: t("settings.language.en") },
    { code: "ar", label: t("settings.language.ar") },
  ];

  const themes: { code: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { code: "light", label: t("settings.theme.light"), icon: <Sun className="h-5 w-5" /> },
    { code: "dark", label: t("settings.theme.dark"), icon: <Moon className="h-5 w-5" /> },
    { code: "system", label: t("settings.theme.system"), icon: <Monitor className="h-5 w-5" /> },
  ];

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] text-slate-850" id="settings-root">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-950 flex items-center gap-2">
          <Palette className="h-6 w-6 text-blue-600" />
          {t("settings.title")}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Account Settings Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">{t("settings.account.title")}</p>
              <p className="text-[11px] text-slate-500">{t("settings.account.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.account.name")}</label>
              <input
                type="text"
                value={profileNom}
                onChange={(e) => setProfileNom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.account.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.account.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={profileTelephone}
                  onChange={(e) => setProfileTelephone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleProfileSave}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t("settings.account.save")}
            </button>

            {profileFeedback && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {profileFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Password Settings Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 grid place-items-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">{t("settings.password.title")}</p>
              <p className="text-[11px] text-slate-500">{t("settings.password.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.password.current")}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.password.new")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.password.confirm")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handlePasswordSave}
              className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-white font-semibold text-sm hover:bg-slate-700 transition"
            >
              {t("settings.password.save")}
            </button>

            {passwordFeedback && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {passwordFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Language Preference Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">{t("settings.language.title")}</p>
              <p className="text-[11px] text-slate-500">{t("settings.language.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {languages.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700"
                  }`}
                >
                  <span className="font-semibold text-sm">{lang.label}</span>
                  {isActive && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Preference Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">{t("settings.theme.title")}</p>
              <p className="text-[11px] text-slate-500">{t("settings.theme.subtitle")}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themes.map((thm) => {
              const isActive = theme === thm.code;
              return (
                <button
                  key={thm.code}
                  type="button"
                  onClick={() => handleThemeSelect(thm.code)}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 text-slate-600"
                  }`}
                >
                  <span className={isActive ? "text-amber-600" : "text-slate-500"}>{thm.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight">{thm.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {prefsFeedback && (
        <p className="mt-6 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {prefsFeedback}
        </p>
      )}
    </div>
  );
}
