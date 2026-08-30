import { useCallback, useEffect, useRef, useState } from "react";
export default function useSpeechRecognition({ lang = "en-IN", continuous = false } = {}) {
  const [supported] = useState(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const onFinalRef = useRef(null);

  // Keep the recognizer's language current without having to re-create it.
  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = lang;
  }, [lang]);

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
      };

      recognition.onerror = (event) => {
        // "no-speech" fires often and isn't worth surfacing as a hard error.
        if (event.error !== "no-speech") setError(event.error);
      };

      recognition.onend = () => {
        setListening(false);
        setInterimTranscript("");
        onFinalRef.current?.(finalTranscriptRef.current.trim());
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
      } catch {
        setError("start-failed");
      }
    },
    [supported, lang, continuous]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported, listening, interimTranscript, error, start, stop };
}