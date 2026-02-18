export type AppEventType = "order:new" | "order:status" | "payment:status";

export type AppEvent = {
  id: string;
  type: AppEventType;
  sellerId: number;
  message: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type Listener = (event: AppEvent) => void;

const listeners = new Set<Listener>();

export function emitEvent(event: Omit<AppEvent, "id" | "createdAt">) {
  const full: AppEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  listeners.forEach((listener) => {
    try {
      listener(full);
    } catch {
      // no-op
    }
  });

  return full;
}

export function subscribeEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
