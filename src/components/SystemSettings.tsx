/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  ShieldAlert,
  Save, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle,
  Play,
  Database,
  Download,
  Upload
} from "lucide-react";
import { usePreferences } from "../AppPreferences";
import { getEmailConfig, saveEmailConfig, testEmailConfig, api } from "../api";

export default function SystemSettings() {
  const { t } = usePreferences();
  
  // Email System Settings state
  const [emailProvider, setEmailProvider] = useState<"resend" | "smtp">("smtp");
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("");
  const [hasResendApiKey, setHasResendApiKey] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);
  const [isTestingEmailConfig, setIsTestingEmailConfig] = useState(false);

  // Business Rules state (persisted locally)
  const [inactivityDelay, setInactivityDelay] = useState(() => localStorage.getItem("sys_inactivity_delay") || "14");
  const [minConfidence, setMinConfidence] = useState(() => localStorage.getItem("sys_min_confidence") || "65");
  const [rulesFeedback, setRulesFeedback] = useState<string | null>(null);

  // Session Settings state (persisted server-side)
  const [sessionLength, setSessionLength] = useState("15m");
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);

  // Load Configurations on mount
  useEffect(() => {
    getEmailConfig()
      .then((res) => {
        if (res) {
          setEmailProvider(res.emailProvider || "smtp");
          setResendFromEmail(res.resendFromEmail || "");
          setHasResendApiKey(res.hasResendApiKey || false);
        }
      })
      .catch((err) => {
        console.error("Failed to load email system settings:", err);
      });

    // Load Session configuration
    api<{ sessionLength: string }>("/system/settings")
      .then((res) => {
        if (res && res.sessionLength) {
          setSessionLength(res.sessionLength);
        }
      })
      .catch((err) => {
        console.error("Failed to load session settings:", err);
      });
  }, []);

  const handleSaveEmailConfig = async () => {
    setEmailFeedback(null);
    if (emailProvider === "resend" && !resendFromEmail) {
      setEmailFeedback({ type: "error", msg: "L'adresse d'expédition Resend est requise." });
      return;
    }
    setIsSavingEmailConfig(true);
    try {
      const res = await saveEmailConfig({
        emailProvider,
        resendFromEmail,
        ...(resendApiKey ? { resendApiKey } : {})
      });
      if (res.success) {
        setHasResendApiKey(res.data.hasResendApiKey);
        setResendApiKey("");
        setEmailFeedback({ type: "success", msg: "Configuration e-mail système enregistrée avec succès !" });
      } else {
        setEmailFeedback({ type: "error", msg: "Erreur de configuration." });
      }
    } catch (err: any) {
      setEmailFeedback({ type: "error", msg: err.message || "Erreur lors de la sauvegarde." });
    } finally {
      setIsSavingEmailConfig(false);
    }
  };

  const handleTestEmailConfig = async () => {
    setEmailFeedback(null);
    setIsTestingEmailConfig(true);
    try {
      const res = await testEmailConfig({
        emailProvider,
        resendFromEmail,
        ...(resendApiKey ? { resendApiKey } : {})
      });
      if (res && res.success) {
        setEmailFeedback({ type: "success", msg: res.message || "Test de connexion réussi !" });
      } else {
        setEmailFeedback({ type: "error", msg: res ? res.message : "Le test de connexion a échoué." });
      }
    } catch (err: any) {
      setEmailFeedback({ type: "error", msg: err.message || "Erreur lors du test de connexion." });
    } finally {
      setIsTestingEmailConfig(false);
    }
  };

  const handleSaveRules = () => {
    localStorage.setItem("sys_inactivity_delay", inactivityDelay);
    localStorage.setItem("sys_min_confidence", minConfidence);
    setRulesFeedback("Règles métier mises à jour !");
    setTimeout(() => setRulesFeedback(null), 3000);
  };

  const handleSaveSession = async () => {
    setIsSavingSession(true);
    setSessionFeedback(null);
    try {
      const res = await api<{ sessionLength: string }>("/system/settings", {
        method: "POST",
        body: JSON.stringify({ sessionLength }),
      });
      if (res && res.sessionLength) {
        setSessionFeedback("Durée de session mise à jour avec succès ! Les nouveaux jetons prendront cette durée.");
      } else {
        setSessionFeedback("Erreur lors de l'enregistrement de la session.");
      }
    } catch (err: any) {
      setSessionFeedback(err.message || "Erreur de communication.");
    } finally {
      setIsSavingSession(false);
      setTimeout(() => setSessionFeedback(null), 4000);
    }
  };

  // Database Backup & Restore state
  const [backupStartDate, setBackupStartDate] = useState("");
  const [backupEndDate, setBackupEndDate] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importStrategy, setImportStrategy] = useState<"keep" | "replace">("keep");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    setBackupFeedback(null);
    setIsExporting(true);
    try {
      const res = await api<any>("/backup/export", {
        method: "POST",
        body: JSON.stringify({
          startDate: backupStartDate || undefined,
          endDate: backupEndDate || undefined
        })
      });

      // Create a downloadable JSON blob file
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `backup-leadflow-${new Date().toISOString().split("T")[0]}.json`;
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setBackupFeedback({ type: "success", msg: "Sauvegarde générée et téléchargée avec succès." });
    } catch (err: any) {
      setBackupFeedback({ type: "error", msg: err.message || "Échec de l'exportation." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    setBackupFeedback(null);
    if (!importFile) {
      setBackupFeedback({ type: "error", msg: "Veuillez sélectionner un fichier JSON de sauvegarde." });
      return;
    }

    setIsImporting(true);
    try {
      const fileText = await importFile.text();
      let backupData = JSON.parse(fileText);

      // Auto-detect and normalize legacy flat backups
      if (backupData && !backupData.data && (backupData.leads || backupData.users)) {
        backupData = {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          data: backupData
        };
      }

      if (!backupData || !backupData.version || !backupData.data) {
        throw new Error("Le format du fichier de sauvegarde est invalide.");
      }

      const res = await api<any>("/backup/import", {
        method: "POST",
        body: JSON.stringify({
          mode: importMode,
          mergeStrategy: importStrategy,
          backupData
        })
      });

      setBackupFeedback({ type: "success", msg: res.message || "Restauration effectuée avec succès !" });
      setImportFile(null);
      const fileInput = document.getElementById("backup-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setBackupFeedback({ type: "error", msg: err.message || "Échec de la restauration." });
    } finally {
      setIsImporting(false);
    }
  };


  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850 dark:bg-slate-950" id="system-settings-root">
      <div className="max-w-7xl mx-auto w-full">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Email System Configuration Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center dark:bg-blue-900/20 dark:text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-850 font-bold text-sm dark:text-white">Configuration Messagerie CRM</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Définissez le fournisseur d'envoi de courriels (Resend ou SMTP individuel).</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1.5 font-bold">Méthode d'envoi active :</label>
                <select
                  value={emailProvider}
                  onChange={(e) => {
                    setEmailProvider(e.target.value as "resend" | "smtp");
                    setEmailFeedback(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer"
                >
                  <option value="smtp">Identifiants SMTP Individuels par Commercial</option>
                  <option value="resend">API Resend Globale (Envoyeur unique)</option>
                </select>
              </div>

              {emailProvider === "resend" ? (
                <>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Clé API Resend</label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder={hasResendApiKey ? "••••••••••••••••••••••••••••••••" : "re_..."}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                    />
                    {hasResendApiKey && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Une clé API est déjà configurée.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">Email d'expédition (From)</label>
                    <input
                      type="email"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      placeholder="onboarding@resend.dev"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white font-medium"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-500 dark:bg-slate-850 dark:border-slate-750 dark:text-slate-400 leading-relaxed font-medium">
                  💡 Le mode **SMTP Individuel** est actif. Les collaborateurs doivent saisir leurs propres identifiants de messagerie (adresse d'expédition, serveur, mot de passe d'application) dans leur fiche de profil (Paramètres du Compte) pour pouvoir envoyer des e-mails.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEmailConfig}
                  disabled={isSavingEmailConfig}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSavingEmailConfig ? "Enregistrement..." : "Appliquer"}
                </button>
                <button
                  type="button"
                  onClick={handleTestEmailConfig}
                  disabled={isTestingEmailConfig}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-semibold text-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {isTestingEmailConfig ? "Test..." : "Tester la connexion"}
                </button>
              </div>

              {emailFeedback && (
                <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                  emailFeedback.type === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                    : "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
                }`}>
                  {emailFeedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{emailFeedback.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Business Rules Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 grid place-items-center dark:bg-amber-900/20 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-850 font-bold text-sm dark:text-white">{t("team.businessRules")}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Définissez les contraintes opérationnelles globales et alertes du CRM.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px]">{t("team.inactivityDelay")}</label>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{inactivityDelay} Jours</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={inactivityDelay}
                  onChange={(e) => setInactivityDelay(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px]">{t("team.minConfidence")}</label>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{minConfidence} %</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="99"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveRules}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-white font-semibold text-sm hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Appliquer les Règles
                </button>
              </div>

              {rulesFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{rulesFeedback}</span>
                </div>
              )}
            </div>
          </div>

          {/* Session Length Configuration Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-slate-800 dark:text-blue-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-850 font-bold text-sm dark:text-white">Paramètres de Sécurité & Session</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Configurez la politique d'expiration des jetons de connexion.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1.5 font-bold">Durée d'expiration de la session :</label>
                <select
                  value={sessionLength}
                  onChange={(e) => setSessionLength(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="15m">15 Minutes (Défaut, sécurisé)</option>
                  <option value="1h">1 Heure</option>
                  <option value="8h">8 Heures (Journée de travail)</option>
                  <option value="24h">24 Heures</option>
                  <option value="7d">7 Jours</option>
                  <option value="30d">30 Jours</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSession}
                  disabled={isSavingSession}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSession ? "Enregistrement..." : "Sauvegarder la durée"}
                </button>
              </div>

            {sessionFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{sessionFeedback}</span>
                </div>
              )}
            </div>
          </div>

          {/* Database Backup & Restore Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center dark:bg-indigo-900/20 dark:text-indigo-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-850 font-bold text-sm dark:text-white">Sauvegarde & Restauration de la Base de Données</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Exportez les données du système ou restaurez-les depuis un fichier JSON.</p>
              </div>
            </div>

            <div className="space-y-5 text-xs">
              
              {/* Section: Export */}
              <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-blue-600" /> 1. Exporter les données
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Date de début (Optionnelle)</label>
                    <input
                      type="date"
                      value={backupStartDate}
                      onChange={(e) => setBackupStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Date de fin (Optionnelle)</label>
                    <input
                      type="date"
                      value={backupEndDate}
                      onChange={(e) => setBackupEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Génération..." : "Créer et télécharger la sauvegarde"}
                </button>
              </div>

              {/* Section: Import */}
              <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-emerald-600" /> 2. Importer / Restaurer les données
                </p>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Fichier de sauvegarde (.json)</label>
                  <input
                    type="file"
                    id="backup-file-input"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Méthode de restauration</label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                      <option value="merge">Fusionner avec les données existantes</option>
                      <option value="replace">Remplacer toute la base de données</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Stratégie en cas de doublons (Leads)</label>
                    <select
                      value={importStrategy}
                      onChange={(e) => setImportStrategy(e.target.value as any)}
                      disabled={importMode === "replace"}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white disabled:opacity-40"
                    >
                      <option value="keep">Conserver les données locales existantes</option>
                      <option value="replace">Écraser par les données de sauvegarde</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleImportBackup}
                  disabled={isImporting || !importFile}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-white font-semibold hover:bg-emerald-505 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? "Restauration..." : "Restaurer la base de données"}
                </button>
              </div>

              {backupFeedback && (
                <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                  backupFeedback.type === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                    : "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
                }`}>
                  {backupFeedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{backupFeedback.msg}</span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
