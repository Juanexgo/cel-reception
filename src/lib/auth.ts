import 'dotenv/config'
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cookies } from "next/headers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const SESSION_COOKIE = "cr_session";

export async function createSession(user: { id: string; email: string; name: string; role: string }) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64");
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const value = `${payload}.${expiry}`;
  const signed = await signCookie(value);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie) return null;

  try {
    const verified = await verifyCookie(cookie.value);
    const [payload, expiry] = verified.split(".");
    if (new Date(expiry) < new Date()) return null;
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function signCookie(value: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const sigBase64 = Buffer.from(signature).toString("base64");
  return `${value}.${sigBase64}`;
}

async function verifyCookie(signed: string): Promise<string> {
  const parts = signed.split(".");
  const sigBase64 = parts.pop();
  const value = parts.join(".");
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = Buffer.from(sigBase64!, "base64");
  const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(value));
  if (!isValid) throw new Error("Invalid signature");
  return value;
}

export async function getCurrentUserWithRole() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  return user;
}
