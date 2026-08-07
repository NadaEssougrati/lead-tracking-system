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
  Play
} from "lucide-react";
import { usePreferences } from "../AppPreferences";
import { getEmailConfig, saveEmailConfig, testEmailConfig } from "../api";

export default function SystemSettings() {
  const { t } = usePreferences();
  
  // SMTP Config state
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // Business Rules state (persisted locally)
  const [inactivityDelay, setInactivityDelay] = useState(() => localStorage.getItem("sys_inactivity_delay") || "14");
  const [minConfidence, setMinConfidence] = useState(() => localStorage.getItem("sys_min_confidence") || "65");
  const [rulesFeedback, setRulesFeedback] = useState<string | null>(null);

  // Load SMTP configurations on mount
  useEffect(() => {
    getEmailConfig()
      .then((res) => {
        setGmailUser(res.gmailUser || "");
        setHasPassword(res.hasPassword || false);
      })
      .catch((err) => {
        console.error("Failed to load SMTP configuration:", err);
      });
  }, []);

  const handleSaveSmtp = async () => {
    setSmtpFeedback(null);
    if (!gmailUser) {
      setSmtpFeedback({ type: "error", msg: "L'adresse Gmail est requise." });
      return;
    }
    setIsSavingSmtp(true);
    try {
      const res = await saveEmailConfig({ gmailUser, gmailPass });
      if (res.success) {
        setHasPassword(res.data.hasPassword);
        setGmailPass("");
        setSmtpFeedback({ type: "success", msg: "Configuration SMTP enregistrée avec succès !" });
      } else {
        setSmtpFeedback({ type: "error", msg: res.message || "Erreur de configuration." });
      }
    } catch (err: any) {
      setSmtpFeedback({ type: "error", msg: err.message || "Erreur lors de la sauvegarde." });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpFeedback(null);
    setIsTestingSmtp(true);
    try {
      const res = await testEmailConfig();
      if (res.success) {
        setSmtpFeedback({ type: "success", msg: "Connexion SMTP réussie ! Le serveur est prêt." });
      } else {
        setSmtpFeedback({ type: "error", msg: res.message || "La connexion de test a échoué." });
      }
    } catch (err: any) {
      setSmtpFeedback({ type: "error", msg: err.message || "Erreur de communication lors du test SMTP." });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveRules = () => {
    localStorage.setItem("sys_inactivity_delay", inactivityDelay);
    localStorage.setItem("sys_min_confidence", minConfidence);
    setRulesFeedback("Règles métier mises à jour !");
    setTimeout(() => setRulesFeedback(null), 3000);
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850 dark:bg-slate-950" id="system-settings-root">
      <div className="max-w-7xl mx-auto w-full">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SMTP Configuration Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center dark:bg-blue-900/20 dark:text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-850 font-bold text-sm dark:text-white">{t("settings.smtp.title")}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("settings.smtp.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">{t("settings.smtp.user")}</label>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="exemple@gmail.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] text-[9px] mb-1">
                  {t("settings.smtp.pass")}
                </label>
                <input
                  type="password"
                  value={gmailPass}
                  onChange={(e) => setGmailPass(e.target.value)}
                  placeholder={hasPassword ? "••••••••••••••••" : "Saisir votre mot de passe d'application"}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-850 dark:border-slate-700 dark:text-white"
                />
                {hasPassword && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {t("settings.smtp.hasPassword")}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSmtp}
                  disabled={isSavingSmtp}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSmtp ? "Enregistrement..." : t("settings.smtp.save")}
                </button>
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-semibold text-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {isTestingSmtp ? "Test..." : t("settings.smtp.test")}
                </button>
              </div>

              {smtpFeedback && (
                <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                  smtpFeedback.type === "success" 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                    : "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
                }`}>
                  {smtpFeedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{smtpFeedback.msg}</span>
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

        </div>

      </div>
    </div>
  );
}
