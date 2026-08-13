import React, { useState, useEffect } from "react";
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
import { getEmailConfig, testEmailConfig } from "../api";

interface SettingsProps {
  activeUser: User;
  onUpdateProfile: (data: { 
    nom?: string; 
    email?: string; 
    telephone?: string; 
    avatar?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
  }) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function Settings({ activeUser, onUpdateProfile, onUpdatePassword }: SettingsProps) {
  const { t, language, setLanguage, theme, setTheme } = usePreferences();
  const [profileNom, setProfileNom] = useState(activeUser.nom);
  const [profileEmail, setProfileEmail] = useState(activeUser.email);
  const [profileTelephone, setProfileTelephone] = useState(activeUser.telephone || "");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // SMTP state
  const [emailProvider, setEmailProvider] = useState<"resend" | "smtp">("resend");
  const [smtpHost, setSmtpHost] = useState(activeUser.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(activeUser.smtpPort ? String(activeUser.smtpPort) : "587");
  const [smtpUser, setSmtpUser] = useState(activeUser.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState(activeUser.smtpPass || "");
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  const [prefsFeedback, setPrefsFeedback] = useState<string | null>(null);

  useEffect(() => {
    getEmailConfig()
      .then(res => {
        if (res) {
          setEmailProvider(res.emailProvider || "smtp");
        }
      })
      .catch(err => {
        console.error("Failed to load email config inside Settings page:", err);
      });
  }, []);

  const handleSmtpSave = async () => {
    setSmtpFeedback(null);
    if (!smtpHost || !smtpUser || !smtpPass) {
      setSmtpFeedback({ type: "error", msg: "L'hôte, l'utilisateur et le mot de passe sont requis." });
      return;
    }
    setIsSavingSmtp(true);
    try {
      await onUpdateProfile({
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpUser,
        smtpPass
      });
      setSmtpFeedback({ type: "success", msg: "Vos paramètres SMTP ont été enregistrés avec succès !" });
      setTimeout(() => setSmtpFeedback(null), 3000);
    } catch (err: any) {
      setSmtpFeedback({ type: "error", msg: err.message || "Erreur de sauvegarde." });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSmtpTest = async () => {
    setSmtpFeedback(null);
    setIsTestingSmtp(true);
    try {
      const res = await testEmailConfig({ emailProvider: "smtp" });
      if (res && res.success) {
        setSmtpFeedback({ type: "success", msg: "Connexion SMTP individuelle réussie !" });
      } else {
        setSmtpFeedback({ type: "error", msg: res ? res.message : "Échec de connexion SMTP." });
      }
    } catch (err: any) {
      setSmtpFeedback({ type: "error", msg: err.message || "Erreur de test SMTP." });
    } finally {
      setIsTestingSmtp(false);
    }
  };

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
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850 dark:bg-slate-950" id="settings-root">
      <div className="max-w-7xl mx-auto w-full">

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

        {/* Individual SMTP Configuration Card */}
        {emailProvider === "smtp" && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center dark:bg-blue-900/20 dark:text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-sm dark:text-white">Configuration SMTP Messagerie</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Configurez vos identifiants d'envoi SMTP personnels.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Serveur SMTP (Host)</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Port</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Email d'authentification</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="votre.adresse@gmail.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Mot de passe SMTP / d'application</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="Saisir le mot de passe d'application"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSmtpSave}
                  disabled={isSavingSmtp}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSmtp ? "Sauvegarde..." : "Sauvegarder"}
                </button>
                <button
                  type="button"
                  onClick={handleSmtpTest}
                  disabled={isTestingSmtp}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-semibold text-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  {isTestingSmtp ? "Vérification..." : "Tester"}
                </button>
              </div>

              {smtpFeedback && (
                <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                  smtpFeedback.type === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                    : "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
                }`}>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{smtpFeedback.msg}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
    </div>
  );
}
