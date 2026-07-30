import { useState } from "react";
import NavShell from "../components/NavShell";
import Card from "../components/Card";
import Button from "../components/Button";
import "./HospitalRegistration.css";

function HospitalRegistration() {
  const [hospitalName, setHospitalName] = useState("");
  const [loginId, setLoginId] = useState("");

  const [specialists, setSpecialists] = useState([
    { name: "", specialty: "", experience: "" },
  ]);

  const handleSpecialistChange = (index, field, value) => {
    const updated = [...specialists];
    updated[index][field] = value;
    setSpecialists(updated);
  };

  const addSpecialist = () => {
    setSpecialists([...specialists, { name: "", specialty: "", experience: "" }]);
  };

  const removeSpecialist = (index) => {
    setSpecialists(specialists.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Hospital submitted:", { hospitalName, loginId, specialists });
    alert("Hospital registered (mock) — check the browser console for the data.");
  };

  return (
    <div>
      <NavShell pageTitle="Hospital Registration" />

      <div className="page-container">
        <form onSubmit={handleSubmit}>

          <Card title="Hospital Details">
            <label className="form-label">Hospital Name</label>
            <input
              type="text"
              className="form-input"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="e.g. City Care Hospital"
              required
            />

            <label className="form-label">Login (Mobile Number or Email)</label>
            <input
              type="text"
              className="form-input"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. 9876543210 or admin@hospital.com"
              required
            />
          </Card>

          <Card title="Specialists">
            {specialists.map((specialist, index) => (
              <div className="specialist-row" key={index}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doctor Name"
                  value={specialist.name}
                  onChange={(e) => handleSpecialistChange(index, "name", e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Specialty (e.g. Cardiology)"
                  value={specialist.specialty}
                  onChange={(e) => handleSpecialistChange(index, "specialty", e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="form-input form-input-small"
                  placeholder="Yrs Exp"
                  value={specialist.experience}
                  onChange={(e) => handleSpecialistChange(index, "experience", e.target.value)}
                  required
                />

                {specialists.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeSpecialist(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <Button variant="secondary" onClick={addSpecialist}>
              + Add Another Specialist
            </Button>
          </Card>

          <Button type="submit" variant="primary">
            Register Hospital
          </Button>

        </form>
      </div>
    </div>
  );
}

export default HospitalRegistration;