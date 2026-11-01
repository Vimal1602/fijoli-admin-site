/** Browser-only gate — not Fijoli member sign-in. */
export const ADMIN_USERNAME = "Admin";
export const ADMIN_PASSWORD = "Admin@123";

const SESSION_KEY = "fijoli_admin_local_session";

export function validateAdminLogin(username: string, password: string): boolean {
  const trimmed = username.trim();
  const digits = trimmed.replace(/\D/g, "");
  const looksLikePhone =
    trimmed.startsWith("+") ||
    (digits.length >= 10 && digits.length <= 13 && /^\d+$/.test(digits));
  if (looksLikePhone) return false;
  return trimmed.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD;
}

export function setAdminSession(): void {
  localStorage.setItem(SESSION_KEY, "1");
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(SESSION_KEY) === "1";
}
