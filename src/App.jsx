import { useEffect, useLayoutEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import RoleSelect from "./pages/RoleSelect";
import LanguageWelcome from "./pages/LanguageWelcome";
import PatientLogin from "./pages/Login";
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
import AppBackground from "./components/AppBackground";
import AppHeader from "./components/AppHeader.jsx";
import PatientLanguageScope from "./components/PatientLanguageScope";
import { LanguageProvider } from "./context/LanguageContext";
import session from "./utils/session";

import "./theme/typography.css";
import "./App.css";

/**
 * Every time the app is opened or reloaded, go to the home page (role
 * selection) — except when a patient is waiting for a doctor, so a refresh
 * on the Waiting or Reply page continues instead of starting over.
 * It renders nothing itself, so it can never blank the app.
 */
function StartAtHome() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const resume = (pathname === "/waiting" || pathname === "/reply") && session.getPending();
    if (pathname !== "/" && !resume) navigate("/", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function PreventBrowserBack() {
  const location = useLocation();
  const currentEntry = useRef(null);

  useLayoutEffect(() => {
    const entry = {
      url: `${location.pathname}${location.search}${location.hash}`,
      state: window.history.state,
    };
    currentEntry.current = entry;
    window.history.pushState(entry.state, "", entry.url);
  }, [location.hash, location.key, location.pathname, location.search]);

  useEffect(() => {
    const restoreCurrentEntry = () => {
      const entry = currentEntry.current;
      if (entry) window.history.pushState(entry.state, "", entry.url);
    };

    window.addEventListener("popstate", restoreCurrentEntry, true);
    return () => window.removeEventListener("popstate", restoreCurrentEntry, true);
  }, []);

  return null;
}

function App() {
  return (
    <LanguageProvider>
      <AppBackground />
      <BrowserRouter>
        <PatientLanguageScope />
        <StartAtHome />
        <PreventBrowserBack />

        {/* One header for every page */}
        <AppHeader />

        <Routes>
          {/* Home: patient or hospital staff */}
          <Route path="/" element={<RoleSelect />} />

          {/* Patient side: language, then patient details, then symptoms */}
          <Route path="/language" element={<LanguageWelcome />} />
          <Route path="/patient-login" element={<PatientLogin />} />
          <Route path="/basic-details" element={<BasicDetails />} />
          <Route path="/symptoms" element={<SymptomRecording />} />
          <Route path="/waiting" element={<WaitingForDoctor />} />
          <Route path="/reply" element={<DoctorReply />} />

          {/* Hospital side: Admin and Doctor */}
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