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

export async function sendLowStockAlert(
  sellerEmail: string,
  productName: string,
  currentStock: number,
  threshold: number,
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const subject = isEn
    ? `⚠️ Low Stock Alert: ${productName}`
    : `⚠️ Alerta de Estoque Baixo: ${productName}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Low Stock Alert" : "Alerta de Estoque Baixo"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      <strong>${isEn ? "Product" : "Produto"}:</strong> ${productName}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 8px">
      <strong>${isEn ? "Current Stock" : "Estoque Atual"}:</strong> ${currentStock} ${isEn ? "items" : "itens"}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 16px">
      <strong>${isEn ? "Low Stock Threshold" : "Limite de Estoque Baixo"}:</strong> ${threshold} ${isEn ? "items" : "itens"}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 16px">
      ${isEn ? "Consider restocking to avoid running out." : "Considere repor o estoque para evitar ficar sem produtos."}
    </p>
  `);

  await send(sellerEmail, subject, html);
}

export async function sendOutOfStockAlert(
  sellerEmail: string,
  productName: string,
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const subject = isEn
    ? `🚨 Out of Stock: ${productName}`
    : `🚨 Sem Estoque: ${productName}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Out of Stock Alert" : "Alerta Sem Estoque"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      <strong>${isEn ? "Product" : "Produto"}:</strong> ${productName}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 16px">
      ${isEn ? "This product is now out of stock. Customers won't be able to purchase it until you restock." : "Este produto está agora sem estoque. Os clientes não poderão comprá-lo até que você reponha."}
    </p>
  `);

  await send(sellerEmail, subject, html);
}

export async function sendNewReviewAlert(
  sellerEmail: string,
  productName: string,
  customerName: string,
  rating: number,
  reviewContent: string,
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const subject = isEn
    ? `⭐ New Review: ${productName}`
    : `⭐ Nova Avaliação: ${productName}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "New Product Review" : "Nova Avaliação de Produto"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      <strong>${isEn ? "Product" : "Produto"}:</strong> ${productName}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 8px">
      <strong>${isEn ? "Customer" : "Cliente"}:</strong> ${customerName}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 8px">
      <strong>${isEn ? "Rating" : "Avaliação"}:</strong> ${stars} (${rating}/5)
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;font-style:italic">
        "${reviewContent}"
      </p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">
      ${isEn ? "Check your dashboard to manage this review." : "Verifique o seu painel para gerir esta avaliação."}
    </p>
  `);

  await send(sellerEmail, subject, html);
}

export async function sendRestockReminder(
  sellerEmail: string,
  productName: string,
  currentStock: number,
  triggerQuantity: number,
  targetQuantity: number,
  supplierName: string = '',
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  const subject = isEn
    ? `🔄 Restock Reminder: ${productName}`
    : `🔄 Lembrete de Reposição: ${productName}`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Restock Reminder" : "Lembrete de Reposição"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      <strong>${isEn ? "Product" : "Produto"}:</strong> ${productName}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 8px">
      <strong>${isEn ? "Current Stock" : "Estoque Atual"}:</strong> ${currentStock} ${isEn ? "items" : "itens"}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 8px">
      <strong>${isEn ? "Reorder Point" : "Ponto de Reposição"}:</strong> ${triggerQuantity} ${isEn ? "items" : "itens"}
    </p>
    <p style="color:#475569;font-size:14px;margin:0 0 16px">
      <strong>${isEn ? "Suggested Reorder Quantity" : "Quantidade Sugerida"}:</strong> ${targetQuantity} ${isEn ? "items" : "itens"}
    </p>
    
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:16px 0">
      <p style="color:#92400e;font-size:14px;line-height:1.6;margin:0;font-weight:600">
        ${isEn ? "⚠️ Time to Restock!" : "⚠️ Hora de Repor!"}
      </p>
      <p style="color:#92400e;font-size:14px;line-height:1.6;margin:4px 0 0">
        ${isEn 
          ? "Your product stock has reached the reorder point. Consider placing an order to avoid running out."
          : "O estoque do seu produto chegou ao ponto de reposição. Considere fazer um pedido para evitar ficar sem produtos."
        }
      </p>
    </div>

    ${supplierName ? `
      <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:16px 0">
        <p style="color:#0369a1;font-size:14px;line-height:1.6;margin:0 0 4px;font-weight:600">
          ${isEn ? "💡 Quick Action" : "💡 Ação Rápida"}
        </p>
        <p style="color:#0369a1;font-size:14px;line-height:1.6;margin:0">
          ${isEn ? "Contact your supplier" : "Entre em contacto com o seu fornecedor"}: <strong>${supplierName}</strong>
        </p>
      </div>
    ` : ''}
    
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">
      ${isEn 
        ? "You can manage restock reminders and view stock history in your dashboard inventory section."
        : "Pode gerir lembretes de reposição e ver o histórico de estoque na secção de inventário do seu painel."
      }
    </p>
  `);

  await send(sellerEmail, subject, html);
}

export async function sendReviewRequestEmail(
  customerEmail: string,
  details: {
    customerName: string;
    storeName: string;
    orderRef: string;
    orderItems: Array<{
      productId: number;
      productName: string;
      productImage?: string;
    }>;
    reviewUrl: string;
  },
  lang: Lang = "en"
) {
  const isEn = lang === "en";
  
  const subject = isEn
    ? `How was your experience with ${details.storeName}?`
    : `Como foi a sua experiência com ${details.storeName}?`;

  const itemsList = details.orderItems.length > 0 
    ? details.orderItems.map(item => `<li>${item.productName}</li>`).join('')
    : `<li>${isEn ? 'Your recent purchase' : 'A sua compra recente'}</li>`;

  const html = wrap(`
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${isEn ? "Share Your Experience!" : "Partilhe a Sua Experiência!"}</h1>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">
      ${isEn ? "Hi" : "Olá"} ${details.customerName},
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
      ${isEn 
        ? `We hope you're enjoying your recent purchase from ${details.storeName}! Your feedback helps other customers make informed decisions and helps sellers improve their service.`
        : `Esperamos que esteja a gostar da sua compra recente em ${details.storeName}! O seu feedback ajuda outros clientes a tomar decisões informadas e ajuda os vendedores a melhorar o seu serviço.`
      }
    </p>
    
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
      <p style="color:#475569;font-size:14px;margin:0 0 8px"><strong>${isEn ? 'Order:' : 'Pedido:'}</strong> ${details.orderRef}</p>
      <p style="color:#475569;font-size:14px;margin:0 0 8px"><strong>${isEn ? 'Items:' : 'Itens:'}</strong></p>
      <ul style="color:#475569;font-size:14px;margin:8px 0 0 20px;padding:0">
        ${itemsList}
      </ul>
    </div>
    
    <div style="text-align:center;margin:24px 0">
      <a href="${details.reviewUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600">
        ${isEn ? "⭐ Write a Review" : "⭐ Escrever Avaliação"}
      </a>
    </div>
    
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;text-align:center">
      ${isEn 
        ? "Your review helps build trust in our marketplace community. Thank you for your time!" 
        : "A sua avaliação ajuda a construir confiança na nossa comunidade de marketplace. Obrigado pelo seu tempo!"
      }
    </p>
  `);

  await send(customerEmail, subject, html);
}
