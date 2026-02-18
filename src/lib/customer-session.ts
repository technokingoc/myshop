import { cookies } from "next/headers";

const COOKIE_NAME = "myshop_customer";
const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";

async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET + "_customer"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${btoa(payload)}.${sigB64}`;
}

async function verify(token: string): Promise<string | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  const payload = atob(payloadB64);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET + "_customer"), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  return valid ? payload : null;
}

export type CustomerSession = {
  customerId: number;
  email: string;
  name: string;
};

export async function createCustomerSessionCookie(data: CustomerSession) {
  const token = await sign(JSON.stringify(data));
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verify(token);
  if (!payload) return null;
  try {
    return JSON.parse(payload) as CustomerSession;
  } catch {
    return null;
  }
}

export async function clearCustomerSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}
