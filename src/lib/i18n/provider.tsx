"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionaries, type DictKey, type Lang } from "./dictionary";

type Dir = "rtl" | "ltr";

interface I18nValue {
  lang: Lang;
  dir: Dir;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "mood.lang";

function dirFor(lang: Lang): Dir {
  return lang === "he" ? "rtl" : "ltr";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Default language is Hebrew (RTL). The chosen language is remembered.
  const [lang, setLangState] = useState<Lang>("he");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved === "he" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    const dir = dirFor(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "he" ? "en" : "he"),
    [lang, setLang],
  );

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let str = dictionaries[lang][key] ?? dictionaries.he[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: dirFor(lang), setLang, toggle, t }),
    [lang, setLang, toggle, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
