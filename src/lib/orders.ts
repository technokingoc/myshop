export type OrderIntent = {
  id: string;
  customerName: string;
  customerContact: string;
  message: string;
  itemId: number | null;
  itemName: string;
  storeName: string;
  status: "new" | "contacted" | "completed";
  createdAt: string;
};

const STORAGE_KEY = "myshop_orders_v1";

export function getOrders(): OrderIntent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: OrderIntent) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function updateOrderStatus(id: string, status: OrderIntent["status"]) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
