import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import BasicDetails from "./pages/BasicDetails";
import SymptomRecording from "./pages/SymptomRecording";

import "./theme/typography.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/basic-details" element={<BasicDetails />} />
        <Route path="/symptoms" element={<SymptomRecording />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;