export type OrderStatus = "new" | "contacted" | "processing" | "shipped" | "completed" | "cancelled";

export type StatusHistoryEntry = { status: string; at: string; note?: string };

export type OrderItem = {
  id: string;
  customerName: string;
  customerContact: string;
  message: string;
  itemId: number | null;
  itemName: string;
  itemType?: string;
  itemPrice?: string;
  storeName: string;
  status: OrderStatus;
  notes?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  // admin fields
  sellerName?: string;
  sellerSlug?: string;
};

export type DateRange = "today" | "7d" | "30d" | "all";

export const STATUS_FLOW: OrderStatus[] = ["new", "contacted", "processing", "shipped", "completed"];
export const ALL_STATUSES: OrderStatus[] = ["new", "contacted", "processing", "shipped", "completed", "cancelled"];

export const statusColorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  new:        { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-500",   badge: "bg-blue-100 text-blue-700" },
  contacted:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-500",  badge: "bg-amber-100 text-amber-700" },
  processing: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-500", badge: "bg-orange-100 text-orange-700" },
  shipped:    { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-500", badge: "bg-purple-100 text-purple-700" },
  completed:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  cancelled:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-500",    badge: "bg-red-100 text-red-700" },
};
