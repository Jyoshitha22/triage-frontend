import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import Waveform from '../components/Waveform';
import Button from '../components/Button';
import useAutoAdvance from '../hooks/useAutoAdvance';
import session from '../utils/session';
import { isValidEmailOrPhone, isValidPassword } from '../utils/validators';
import './HospitalLogin.css';

export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const identifierValid = isValidEmailOrPhone(email);
  const passwordValid = isValidPassword(password);
  const formValid = identifierValid && passwordValid;

  const submit = () => {
    if (!formValid) return;

    session.saveHospital({ email });

    // CHANGED: always go through hospital registration
    navigate('/hospital/registration');
  };

  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  useAutoAdvance(`${email}:${password}`, formValid, submit, { delay: 1200 });

  return (
    <div className="hospital-login">
      <div className="hospital-login__panel">

        <div className="hospital-login__header">
          <HeartbeatLogo size={44} className="hospital-login__logo" />

          <h1 className="hospital-login__title">
            Hospital staff login
          </h1>

          <p className="hospital-login__subtitle">
            Sign in to continue to your hospital workspace.
          </p>
        </div>

        <div className="hospital-login__form">

          <div className="hospital-login__field">
            <label className="hospital-login__label">
              Email or mobile number
            </label>

            <div className="hospital-login__input-wrap">
              <Mail size={18} />

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Email or mobile number"
                className="hospital-login__input"
              />
            </div>

            {email && !identifierValid && (
              <p className="field-error">
                <AlertCircle size={12} />
                Enter a valid email or phone number.
              </p>
            )}
          </div>

          <div className="hospital-login__field">
            <label className="hospital-login__label">
              Password
            </label>

            <div className="hospital-login__input-wrap">
              <Lock size={18} />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password"
                className="hospital-login__input"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="hospital-login__password-toggle"
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {password && !passwordValid && (
              <p className="field-error">
                <AlertCircle size={12} />
                Enter a valid password.
              </p>
            )}
          </div>

          <Button
            onClick={submit}
            disabled={!formValid}
          >
            Continue
          </Button>

          <div className="hospital-login__security">
            <ShieldCheck size={18} />

            <div>
              <strong>Secure hospital access</strong>
              <p>
                Your hospital information is protected.
              </p>
            </div>
          </div>

        </div>

        <div className="hospital-login__waveform">
          <Waveform />
        </div>

      </div>
    </div>
  );
}