// SymptomRecording.jsx
// After basic details, the patient records their symptom by voice.
// If the system needs more info, it asks ONE follow-up question
// (e.g. "since how many days?") which the patient also answers by voice.
// Both recordings are captured here and handed off (mock) for triage.
 
import { useState, useRef } from "react";
import NavShell from "../components/NavShell";
import Card from "../components/Card";
import Button from "../components/Button";
import "./SymptomRecording.css";
 
function SymptomRecording() {
  // "stage" moves the screen through: recording the main symptom,
  // then the follow-up question, then done. Same pattern as a step
  // tracker — only one stage is ever shown at a time.
  const [stage, setStage] = useState("symptom"); // "symptom" | "followup" | "done"
 
  // ---- Main symptom recording ----
  const [isRecording, setIsRecording] = useState(false);
  const [symptomAudioUrl, setSymptomAudioUrl] = useState(null);
 
  // ---- Follow-up recording ----
  const [isRecordingFollowup, setIsRecordingFollowup] = useState(false);
  const [followupAudioUrl, setFollowupAudioUrl] = useState(null);
 
  // Refs hold the actual MediaRecorder + audio data — same approach
  // as BasicDetails.jsx, kept separate here since there are two
  // different recordings happening on this one screen.
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
 
  // Generic recording starter — works for either the symptom or the
  // follow-up recording, decided by which "onDone" callback is passed in.
  const startRecording = async (onDone, setRecordingFlag) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
 
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
 
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        onDone(url); // saves the URL into whichever state was passed in
      };
 
      recorder.start();
      setRecordingFlag(true);
    } catch (err) {
      alert("Couldn't access the microphone. Please allow mic permission and try again.");
      console.error(err);
    }
  };
 
  const stopRecording = (setRecordingFlag) => {
    mediaRecorderRef.current.stop();
    setRecordingFlag(false);
  };
 
  // Once the symptom is recorded and confirmed, move to the follow-up stage.
  const handleContinueToFollowup = () => {
    setStage("followup");
  };
 
  // Once the follow-up is recorded, this is where — in the real system —
  // the audio would be sent for transcription + triage classification.
  // For now, we just log it and mark this screen as done.
  const handleSubmitAll = () => {
    console.log("Symptom recording:", symptomAudioUrl);
    console.log("Follow-up recording:", followupAudioUrl);
    setStage("done");
  };
 
  return (
    <div>
      <NavShell pageTitle="Describe Your Symptoms" />
 
      <div className="page-container">
 
        {/* Stage 1: record the main symptom */}
        {stage === "symptom" && (
          <Card title="Tell us what's wrong">
            <p className="text-small">
              Tap the mic and describe your symptom, e.g. "I have a headache and fever since yesterday."
            </p>
 
            <div className="voice-controls">
              {!isRecording && !symptomAudioUrl && (
                <Button
                  variant="primary"
                  onClick={() => startRecording(setSymptomAudioUrl, setIsRecording)}
                >
                  🎤 Start Recording
                </Button>
              )}
 
              {isRecording && (
                <Button variant="primary" onClick={() => stopRecording(setIsRecording)}>
                  ⏹ Stop Recording
                </Button>
              )}
 
              {symptomAudioUrl && !isRecording && (
                <div className="playback-row">
                  <audio controls src={symptomAudioUrl} className="audio-player" />
                  <Button variant="secondary" onClick={() => setSymptomAudioUrl(null)}>
                    🔁 Redo
                  </Button>
                </div>
              )}
            </div>
 
            {symptomAudioUrl && (
              <Button variant="primary" onClick={handleContinueToFollowup}>
                Continue
              </Button>
            )}
          </Card>
        )}
 
        {/* Stage 2: one follow-up question */}
        {stage === "followup" && (
          <Card title="One quick follow-up">
            <p className="text-small">Since how many days have you had this symptom?</p>
 
            <div className="voice-controls">
              {!isRecordingFollowup && !followupAudioUrl && (
                <Button
                  variant="primary"
                  onClick={() => startRecording(setFollowupAudioUrl, setIsRecordingFollowup)}
                >
                  🎤 Start Recording
                </Button>
              )}
 
              {isRecordingFollowup && (
                <Button variant="primary" onClick={() => stopRecording(setIsRecordingFollowup)}>
                  ⏹ Stop Recording
                </Button>
              )}
 
              {followupAudioUrl && !isRecordingFollowup && (
                <div className="playback-row">
                  <audio controls src={followupAudioUrl} className="audio-player" />
                  <Button variant="secondary" onClick={() => setFollowupAudioUrl(null)}>
                    🔁 Redo
                  </Button>
                </div>
              )}
            </div>
 
            {followupAudioUrl && (
              <Button variant="primary" onClick={handleSubmitAll}>
                Submit
              </Button>
            )}
          </Card>
        )}
 
        {/* Stage 3: confirmation — in the real app, this is where the
            screen would move on to TriageResult once the backend
            responds with a classification */}
        {stage === "done" && (
          <Card title="Got it!">
            <p>
              Your symptoms have been recorded. We're figuring out the best
              doctor for you — this usually takes a moment.
            </p>
          </Card>
        )}
 
      </div>
    </div>
  );
}
 
export default SymptomRecording;