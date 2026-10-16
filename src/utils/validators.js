import { VALID_TLDS } from "./validTlds.js";

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

const COMMON_EMAIL_PROVIDER_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
  "yandex.com",
];

function isCloseTypo(domain, knownDomain) {
  if (Math.abs(domain.length - knownDomain.length) > 2) return false;

  let previous = Array.from({ length: knownDomain.length + 1 }, (_, i) => i);
  for (let row = 1; row <= domain.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= knownDomain.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (domain[row - 1] === knownDomain[column - 1] ? 0 : 1),
      );
    }
    if (Math.min(...current) > 2) return false;
    previous = current;
  }
  return previous[knownDomain.length] <= 2;
}

export function isValidEmail(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length > 254 || !/^[^@\s]+@[^@\s]+$/.test(trimmed)) return false;
  const [local, rawDomain] = trimmed.split("@");
  if (
    local.length > 64 ||
    !/^[a-z\d.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) return false;

  const domain = rawDomain.toLowerCase();
  const labels = domain.split(".");
  if (
    domain.length > 253 ||
    labels.length < 2 ||
    labels.some((label) => (
      label.length > 63 ||
      !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
    )) ||
    labels[labels.length - 1].length < 2 ||
    !/[a-z]/i.test(labels[labels.length - 1])
  ) return false;
  if (!VALID_TLDS.has(labels[labels.length - 1])) return false;
  if (COMMON_EMAIL_PROVIDER_DOMAINS.some((provider) => {
    const [providerLabel, providerTld] = provider.split(".");
    return domain !== provider &&
      labels[0][0] === providerLabel[0] &&
      isCloseTypo(labels[0], providerLabel) &&
      isCloseTypo(labels[labels.length - 1], providerTld);
  })) return false;
  return true;
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
// Letters in ANY language (English, Telugu, Hindi, Tamil…), spaces, and the
// common name punctuation (O'Brien, Anne-Marie).
export function isValidName(value) {
  return /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u.test(String(value ?? "").trim());
}

export function isValidExperienceYears(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 60;
}