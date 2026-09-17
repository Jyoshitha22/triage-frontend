import { useRef } from "react";
import "./OtpInput.css";

/**
 * The classic "one box per digit" OTP entry. Typing a digit jumps to the
 * next box automatically; Backspace on an empty box jumps back. Pasting
 * a full code (e.g. from an SMS autofill prompt) fills all boxes at
 * once. Calls onComplete() the instant the last box is filled — this is
 * what lets the OTP step auto-advance without a Verify tap.
 */
export default function OtpInput({ length = 4, value, onChange, onComplete, disabled = false }) {
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);
  const inputRefs = useRef([]);

  const setDigit = (index, digit) => {
    const next = [...digits];
    next[index] = digit;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
    if (joined.length === length && next.every((d) => d !== "")) onComplete?.(joined);
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDigit(index, ""); return; }
    // Handles both a single keystroke and a full paste landing in one box.
    setDigit(index, raw.slice(-1));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    if (pasted.length === length) onComplete?.(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  return (
    <div className="otp-input" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="otp-input__box"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}