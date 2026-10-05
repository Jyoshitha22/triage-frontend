import { useCallback, useRef } from "react";
import api from "../utils/api";

/**
 * Real text-to-speech via Sarvam, replacing the browser's own
 * speechSynthesis (useSpeechSynthesis.js) everywhere in this app. One
 * real, consistent voice across every device/browser, in the patient's
 * actual chosen language — the browser API's quality and even language
 * availability varied a lot by device, which this fixes.
 */
export default function useSarvamSpeech() {
  const audioRef = useRef(null);

  const speak = useCallback(async (text, lang = "en") => {
    if (!text || !text.trim()) return;
    audioRef.current?.pause();
    try {
      const form = new FormData();
      form.append("text", text);
      form.append("lang", lang);
      const blob = await api.post("/speak", form);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {}); // browsers can block autoplay before any user gesture — fails quietly
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      /* Sarvam/network hiccup — the app stays usable without the voice line, nothing to recover here */
    }
  }, []);

  const cancel = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  return { speak, cancel };
}