// Delivery notification service for SMS and email alerts
import { getDb } from "@/lib/db";
import { deliveryStatusChanges, orders } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { sendOrderStatusUpdate } from "@/lib/email-service";

export type DeliveryStatusChangeType = {
  orderId: number;
  sellerId: number;
  customerId?: number;
  oldStatus: string;
  newStatus: string;
  customerName: string;
  customerContact: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
};

// Status change messages for notifications
const statusMessages: Record<string, { 
  en: { title: string; message: string; sms: string }; 
  pt: { title: string; message: string; sms: string } 
}> = {
  confirmed: {
    en: {
      title: "Order Confirmed",
      message: "Your order has been confirmed and is being prepared for shipping.",
      sms: "MyShop: Your order has been confirmed and is being prepared."
    },
    pt: {
      title: "Pedido Confirmado", 
      message: "O seu pedido foi confirmado e está a ser preparado para envio.",
      sms: "MyShop: O seu pedido foi confirmado e está a ser preparado."
    }
  },
  preparing: {
    en: {
      title: "Order Being Prepared",
      message: "Your order is currently being prepared and will be shipped soon.",
      sms: "MyShop: Your order is being prepared for shipping."
    },
    pt: {
      title: "Pedido em Preparação",
      message: "O seu pedido está a ser preparado e será enviado em breve.",
      sms: "MyShop: O seu pedido está a ser preparado para envio."
    }
  },
  shipped: {
    en: {
      title: "Order Shipped",
      message: "Your order has been shipped and is on its way to you.",
      sms: "MyShop: Your order has been shipped and is on its way."
    },
    pt: {
      title: "Pedido Enviado",
      message: "O seu pedido foi enviado e está a caminho.",
      sms: "MyShop: O seu pedido foi enviado e está a caminho."
    }
  },
  'in-transit': {
    en: {
      title: "Order In Transit",
      message: "Your order is currently in transit and will be delivered soon.",
      sms: "MyShop: Your order is in transit and will be delivered soon."
    },
    pt: {
      title: "Pedido em Trânsito",
      message: "O seu pedido está em trânsito e será entregue em breve.",
      sms: "MyShop: O seu pedido está em trânsito e será entregue em breve."
    }
  },
  delivered: {
    en: {
      title: "Order Delivered",
      message: "Your order has been delivered. Please confirm receipt when convenient.",
      sms: "MyShop: Your order has been delivered. Please confirm receipt."
    },
    pt: {
      title: "Pedido Entregue",
      message: "O seu pedido foi entregue. Por favor confirme o recebimento quando possível.",
      sms: "MyShop: O seu pedido foi entregue. Por favor confirme o recebimento."
    }
  },
  cancelled: {
    en: {
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you have any questions, please contact the seller.",
      sms: "MyShop: Your order has been cancelled."
    },
    pt: {
      title: "Pedido Cancelado",
      message: "O seu pedido foi cancelado. Se tiver dúvidas, entre em contacto com o vendedor.",
      sms: "MyShop: O seu pedido foi cancelado."
    }
  }
};

export async function notifyDeliveryStatusChange(statusChange: DeliveryStatusChangeType): Promise<void> {
  try {
    const db = getDb();
    
    // Determine customer's preferred language (default to Portuguese for Mozambique)
    const language = 'pt'; // In a real implementation, this would be fetched from customer preferences
    
    const messageData = statusMessages[statusChange.newStatus];
    if (!messageData) {
      console.warn(`No message template for status: ${statusChange.newStatus}`);
      return;
    }

    const messages = messageData[language] || messageData.en;
    
    // Prepare notification content
    let messageContent = messages.message;
    let smsContent = messages.sms;
    
    // Add tracking information if available
    if (statusChange.trackingNumber) {
      if (language === 'pt') {
        messageContent += ` Número de rastreio: ${statusChange.trackingNumber}`;
        smsContent += ` Rastreio: ${statusChange.trackingNumber}`;
      } else {
        messageContent += ` Tracking number: ${statusChange.trackingNumber}`;
        smsContent += ` Tracking: ${statusChange.trackingNumber}`;
      }
    }
    
    // Add estimated delivery if available
    if (statusChange.estimatedDelivery) {
      const deliveryDate = statusChange.estimatedDelivery.toLocaleDateString('pt-MZ');
      if (language === 'pt') {
        messageContent += ` Entrega estimada: ${deliveryDate}`;
      } else {
        messageContent += ` Estimated delivery: ${deliveryDate}`;
      }
    }

    // Log the status change
    const logEntry = await db.insert(deliveryStatusChanges).values({
      orderId: statusChange.orderId,
      sellerId: statusChange.sellerId,
      customerId: statusChange.customerId || null,
      oldStatus: statusChange.oldStatus,
      newStatus: statusChange.newStatus,
      changeReason: statusChange.notes || '',
      customerPhone: isPhoneNumber(statusChange.customerContact) ? statusChange.customerContact : '',
      customerEmail: isEmail(statusChange.customerContact) ? statusChange.customerContact : '',
      customerName: statusChange.customerName,
    }).returning({ id: deliveryStatusChanges.id });

    const logId = logEntry[0]?.id;
    
    // Determine notification methods based on contact information
    const isPhone = isPhoneNumber(statusChange.customerContact);
    const isEmailAddress = isEmail(statusChange.customerContact);
    
    // Send SMS notification
    if (isPhone) {
      try {
        const { sendSMS } = await import('@/lib/sms-service');
        const smsResult = await sendSMS({
          to: statusChange.customerContact,
          message: smsContent,
          orderId: statusChange.orderId,
        });
        
        // Update log to mark SMS as sent
        if (logId) {
          await db
            .update(deliveryStatusChanges)
            .set({
              smsSent: smsResult.success,
              smsSentAt: smsResult.success ? new Date() : null,
            })
            .where(eq(deliveryStatusChanges.id, logId));
        }
        
        if (smsResult.success) {
          console.log(`SMS notification sent for order ${statusChange.orderId}: ${smsResult.messageId}`);
        } else {
          console.error(`Failed to send SMS for order ${statusChange.orderId}: ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error(`SMS service error for order ${statusChange.orderId}:`, smsError);
      }
    }
    
    // Send email notification
    if (isEmailAddress) {
      try {
        await sendOrderStatusUpdate(
          statusChange.customerContact,
          `ORD-${statusChange.orderId}`,
          statusChange.newStatus,
          'pt',
          `/track/ORD-${statusChange.orderId}`
        );
        
        // Update log to mark email as sent
        if (logId) {
          await db
            .update(deliveryStatusChanges)
            .set({
              emailSent: true,
              emailSentAt: new Date(),
            })
            .where(eq(deliveryStatusChanges.id, logId));
        }
        
        console.log(`Email notification sent for order ${statusChange.orderId}`);
      } catch (emailError) {
        console.error(`Failed to send email for order ${statusChange.orderId}:`, emailError);
      }
    }
    
  } catch (error) {
    console.error('Error in notifyDeliveryStatusChange:', error);
    throw error;
  }
}

// Helper function to detect if a contact string is a phone number
function isPhoneNumber(contact: string): boolean {
  // Basic phone number pattern - starts with + or digit, contains mostly digits, spaces, hyphens, parentheses
  const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,}$/;
  return phonePattern.test(contact.trim()) && !contact.includes('@');
}

// Helper function to detect if a contact string is an email
function isEmail(contact: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(contact.trim());
}

// Function to send delivery confirmation reminders
export async function sendDeliveryConfirmationReminder(orderId: number): Promise<void> {
  try {
    const db = getDb();
    
    // Get order details
    const orderResult = await db
      .select({
        id: orders.id,
        sellerId: orders.sellerId,
        customerId: orders.customerId,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
        status: orders.status,
        deliveryConfirmed: orders.deliveryConfirmed,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
      
    if (orderResult.length === 0 || orderResult[0].status !== 'delivered' || orderResult[0].deliveryConfirmed) {
      return; // Order not found, not delivered, or already confirmed
    }
    
    const order = orderResult[0];
    const language = 'pt'; // Default to Portuguese
    
    const reminderMessages = {
      pt: {
        title: "Confirme o Recebimento do Seu Pedido",
        message: `Olá ${order.customerName}, esperamos que tenha recebido o seu pedido com sucesso. Por favor, confirme o recebimento para nos ajudar a melhorar o nosso serviço.`,
        sms: `MyShop: Por favor confirme o recebimento do seu pedido. Link: /track/ORD-${order.id}`
      },
      en: {
        title: "Please Confirm Receipt of Your Order", 
        message: `Hello ${order.customerName}, we hope you received your order successfully. Please confirm receipt to help us improve our service.`,
        sms: `MyShop: Please confirm receipt of your order. Link: /track/ORD-${order.id}`
      }
    };
    
    const messages = reminderMessages[language] || reminderMessages.en;
    
    // Send reminder via appropriate channel
    if (isEmail(order.customerContact)) {
      await sendOrderStatusUpdate(
        order.customerContact,
        `ORD-${order.id}`,
        'delivered',
        'pt',
        `/track/ORD-${order.id}`
      );
    } else if (isPhoneNumber(order.customerContact)) {
      const { sendSMS } = await import('@/lib/sms-service');
      await sendSMS({
        to: order.customerContact,
        message: messages.sms,
        orderId: order.id,
      });
    }
    
    console.log(`Delivery confirmation reminder sent for order ${orderId}`);
    
  } catch (error) {
    console.error(`Error sending delivery confirmation reminder for order ${orderId}:`, error);
    throw error;
  }
}

// Function to get delivery notification statistics
export async function getDeliveryNotificationStats(sellerId: number, days: number = 30) {
  try {
    const db = getDb();
    const dateFrom = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    
    const stats = await db
      .select({
        totalNotifications: sql<number>`COUNT(*)`,
        smsNotifications: sql<number>`COUNT(*) FILTER (WHERE sms_sent = true)`,
        emailNotifications: sql<number>`COUNT(*) FILTER (WHERE email_sent = true)`,
        failedNotifications: sql<number>`COUNT(*) FILTER (WHERE sms_sent = false AND email_sent = false)`,
      })
      .from(deliveryStatusChanges)
      .where(and(
        eq(deliveryStatusChanges.sellerId, sellerId),
        gte(deliveryStatusChanges.createdAt, dateFrom)
      ));
      
    return stats[0] || {
      totalNotifications: 0,
      smsNotifications: 0, 
      emailNotifications: 0,
      failedNotifications: 0,
    };
    
  } catch (error) {
    console.error('Error fetching delivery notification stats:', error);
    return {
      totalNotifications: 0,
      smsNotifications: 0,
      emailNotifications: 0, 
      failedNotifications: 0,
    };
  }
}