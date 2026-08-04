/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, Language, ThemeMode, getResolvedTheme } from "./i18n";

interface PreferencesContextValue {
  language: Language;
  theme: ThemeMode;
  setLanguage: (l: Language) => void;
  setTheme: (t: ThemeMode) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  resolvedTheme: "light" | "dark";
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const LANG_KEY = "crm_language";
const THEME_KEY = "crm_theme";

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(LANG_KEY) as Language | null;
  if (stored === "fr" || stored === "en" || stored === "ar") return stored;
  const browserLang = navigator.language?.split("-")[0];
  if (browserLang === "fr" || browserLang === "en" || browserLang === "ar") {
    return browserLang as Language;
  }
  return "fr";
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  };

  // Apply theme class + dir attribute on the document root
  useEffect(() => {
    const root = document.documentElement;
    const resolved = getResolvedTheme(theme);
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", language);
  }, [theme, language]);

  // Listen to system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => {
      const root = document.documentElement;
      if (mq.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  const t = useMemo(() => {
    const dict = translations[language];
    return (key: string) => dict[key] ?? translations.fr[key] ?? key;
  }, [language]);

  const value: PreferencesContextValue = {
    language,
    theme,
    setLanguage,
    setTheme,
    t,
    dir: language === "ar" ? "rtl" : "ltr",
    resolvedTheme: getResolvedTheme(theme),
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}
