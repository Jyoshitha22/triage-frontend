import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, translate } from "./strings";
import useSpeechSynthesis from "../hooks/useSpeechSynthesis";

const LanguageContext = createContext(null);
const STORAGE_KEY = "triage.language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(STORAGE_KEY) || "en";
  });
  const { speak, cancel } = useSpeechSynthesis();

  const setLanguage = useCallback((code) => {
    setLanguageState(code);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const current = useMemo(
    () => LANGUAGES.find((l) => l.code === language) || LANGUAGES[0],
    [language]
  );

  // t("someKey") -> the translated string for the current language.
  const t = useCallback((key) => translate(key, language), [language]);

  // speakPrompt("someKey") speaks the translated string aloud.
  // speakPrompt("Literal text", { raw: true }) speaks arbitrary text as-is
  // (used for things like doctor follow-up questions that aren't in the
  // fixed dictionary).
  const speakPrompt = useCallback(
    (keyOrText, { raw = false } = {}) => {
      const text = raw ? keyOrText : translate(keyOrText, language);
      speak(text, current.bcp47);
    },
    [speak, language, current.bcp47]
  );

  // Stop any speech in progress when the language changes mid-sentence.
  useEffect(() => () => cancel(), [cancel]);

  const value = useMemo(
    () => ({ language, setLanguage, languages: LANGUAGES, current, bcp47: current.bcp47, t, speakPrompt, cancelSpeech: cancel }),
    [language, setLanguage, current, t, speakPrompt, cancel]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}