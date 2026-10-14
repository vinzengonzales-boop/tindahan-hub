// Owner password helpers. The password is never saved as plain text:
// we store a salted PBKDF2-SHA256 hash. This only protects the screen,
// not the stored data itself (see Settings page for limitations).

const SESSION_KEY = "ssm-unlocked";

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function makeSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export function validateNewPassword(pw: string, confirm: string): string | null {
  if (pw.length < 6) return "Password must be at least 6 characters.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
export function setUnlocked(v: boolean) {
  if (v) sessionStorage.setItem(SESSION_KEY, "1");
  else sessionStorage.removeItem(SESSION_KEY);
}
