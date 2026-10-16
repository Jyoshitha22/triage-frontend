const ACCOUNTS_KEY = 'triage.localStaffAccounts';

function readAccounts() {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function accountKey(role, email) {
  return `${role}:${String(email).trim().toLowerCase()}`;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, salt) {
  const key = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
}

export function getLocalStaffAccount(role, email) {
  return readAccounts()[accountKey(role, email)] || null;
}

export function updateLocalStaffProfile(role, email, profile) {
  const accounts = readAccounts();
  const key = accountKey(role, email);
  const account = accounts[key];
  if (!account) return false;
  accounts[key] = { ...account, profile };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return true;
}

export async function saveLocalStaffAccount(role, email, password, profile) {
  const accounts = readAccounts();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);
  accounts[accountKey(role, email)] = {
    email: String(email).trim().toLowerCase(),
    salt: toBase64(salt),
    passwordHash: toBase64(passwordHash),
    profile,
  };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function verifyLocalStaffPassword(role, email, password) {
  const account = getLocalStaffAccount(role, email);
  if (!account) return false;
  const salt = Uint8Array.from(atob(account.salt), (character) => character.charCodeAt(0));
  const expectedHash = account.passwordHash;
  const suppliedHash = toBase64(await hashPassword(password, salt));
  return suppliedHash === expectedHash;
}

export async function updateLocalStaffPassword(role, email, password) {
  const account = getLocalStaffAccount(role, email);
  if (!account) return false;
  await saveLocalStaffAccount(role, email, password, account.profile);
  return true;
}
