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

// Server-side: get seller ID from session (cookie-based)
export async function getSellerFromSession(request: Request): Promise<number | null> {
  try {
    // Get session cookie
    const cookies = request.headers.get('cookie');
    if (!cookies) return null;
    
    // Parse the session - this is a simplified version
    // In a real implementation, you'd validate and decrypt the session properly
    const sessionMatch = cookies.match(/myshop_session=([^;]+)/);
    if (!sessionMatch) return null;
    
    // For now, let's fetch from the me endpoint internally
    // In a production app, you'd decrypt the session cookie directly
    const baseUrl = request.url.includes('localhost') 
      ? 'http://localhost:3000' 
      : request.headers.get('origin') || '';
    
    const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        cookie: cookies,
      },
    });
    
    if (!sessionResponse.ok) return null;
    
    const sessionData = await sessionResponse.json();
    return sessionData.session?.sellerId || null;
  } catch (error) {
    console.error('Error getting seller from session:', error);
    return null;
  }
}

// Server-side: check authentication and return user info for API routes
export async function checkAuth(): Promise<any | null> {
  try {
    // This is a simplified implementation for messaging API
    // In production, this would properly validate the session from cookies
    
    // For now, we'll return a mock user for development
    // In real implementation, you'd extract user info from session cookies
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      hasStore: true
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
}

export const auth = fetchSession;
