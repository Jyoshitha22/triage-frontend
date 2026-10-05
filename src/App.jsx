import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleSelect from "./pages/RoleSelect";
import LanguageWelcome from "./pages/LanguageWelcome";
import BasicDetails from "./pages/BasicDetails";
import SymptomRecording from "./pages/SymptomRecording";
import WaitingForDoctor from "./pages/WaitingForDoctor";
import DoctorReply from "./pages/DoctorReply";
import HospitalRoleSelect from "./pages/HospitalRoleSelect";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminHome from "./pages/AdminHome";
import EditHospital from "./pages/EditHospital";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorRegister from "./pages/DoctorRegister";
import SpecialistDetails from "./pages/SpecialistDetails";
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

          {/* Patient side — language, then straight to basic details.
              A returning patient (see session.js) skips both and goes
              straight to /symptoms or /reply. */}
          <Route path="/language" element={<LanguageWelcome />} />
          <Route path="/basic-details" element={<BasicDetails />} />
          <Route path="/symptoms" element={<SymptomRecording />} />
          <Route path="/waiting" element={<WaitingForDoctor />} />
          <Route path="/reply" element={<DoctorReply />} />

          {/* Hospital side — split into Admin and Doctor, each with
              their own real login. */}
          <Route path="/hospital" element={<HospitalRoleSelect />} />
          <Route path="/hospital/admin" element={<AdminLogin />} />
          <Route path="/hospital/admin/register" element={<AdminRegister />} />
          <Route path="/hospital/admin/home" element={<AdminHome />} />
          <Route path="/hospital/admin/edit" element={<EditHospital />} />
          <Route path="/hospital/doctor" element={<DoctorLogin />} />
          <Route path="/hospital/doctor/register" element={<DoctorRegister />} />
          <Route path="/hospital/specialists" element={<SpecialistDetails />} />
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