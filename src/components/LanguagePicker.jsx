import React from "react";
import { useLanguage } from "../context/LanguageContext";
import "./LanguagePicker.css";

/**
 * Lets the patient pick which language everything — on-screen text and
 * spoken prompts — should use. Tapping a chip also "unlocks" audio on
 * browsers that require a user gesture before speech can play, so this
 * is a good first tap to have on the screen.
 */
export default function LanguagePicker({ className = "" }) {
  const { language, setLanguage, languages, t, speakPrompt } = useLanguage();

  const choose = (code) => {
    setLanguage(code);
    // Speak a short confirmation in the newly chosen language so the
    // patient immediately hears that voice is working in that language.
    setTimeout(() => speakPrompt("chooseLanguage"), 50);
  };

  return (
    <div className={`language-picker ${className}`} role="group" aria-label={t("chooseLanguage")}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => choose(l.code)}
          className={`language-picker__chip ${language === l.code ? "language-picker__chip--active" : ""}`}
        >
          {l.nativeLabel}
        </button>
      ))}
    </div>
  );
}
