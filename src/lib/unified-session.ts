import { cookies } from "next/headers";

const COOKIE_NAME = "myshop_auth";
const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";

// Unified session for both store owners and regular users
export type UnifiedSession = {
  userId: number;
  email: string;
  name: string;
  hasStore: boolean;
  storeId?: number;
  storeSlug?: string;
  storeName?: string;
  role?: string;
};

// Simple HMAC-based token: base64(payload).base64(signature)
async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${btoa(payload)}.${sigB64}`;
}

async function verify(token: string): Promise<string | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const payload = atob(payloadB64);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  return valid ? payload : null;
}

export async function createUnifiedSessionCookie(data: UnifiedSession) {
  const token = await sign(JSON.stringify(data));
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getUnifiedSession(): Promise<UnifiedSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verify(token);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as UnifiedSession;
  } catch {
    return null;
  }
}

export async function clearUnifiedSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  
  // Also clear legacy cookies to ensure clean transition
  jar.set("myshop_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  jar.set("myshop_customer", "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Utility functions for backward compatibility during migration
export function isStoreOwner(session: UnifiedSession | null): boolean {
  return session?.hasStore === true;
}

export function isLoggedIn(session: UnifiedSession | null): boolean {
  return session !== null;
}

// Helper to get store info from session
export function getStoreInfo(session: UnifiedSession | null): { storeId: number; storeSlug: string; storeName: string } | null {
  if (!session || !session.hasStore || !session.storeId || !session.storeSlug) {
    return null;
  }
  return {
    storeId: session.storeId,
    storeSlug: session.storeSlug,
    storeName: session.storeName || "My Store"
  };
}