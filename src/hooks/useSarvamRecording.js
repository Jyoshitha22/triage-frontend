import { useCallback, useRef, useState } from "react";
import api from "../utils/api";

/**
 * Real speech-to-text via Sarvam, replacing the browser's own
 * SpeechRecognition (useSpeechRecognition.js) everywhere in this app.
 * Records with MediaRecorder (works in every modern browser, including
 * Firefox — the old hook's biggest limitation), then sends the whole
 * clip to the backend's /transcribe endpoint, which forwards it to
 * Sarvam, on stop.
 *
 * Trade-off vs. the old hook: Sarvam transcribes the full recording at
 * once, not word-by-word as you speak — so there's no live "interim"
 * text while recording, only a short wait right after you stop. We
 * show a "transcribing…" state for that gap instead of live captions.
 *
 * @param {string} lang - 'en' | 'hi' | 'te' | 'ta'
 * @param {number|null} silenceTimeoutMs - auto-stop after this many ms
 *   of near-silence (uses the Web Audio API's volume level, not speech
 *   detection — good enough to know "they've gone quiet").
 */
export default function useSarvamRecording({ lang = "en", silenceTimeoutMs = null } = {}) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const onFinalRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const supported = typeof window !== "undefined" && !!(navigator.mediaDevices && window.MediaRecorder);

  const clearSilenceWatch = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  // Watches input volume; resets a "they've gone quiet" timer whenever
  // volume rises above a low threshold, fires stop() once that timer
  // completes uninterrupted.
  const watchForSilence = (stream, onSilence) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const armTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(onSilence, silenceTimeoutMs);
    };
    armTimer();

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      const level = data.reduce((sum, v) => sum + Math.abs(v - 128), 0) / data.length;
      if (level > 4) armTimer(); // "still talking" — push the timer out again
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const start = useCallback(
    async (onFinalResult) => {
      if (!supported) { setError("unsupported"); return; }
      setError(null);
      onFinalRef.current = onFinalResult;
      chunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          clearSilenceWatch();
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);

          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (blob.size < 500) { onFinalRef.current?.(""); return; } // essentially empty — nothing worth sending

          setTranscribing(true);
          try {
            const form = new FormData();
            form.append("audio", blob, "recording.webm");
            form.append("lang", lang);
            const result = await api.post("/transcribe", form);
            onFinalRef.current?.(result.transcript || "");
          } catch (e) {
            setError(e.message || "transcription-failed");
            onFinalRef.current?.("");
          } finally {
            setTranscribing(false);
          }
        };

        recorder.start();
        setListening(true);
        if (silenceTimeoutMs) watchForSilence(stream, () => recorder.state === "recording" && recorder.stop());
      } catch {
        setError("not-allowed");
      }
    },
    [supported, lang, silenceTimeoutMs] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }, []);

  return { supported, listening, transcribing, error, start, stop };
}