import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'http://localhost:





























import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

export default function useSarvamSpeech({ lang = 'unknown' } = {}) {
  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!window.MediaRecorder
  );

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const callbackRef = useRef(null);

  const start = useCallback(
    async (onFinal) => {
      if (!supported || listening) return;

      setError(null);
      setInterimTranscript('');
      callbackRef.current = onFinal;
      chunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        streamRef.current = stream;

        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
        ];

        const mimeType = mimeTypes.find((type) =>
          MediaRecorder.isTypeSupported(type)
        );

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });

          setListening(false);

          try {
            const formData = new FormData();

            formData.append('audio', blob, 'patient-recording.webm');
            formData.append('languageCode', lang || 'unknown');

            const response = await fetch(`${API_BASE_URL}/api/stt`, {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.details || data.error || 'STT failed');
            }

            const transcript = data.transcript || '';

            setInterimTranscript('');

            if (callbackRef.current) {
              callbackRef.current(transcript);
            }
          } catch (err) {
            console.error('Sarvam STT error:', err);
            setError('server');

            if (callbackRef.current) {
              callbackRef.current('');
            }
          } finally {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }

            recorderRef.current = null;
            chunksRef.current = [];
          }
        };

        recorder.start();
        setListening(true);
      } catch (err) {
        console.error('Microphone error:', err);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('not-allowed');
        } else {
          setError('microphone');
        }

        setListening(false);

        if (callbackRef.current) {
          callbackRef.current('');
        }
      }
    },
    [supported, listening, lang]
  );

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    error,
    start,
    stop,
  };
}
