// Cookie-based auth session utilities

export type AuthSession = {
  sellerId: number;
  email: string;
  sellerSlug: string;
  storeName: string;
  role?: string;
};

// Client-side: fetch session from API
export async function fetchSession(): Promise<AuthSession | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session ?? null;
  } catch {
    return null;
  }
}

// Legacy compat — kept for components that still call these
export function getSession(): AuthSession | null {
  return null; // Now cookie-based, use fetchSession() instead
}

export function clearSession() {
  // Will be handled via /api/auth/logout
  fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function rememberEmail(email: string) {
  if (typeof window !== "undefined") localStorage.setItem("myshop_last_email", email);
}

export function getRememberedEmail() {
  return typeof window !== "undefined" ? localStorage.getItem("myshop_last_email") || "" : "";
}
