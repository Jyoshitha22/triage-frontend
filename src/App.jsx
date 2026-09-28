import { BrowserRouter, Routes, Route } from "react-router-dom";

// Patient pages
import RoleSelect from "./pages/RoleSelect";
import LanguageWelcome from "./pages/LanguageWelcome";
import Login from "./pages/Login";
import BasicDetails from "./pages/BasicDetails";
import SymptomRecording from "./pages/SymptomRecording";
import WaitingForDoctor from "./pages/WaitingForDoctor";
import DoctorReply from "./pages/DoctorReply";

// Hospital pages
import HospitalLogin from "./pages/HospitalLogin";
import HospitalRegistration from "./pages/HospitalRegistration";
import SpecialistDetails from "./pages/SpecialistDetails";
import DoctorSelect from "./pages/DoctorSelect";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientList from "./pages/PatientList";
import RepliedList from "./pages/RepliedList";
import RecordReply from "./pages/RecordReply";

import { LanguageProvider } from "./context/LanguageContext";

import "./theme/typography.css";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>

          {/* =====================================================
              MAIN / ROLE SELECTION
             ===================================================== */}

          <Route path="/" element={<RoleSelect />} />


          {/* =====================================================
              PATIENT SIDE
             ===================================================== */}

          {/* Language selection */}
          <Route path="/language" element={<LanguageWelcome />} />

          {/* Login - keep only if still needed */}
          <Route path="/login" element={<Login />} />

          {/* Patient basic information */}
          <Route path="/basic-details" element={<BasicDetails />} />

          {/* Patient symptoms */}
          <Route path="/symptoms" element={<SymptomRecording />} />

          {/* Waiting for doctor */}
          <Route path="/waiting" element={<WaitingForDoctor />} />

          {/* Doctor's reply to patient */}
          <Route path="/reply" element={<DoctorReply />} />


          {/* =====================================================
              HOSPITAL SIDE
             ===================================================== */}

          {/* Hospital login */}
          <Route path="/hospital" element={<HospitalLogin />} />

          {/* Hospital registration */}
          <Route
            path="/hospital/registration"
            element={<HospitalRegistration />}
          />

          {/* Hospital specialist registration/details */}
          <Route
            path="/hospital/specialists"
            element={<SpecialistDetails />}
          />

          {/* Select / identify doctor */}
          <Route
            path="/hospital/who-are-you"
            element={<DoctorSelect />}
          />

          {/* Doctor dashboard */}
          <Route
            path="/hospital/dashboard"
            element={<DoctorDashboard />}
          />

          {/* Patient queue/list */}
          <Route
            path="/hospital/patients"
            element={<PatientList />}
          />

          {/* Replied patients */}
          <Route
            path="/hospital/replied"
            element={<RepliedList />}
          />

          {/* Doctor reply */}
          <Route
            path="/hospital/reply"
            element={<RecordReply />}
          />

        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;