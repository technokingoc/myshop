export type AuthSession = {
  email: string;
  sellerSlug?: string;
  loggedAt: string;
};

const KEY = "myshop_auth_v1";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function rememberEmail(email: string) {
  localStorage.setItem("myshop_last_email", email);
}

export function getRememberedEmail() {
  return typeof window !== "undefined" ? localStorage.getItem("myshop_last_email") || "" : "";
}
