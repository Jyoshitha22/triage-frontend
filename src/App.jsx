import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import BasicDetails from "./pages/BasicDetails";
import SymptomRecording from "./pages/SymptomRecording";
import WaitingForDoctor from "./pages/WaitingForDoctor";
import DoctorReply from "./pages/DoctorReply";
import HospitalLogin from "./pages/HospitalLogin";
import HospitalRegistration from "./pages/HospitalRegistration";

import "./theme/typography.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Patient side */}
        <Route path="/" element={<Login />} />
        <Route path="/basic-details" element={<BasicDetails />} />
        <Route path="/symptoms" element={<SymptomRecording />} />
        <Route path="/waiting" element={<WaitingForDoctor />} />
        <Route path="/reply" element={<DoctorReply />} />

        {/* Hospital side — 2 of 6 added so far.
            Add the rest here as you build them:
            /hospital/specialists, /hospital/dashboard,
            /hospital/patients, /hospital/reply */}
        <Route path="/hospital" element={<HospitalLogin />} />
        <Route path="/hospital/registration" element={<HospitalRegistration />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;