export function isRequired(value) {
  return String(value ?? "").trim() !== "";
}

// Indian mobile numbers: 10 digits, starting 6-9. Spaces are allowed
// while typing ("98765 43210") and stripped before checking.
export function isValidPhone(value) {
  const digits = String(value ?? "").replace(/\s+/g, "");
  return /^[6-9]\d{9}$/.test(digits);
}

// A hospital's landline/contact number is looser than a mobile number —
// 8 to 12 digits, spaces allowed.
export function isValidLandlineOrPhone(value) {
  const digits = String(value ?? "").replace(/\s+/g, "");
  return /^\d{8,12}$/.test(digits);
}

// OTPs in this app are shown as 4-digit codes, but 4–6 is accepted in
// case that changes later.
export function isValidOtp(value) {
  return /^\d{4,6}$/.test(String(value ?? "").trim());
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

// Hospital login accepts "work email OR mobile number" in one field.
export function isValidEmailOrPhone(value) {
  return isValidEmail(value) || isValidPhone(value);
}

export function isValidAge(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 && n <= 120;
}

// Letters, spaces, and the common name punctuation (O'Brien, Anne-Marie).
export function isValidName(value) {
  return /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(String(value ?? "").trim());
}

export function isValidPassword(value) {
  return String(value ?? "").length >= 6;
}

export function isValidExperienceYears(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 60;
}