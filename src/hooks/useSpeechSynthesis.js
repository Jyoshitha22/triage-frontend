import { useCallback, useEffect, useRef } from "react";
export default function useSpeechSynthesis() {
  const voicesRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text, lang = "en-IN") => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;

    // Cancel anything mid-speech so prompts don't stack up as the patient
    // moves quickly between fields.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    const match =
      voicesRef.current.find((v) => v.lang === lang) ||
      voicesRef.current.find((v) => v.lang?.startsWith(lang.split("-")[0]));
    if (match) utterance.voice = match;

    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel };
}