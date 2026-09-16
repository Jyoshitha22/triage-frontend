import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import RoleSelect from "./pages/RoleSelect";
import LanguageWelcome from "./pages/LanguageWelcome";
import BasicDetails from "./pages/BasicDetails";
import SymptomRecording from "./pages/SymptomRecording";
import WaitingForDoctor from "./pages/WaitingForDoctor";
import DoctorReply from "./pages/DoctorReply";
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
          {/* First screen for everyone: patient or hospital staff */}
          <Route path="/" element={<RoleSelect />} />

          {/* Patient side */}
          <Route path="/language" element={<LanguageWelcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/basic-details" element={<BasicDetails />} />
          <Route path="/symptoms" element={<SymptomRecording />} />
          <Route path="/waiting" element={<WaitingForDoctor />} />
          <Route path="/reply" element={<DoctorReply />} />

          {/* Hospital side */}
          <Route path="/hospital" element={<HospitalLogin />} />
          <Route path="/hospital/registration" element={<HospitalRegistration />} />
          <Route path="/hospital/specialists" element={<SpecialistDetails />} />
          <Route path="/hospital/who-are-you" element={<DoctorSelect />} />
          <Route path="/hospital/dashboard" element={<DoctorDashboard />} />
          <Route path="/hospital/patients" element={<PatientList />} />
          <Route path="/hospital/replied" element={<RepliedList />} />
          <Route path="/hospital/reply" element={<RecordReply />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;