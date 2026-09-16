import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Real microphone speech-to-text, using the browser's built-in Web Speech
 * API (SpeechRecognition). No server, no Whisper call — this is the
 * browser itself listening and transcribing.
 *
 * Browser support: Chrome, Edge, and Safari (16.4+) support this. Firefox
 * currently does not. When unsupported, `supported` is false — callers
 * should fall back to the typed input in that case (VoiceField already
 * does this).
 *
 * @param {string} lang - BCP-47 language tag, e.g. "en-IN", "te-IN".
 * @param {boolean} continuous - keep listening across pauses vs. stop
 *   after one short answer (phone, OTP, name, etc).
 * @param {number|null} silenceTimeoutMs - when set, automatically stops
 *   listening after this many ms with no new speech detected — this is
 *   what lets a longer, continuous recording (like describing a
 *   symptom) end on its own once the patient stops talking, instead of
 *   requiring a manual "stop" tap. Only meaningful when continuous is
 *   true; leave null to require an explicit stop() call.
 */
export default function useSpeechRecognition({ lang = "en-IN", continuous = false, silenceTimeoutMs = null } = {}) {
  const [supported] = useState(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const onFinalRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Keep the recognizer's language current without having to re-create it.
  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = lang;
  }, [lang]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  };

  const armSilenceTimer = useCallback(() => {
    if (!silenceTimeoutMs) return;
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs]);

  const start = useCallback(
    (onFinalResult) => {
      if (!supported) {
        setError("unsupported");
        return;
      }
      setError(null);
      onFinalRef.current = onFinalResult;
      finalTranscriptRef.current = "";
      setInterimTranscript("");

      const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionImpl();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interim = "";
        let final = finalTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i];
          if (chunk.isFinal) final += (final ? " " : "") + chunk[0].transcript.trim();
          else interim += chunk[0].transcript;
        }
        finalTranscriptRef.current = final;
        setInterimTranscript(interim);
        // Any new speech resets the "they've gone quiet" clock.
        armSilenceTimer();
      };

      recognition.onerror = (event) => {
        // "no-speech" fires often and isn't worth surfacing as a hard error.
        if (event.error !== "no-speech") setError(event.error);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setListening(false);
        setInterimTranscript("");
        onFinalRef.current?.(finalTranscriptRef.current.trim());
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
        // Start the silence clock immediately too, in case the patient
        // never says anything at all.
        armSilenceTimer();
      } catch {
        setError("start-failed");
      }
    },
    [supported, lang, continuous, armSilenceTimer]
  );

  const stop = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => () => { clearSilenceTimer(); recognitionRef.current?.stop(); }, []);

  return { supported, listening, interimTranscript, error, start, stop };
}