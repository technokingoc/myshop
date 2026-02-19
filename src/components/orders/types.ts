export type OrderStatus = "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

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
  // refund info
  refundStatus?: "none" | "requested" | "processing" | "completed";
  refundAmount?: string;
  refundReason?: string;
};

export type DateRange = "today" | "7d" | "30d" | "all";

export const STATUS_FLOW: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered"];
export const ALL_STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export const statusColorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  placed:     { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-500",  badge: "bg-slate-100 text-slate-700" },
  confirmed:  { bg: "bg-green-50",    text: "text-green-700",    border: "border-green-500",   badge: "bg-green-100 text-green-700" },
  processing: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-500",  badge: "bg-amber-100 text-amber-700" },
  shipped:    { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-500", badge: "bg-purple-100 text-purple-700" },
  delivered:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  cancelled:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-500",    badge: "bg-red-100 text-red-700" },
  // Legacy status mappings for backward compatibility
  new:        { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-500",  badge: "bg-slate-100 text-slate-700" },
  contacted:  { bg: "bg-green-50",    text: "text-green-700",    border: "border-green-500",   badge: "bg-green-100 text-green-700" },
  completed:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
};
