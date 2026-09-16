/**
 * Plain, dependency-free validators reused across every form in the app.
 * Each one takes the raw field value and returns true/false — pair with
 * the matching error message key in context/strings.js (see the
 * "errorXxx" entries) when showing feedback to the patient/doctor.
 */

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

// A handful of domains people (and test data) commonly type that aren't
// real inboxes anyone can receive mail at. Syntactically these pass a
// normal email regex, so they're called out separately here.
const PLACEHOLDER_EMAIL_DOMAINS = ["example.com", "example.org", "example.net", "test.com", "mailinator.com", "yourdomain.com"];

export function isValidEmail(value) {
  const trimmed = String(value ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const domain = trimmed.split("@")[1]?.toLowerCase();
  return !PLACEHOLDER_EMAIL_DOMAINS.includes(domain);
}

// Hospital staff password: at least 8 characters, one uppercase, one
// lowercase, one number, and one special character.
export function isValidPassword(value) {
  const v = String(value ?? "");
  return v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v);
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

export function isValidExperienceYears(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 60;
}