import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL || "MyShop <onboarding@resend.dev>";

type Lang = "en" | "pt";

const statusLabels: Record<string, Record<Lang, string>> = {
  placed: { en: "Order Placed", pt: "Pedido Feito" },
  confirmed: { en: "Order Confirmed", pt: "Pedido Confirmado" },
  processing: { en: "Processing", pt: "Em processamento" },
  shipped: { en: "Shipped", pt: "Enviado" },
  delivered: { en: "Delivered", pt: "Entregue" },
  cancelled: { en: "Cancelled", pt: "Cancelado" },
  refunded: { en: "Refunded", pt: "Reembolsado" },
  // Legacy status labels
  new: { en: "Order Placed", pt: "Pedido Feito" },
  contacted: { en: "Order Confirmed", pt: "Pedido Confirmado" },
  completed: { en: "Delivered", pt: "Entregue" },
};

function statusLabel(status: string, lang: Lang) {
  return statusLabels[status]?.[lang] || status;
}

function wrap(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:32px">${body}</div><p style="text-align:center;margin-top:24px;font-size:12px;color:#94a3b8">MyShop • Powered by you</p></div></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email-dev] to=${to} subject=${subject}`);
    console.log(html.replace(/<[^>]+>/g, " ").substring(0, 300));
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: [to], subject, html });
  } catch (e) {
    console.error("[email-send-error]", e);
  }
}

type OrderDetails = {
  ref: string;
  customerName: string;
  items?: string;
  total?: string;
  sellerName?: string;
  trackUrl?: string;
};

export async function sendOrderConfirmation(
  customerEmail: string,
  details: OrderDetails,
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const subject = isEn
    ? `Order ${details.ref} confirmed`
    : `Pedido ${details.ref} confirmado`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Order Confirmed!" : "Pedido Confirmado!"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      ${isEn ? "Hi" : "Olá"} ${details.customerName},
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      ${isEn ? "Your order" : "O seu pedido"} <strong>${details.ref}</strong> ${isEn ? "has been received." : "foi recebido."}
    </p>
    ${details.items ? `<p style="color:#475569;font-size:14px;margin:0 0 8px"><strong>${isEn ? "Items" : "Itens"}:</strong> ${details.items}</p>` : ""}
    ${details.total ? `<p style="color:#475569;font-size:14px;margin:0 0 16px"><strong>Total:</strong> ${details.total}</p>` : ""}
    ${details.trackUrl ? `<a href="${details.trackUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${isEn ? "Track Order" : "Acompanhar Pedido"}</a>` : ""}
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">${isEn ? "The seller will contact you soon." : "O vendedor entrará em contacto em breve."}</p>
  `);

  await send(customerEmail, subject, html);
}

export async function sendNewOrderAlert(
  sellerEmail: string,
  details: OrderDetails,
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const subject = isEn
    ? `🛒 New order ${details.ref}`
    : `🛒 Novo pedido ${details.ref}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "New Order Received" : "Novo Pedido Recebido"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      <strong>${isEn ? "Customer" : "Cliente"}:</strong> ${details.customerName}
    </p>
    ${details.items ? `<p style="color:#475569;font-size:14px;margin:0 0 8px"><strong>${isEn ? "Items" : "Itens"}:</strong> ${details.items}</p>` : ""}
    ${details.total ? `<p style="color:#475569;font-size:14px;margin:0 0 16px"><strong>Total:</strong> ${details.total}</p>` : ""}
    <p style="color:#475569;font-size:14px;margin:0 0 16px">${isEn ? "Check your dashboard to manage this order." : "Verifique o seu painel para gerir este pedido."}</p>
  `);

  await send(sellerEmail, subject, html);
}

export async function sendOrderStatusUpdate(
  customerEmail: string,
  orderRef: string,
  newStatus: string,
  lang: Lang = "en",
  trackUrl?: string
) {
  const isEn = lang === "en";
  const label = statusLabel(newStatus, lang);
  const subject = isEn
    ? `Order ${orderRef} — ${label}`
    : `Pedido ${orderRef} — ${label}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Order Update" : "Atualização do Pedido"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      ${isEn ? "Your order" : "O seu pedido"} <strong>${orderRef}</strong> ${isEn ? "is now" : "está agora"}: 
      <span style="display:inline-block;background:#f1f5f9;padding:2px 10px;border-radius:99px;font-weight:600;color:#0f172a">${label}</span>
    </p>
    ${trackUrl ? `<a href="${trackUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${isEn ? "Track Order" : "Acompanhar Pedido"}</a>` : ""}
  `);

  await send(customerEmail, subject, html);
}
