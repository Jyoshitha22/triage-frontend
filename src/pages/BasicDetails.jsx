// BasicDetails.jsx
// After login, the patient enters their name and age. They pick ONCE
// at the start whether to type it or speak it (not a live toggle —
// simpler to build and avoids the "what happens to my typed text if
// I switch modes" problem entirely).
 
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavShell from "../components/NavShell";
import Card from "../components/Card";
import Button from "../components/Button";
import "./BasicDetails.css";
 
function BasicDetails() {
    const navigate = useNavigate();
  // "mode" starts as null — nothing chosen yet. Once the user taps
  // "Type it" or "Speak it", this becomes "form" or "voice" and stays
  // that way for the rest of this screen.
  const [mode, setMode] = useState(null); // null | "form" | "voice"
 
  // ---- Text mode fields ----
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
 
  // ---- Voice mode state ----
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); // playable link to the recording, once done
 
  // useRef holds the MediaRecorder object and the recorded audio chunks.
  // We use refs (not state) here because we don't need the UI to
  // re-render when these change — they're just working data for recording.
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
 
  // Starts recording from the microphone.
  const startRecording = async () => {
    try {
      // Ask the browser for microphone access — this triggers the
      // permission popup the first time.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = []; // clear out any previous recording's data
 
      // Every time a chunk of audio data is available, save it.
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
 
      // Once recording stops, combine all chunks into one audio file
      // and create a URL for it so an <audio> element can play it back.
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
 
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      // Happens if the user denies mic permission, or no mic is available
      alert("Couldn't access the microphone. Please allow mic permission and try again.");
      console.error(err);
    }
  };
 
  // Stops the current recording.
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };
 
  // "Redo" — discards the current recording so the user can record again
  // from scratch. We just clear audioUrl; the next recording will
  // overwrite it once they hit record again.
  const handleRedo = () => {
    setAudioUrl(null);
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
 
    if (mode === "form") {
      console.log("Details submitted (text):", { name, age });
      alert("Details saved (mock) — via text.");
    } else {
      console.log("Details submitted (voice):", { audioUrl });
      alert("Details saved (mock) — via voice recording.");
    }
    // Go to the Symptom Recording page
  navigate("/symptoms");
  };
 
  return (
    <div>
      <NavShell pageTitle="Basic Details" />
 
      <div className="page-container">
 
        {/* Step 1: mode not chosen yet — show the two choice buttons */}
        {mode === null && (
          <Card title="How would you like to enter your details?">
            <div className="mode-choice">
              <Button variant="primary" onClick={() => setMode("form")}>
                ⌨️ Type it
              </Button>
              <Button variant="secondary" onClick={() => setMode("voice")}>
                🎤 Speak it
              </Button>
            </div>
          </Card>
        )}
 
        {/* Step 2a: text mode */}
        {mode === "form" && (
          <Card title="Enter Your Details">
            <form onSubmit={handleSubmit}>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
              />
 
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
                required
              />
 
              <Button type="submit" variant="primary">
                Continue
              </Button>
            </form>
          </Card>
        )}
 
        {/* Step 2b: voice mode */}
        {mode === "voice" && (
          <Card title="Speak Your Name and Age">
            <p className="text-small">
              Tap the mic and say your name and age, e.g. "My name is Priya, I am 34 years old."
            </p>
 
            <div className="voice-controls">
              {/* Only show Record button if not currently recording AND
                  nothing has been recorded yet */}
              {!isRecording && !audioUrl && (
                <Button variant="primary" onClick={startRecording}>
                  🎤 Start Recording
                </Button>
              )}
 
              {/* Show Stop button while actively recording */}
              {isRecording && (
                <Button variant="primary" onClick={stopRecording}>
                  ⏹ Stop Recording
                </Button>
              )}
 
              {/* Once a recording exists, show playback + redo + submit */}
              {audioUrl && !isRecording && (
                <div className="playback-row">
                  {/* Built-in browser audio player — gives Play/Pause/seek for free */}
                  <audio controls src={audioUrl} className="audio-player" />
 
                  <Button variant="secondary" onClick={handleRedo}>
                    🔁 Redo
                  </Button>
                </div>
              )}
            </div>
 
            {/* Only allow submitting once there's an actual recording */}
            {audioUrl && (
              <Button variant="primary" onClick={handleSubmit}>
                Continue
              </Button>
            )}
          </Card>
        )}
 
      </div>
    </div>
  );
}
 
export default BasicDetails;