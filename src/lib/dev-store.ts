import fs from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "db", "dev-store.json");

type PaymentStatus = "pending" | "paid" | "failed" | "manual";

export type DevStore = {
  payments: Record<string, { status: PaymentStatus; externalUrl?: string; updatedAt: string }>;
  emailLog: Array<{ to: string; subject: string; body: string; createdAt: string }>;
};

const initial: DevStore = {
  payments: {},
  emailLog: [],
};

export async function readDevStore(): Promise<DevStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return { ...initial, ...(JSON.parse(raw) as Partial<DevStore>) };
  } catch {
    return initial;
  }
}

export async function writeDevStore(next: DevStore) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
}

export async function upsertPaymentStatus(
  orderId: number,
  status: PaymentStatus,
  externalUrl?: string,
) {
  const store = await readDevStore();
  store.payments[String(orderId)] = {
    status,
    externalUrl,
    updatedAt: new Date().toISOString(),
  };
  await writeDevStore(store);
  return store.payments[String(orderId)];
}

export async function getPaymentStatus(orderId: number) {
  const store = await readDevStore();
  return store.payments[String(orderId)] || null;
}

export async function appendEmailLog(to: string, subject: string, body: string) {
  const store = await readDevStore();
  store.emailLog.unshift({ to, subject, body, createdAt: new Date().toISOString() });
  store.emailLog = store.emailLog.slice(0, 200);
  await writeDevStore(store);
}
