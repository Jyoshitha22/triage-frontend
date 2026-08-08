// Login.jsx
// The very first screen a patient sees. They enter their mobile number,
// get a (mock) OTP, and enter it to "log in". No real SMS is sent yet —
// this is a frontend-only mock so the flow can be demoed and later
// connected to a real backend.
 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavShell from "../components/NavShell";
import Card from "../components/Card";
import Button from "../components/Button";
import "./login.css";
 
function Login() {
      const navigate = useNavigate();
  // "step" controls which part of the screen shows: entering the phone
  // number first, then the OTP box after. Using a single string instead
  // of two booleans (like showPhone/showOtp) keeps it simple — there's
  // only ever one step active at a time.
  const [step, setStep] = useState("phone"); // "phone" or "otp"
 
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  // Runs when "Send OTP" is clicked.
  const handleSendOtp = (e) => {
    e.preventDefault(); // stop the form from refreshing the page
 
    // Basic check: mobile numbers should be 10 digits. This is not
    // full validation, just a simple guard so the form isn't submitted empty.
    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
 
    // Mock: pretend an OTP was sent. In a real app, this is where
    // we'd call the backend API to actually send an SMS.
    console.log("Mock OTP sent to:", phone);
    setStep("otp"); // move to the OTP entry screen
  };
 
  // Runs when "Verify OTP" is clicked.
  const handleVerifyOtp = (e) => {
    e.preventDefault();
 
    // Mock verification: for now, any 6-digit number is "correct".
    // Later, this checks against the real OTP sent by the backend.
    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }
    navigate("/basic-details");
  };
 
  // Lets the user request a new OTP without retyping their phone number.
  const handleResend = () => {
    console.log("Mock OTP resent to:", phone);
    alert("OTP resent (mock).");
  };
 
  return (
    <div>
      <NavShell pageTitle="Patient Login" />
 
      <div className="page-container">
        <Card title={step === "phone" ? "Enter Mobile Number" : "Enter OTP"}>
 
          {/* Only show the phone number form while step is "phone" */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp}>
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"                       // "tel" shows a number-friendly keyboard on mobile
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}                    // stops the user typing more than 10 digits
                required
              />
              <Button type="submit" variant="primary">
                Send OTP
              </Button>
            </form>
          )}
 
          {/* Only show the OTP form once step is "otp" */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-small">OTP sent to {phone}</p>
 
              <label className="form-label">Enter 6-digit OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                maxLength={6}
                required
              />
              <Button type="submit" variant="primary">
                Verify OTP
              </Button>
 
              {/* type="button" so clicking this does NOT submit the form */}
              <button type="button" className="link-btn" onClick={handleResend}>
                Resend OTP
              </button>
            </form>
          )}
 
        </Card>
      </div>
    </div>
  );
}
 
export default Login;