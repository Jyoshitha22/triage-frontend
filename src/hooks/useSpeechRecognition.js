import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Real microphone speech-to-text, using the browser's built-in Web Speech
 * API (SpeechRecognition). No server, no Whisper call — this is the
 * browser itself listening and transcribing.
 *
 * Browser support: Chrome, Edge, and Safari (16.4+) support this. Firefox
 * currently does not. When unsupported, `supported` is false — callers
 * should fall back to the typed input in that case.
 *
 * @param {string} lang - BCP-47 language tag, e.g. "en-IN", "te-IN".
 * @param {boolean} continuous - keep listening across pauses vs. stop
 *   after one short answer (phone, OTP, name, etc).
 * @param {number|null} silenceTimeoutMs - when set, automatically stops
 *   listening after this many ms of quiet AFTER the person has started
 *   speaking. Before they say anything, it waits longer (at least 8 s)
 *   so they have time to start talking.
 */
const FIRST_WORD_WAIT_MS = 8000;

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

  const armSilenceTimer = useCallback((ms) => {
    if (!silenceTimeoutMs) return;
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, ms ?? silenceTimeoutMs);
  }, [silenceTimeoutMs]);

  const start = useCallback(
    async (onFinalResult) => {
      if (!supported) {
        setError("unsupported");
        return;
      }
      setError(null);

      // Ask for the microphone first, so the browser shows its permission
      // prompt (or tells us it is blocked) before we start listening.
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch {
        setError("not-allowed");
        return;
      }

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
        if (recognitionRef.current !== recognition) return; // an older session ending
        clearSilenceTimer();
        setListening(false);
        setInterimTranscript("");
        onFinalRef.current?.(finalTranscriptRef.current.trim());
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
        // Give the person time to START talking before the quiet-clock runs.
        if (silenceTimeoutMs) armSilenceTimer(Math.max(silenceTimeoutMs, FIRST_WORD_WAIT_MS));
      } catch {
        setError("start-failed");
      }
    },
    [supported, lang, continuous, silenceTimeoutMs, armSilenceTimer]
  );

  const stop = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => () => { clearSilenceTimer(); recognitionRef.current?.stop(); }, []);

  return { supported, listening, interimTranscript, error, start, stop };
}