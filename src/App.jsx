import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HospitalRegistration from "./pages/HospitalRegistration";
import SymptomRecording from "./pages/SymptomRecording";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/hospital-registration">
          Hospital Registration
        </Link>

        <Link to="/symptom-recording">
          Symptom Recording
        </Link>
      </nav>

      <Routes>
        <Route
          path="/hospital-registration"
          element={<HospitalRegistration />}
        />

        <Route
          path="/symptom-recording"
          element={<SymptomRecording />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;