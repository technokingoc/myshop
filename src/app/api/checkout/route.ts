import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems, coupons } from "@/lib/schema";
import { getCustomerSession } from "@/lib/customer-session";
import { eq, and } from "drizzle-orm";
import { CartItem, CartAddress } from "@/lib/cart";
import { sendEmail } from "@/lib/email";
import { paymentService } from "@/lib/payment-service";

interface ShippingMethod {
  id: number;
  name: string;
  type: string;
  cost: number;
  estimatedDays: number;
}

export interface CheckoutRequest {
  items: CartItem[];
  shippingAddress: CartAddress;
  billingAddress?: CartAddress;
  shippingMethod?: ShippingMethod;
  paymentMethod: 'bank_transfer' | 'cash_on_delivery' | 'mpesa';
  customerPhone?: string; // Required for M-Pesa
  notes?: string;
  couponCode?: string;
  guestCheckout?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CheckoutRequest;
    const { items, shippingAddress, billingAddress, shippingMethod, paymentMethod, customerPhone, notes, couponCode, guestCheckout } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    
    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }
    
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    // Validate payment method
    if (!["bank_transfer", "cash_on_delivery", "mpesa"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    // Validate phone number for M-Pesa
    if (paymentMethod === "mpesa" && !customerPhone) {
      return NextResponse.json({ error: "Phone number is required for M-Pesa payments" }, { status: 400 });
    }
    
    // Get customer session (if not guest checkout)
    let customerId: number | undefined;
    if (!guestCheckout) {
      const customerSession = await getCustomerSession();
      customerId = customerSession?.customerId;
    }
    
    // Validate items exist and calculate totals
    const db = getDb();
    const itemValidation = await Promise.all(
      items.map(async (item) => {
        const product = await db.select().from(catalogItems)
          .where(eq(catalogItems.id, item.id))
          .limit(1);
          
        if (product.length === 0) {
          throw new Error(`Product ${item.id} not found`);
        }
        
        const productData = product[0];
        
        // Check stock if tracking inventory
        if (productData.trackInventory && productData.stockQuantity !== null) {
          if (productData.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${productData.name}`);
          }
        }
        
        return { ...item, productData };
      })
    );
    
    // Apply coupon if provided
    let discountAmount = 0;
    let couponRecord = null;
    if (couponCode) {
      const couponQuery = await db.select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, couponCode),
            eq(coupons.active, true)
          )
        )
        .limit(1);
      
      if (couponQuery.length > 0) {
        couponRecord = couponQuery[0];
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Check if coupon is still valid
        const now = new Date();
        const validFrom = couponRecord.validFrom ? new Date(couponRecord.validFrom) : null;
        const validUntil = couponRecord.validUntil ? new Date(couponRecord.validUntil) : null;
        
        if (validFrom && now < validFrom) {
          return NextResponse.json({ error: "Coupon is not yet valid" }, { status: 400 });
        }
        
        if (validUntil && now > validUntil) {
          return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
        }
        
        // Check minimum order amount
        if (couponRecord.minOrderAmount && subtotal < Number(couponRecord.minOrderAmount)) {
          return NextResponse.json({ error: `Minimum order amount of ${couponRecord.minOrderAmount} required` }, { status: 400 });
        }
        
        // Check usage limits
        const usedCount = couponRecord.usedCount || 0;
        const maxUses = couponRecord.maxUses || -1;
        if (maxUses !== -1 && usedCount >= maxUses) {
          return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
        }
        
        // Calculate discount
        if (couponRecord.type === 'percentage') {
          discountAmount = subtotal * (Number(couponRecord.value) / 100);
        } else {
          discountAmount = Number(couponRecord.value);
        }
        
        // Don't allow discount to exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);
      }
    }
    
    // Group items by store (sellers)
    const storeGroups = new Map<number, { seller: any; items: typeof itemValidation }>();
    
    for (const item of itemValidation) {
      if (!storeGroups.has(item.storeId)) {
        const seller = await db.select()
          .from(sellers)
          .where(eq(sellers.id, item.storeId))
          .limit(1);
          
        if (seller.length === 0) {
          throw new Error(`Store ${item.storeId} not found`);
        }
        
        storeGroups.set(item.storeId, {
          seller: seller[0],
          items: []
        });
      }
      
      storeGroups.get(item.storeId)!.items.push(item);
    }
    
    // Create orders for each store
    const createdOrders = [];
    const trackingTokens = [];
    
    for (const [storeId, { seller, items: storeItems }] of storeGroups) {
      // Generate unique tracking token
      const trackingToken = `TK${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      // Calculate store order total
      const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalOrderValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Proportionally apply discount to this store's order
      const storeDiscountAmount = totalOrderValue > 0 ? 
        (discountAmount * storeSubtotal / totalOrderValue) : 0;
      
      // Calculate estimated delivery date
      const estimatedDelivery = shippingMethod ? 
        new Date(Date.now() + (shippingMethod.estimatedDays * 24 * 60 * 60 * 1000)) : null;

      // Create order record
      const orderData = {
        sellerId: storeId,
        customerName: shippingAddress.name,
        customerContact: `Email: ${shippingAddress.email}\nPhone: ${shippingAddress.phone}\nAddress: ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.country}`,
        message: [
          notes && `Notes: ${notes}`,
          `Payment method: ${paymentMethod}`,
          shippingMethod && `Shipping: ${shippingMethod.name} ($${shippingMethod.cost.toFixed(2)})`,
          billingAddress && billingAddress !== shippingAddress ? 
            `Billing address: ${billingAddress.address}, ${billingAddress.city}, ${billingAddress.country}` : null,
          `Items ordered:\n${storeItems.map(item => 
            `- ${item.name}${item.variantName ? ` (${item.variantName})` : ''} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
          ).join('\n')}`
        ].filter(Boolean).join('\n\n'),
        status: 'placed',
        statusHistory: [{
          status: 'placed',
          at: new Date().toISOString(),
          note: 'Order placed via checkout'
        }],
        couponCode: couponCode || '',
        discountAmount: storeDiscountAmount.toString(),
        customerId: customerId,
        trackingToken: trackingToken,
        // Shipping fields
        shippingMethodId: shippingMethod?.id,
        shippingCost: shippingMethod?.cost?.toString() || '0',
        shippingAddress: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          country: shippingAddress.country
        },
        estimatedDelivery,
        createdAt: new Date(),
      };
      
      const [order] = await db.insert(orders).values(orderData).returning();
      
      // Update stock quantities if tracking
      for (const item of storeItems) {
        if (item.productData.trackInventory && item.productData.stockQuantity !== null) {
          await db.update(catalogItems)
            .set({ 
              stockQuantity: Math.max(0, item.productData.stockQuantity - item.quantity)
            })
            .where(eq(catalogItems.id, item.id));
        }
      }
      
      createdOrders.push({
        order,
        seller,
        items: storeItems
      });
      
      trackingTokens.push(trackingToken);
    }
    
    // Update coupon usage count
    if (couponRecord) {
      const currentUsedCount = couponRecord.usedCount || 0;
      await db.update(coupons)
        .set({ 
          usedCount: currentUsedCount + 1
        })
        .where(eq(coupons.id, couponRecord.id));
    }
    
    // Send confirmation email
    try {
      await sendOrderConfirmationEmail({
        customerEmail: shippingAddress.email,
        customerName: shippingAddress.name,
        orders: createdOrders,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        shippingMethod,
        paymentMethod,
        discountAmount,
        couponCode,
        trackingTokens
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire order if email fails
    }
    
    // Send notification emails to sellers
    for (const { seller, order, items } of createdOrders) {
      if (seller.emailNotifications) {
        try {
          await sendSellerNotificationEmail({
            sellerEmail: seller.email,
            sellerName: seller.name || seller.ownerName,
            order,
            items,
            customerInfo: {
              name: shippingAddress.name,
              email: shippingAddress.email,
              phone: shippingAddress.phone,
              address: shippingAddress.address,
              city: shippingAddress.city,
              country: shippingAddress.country
            }
          });
        } catch (emailError) {
          console.error(`Failed to send notification email to seller ${seller.email}:`, emailError);
        }
      }
    }

    // Create payment records for orders that require payment
    const paymentResults = [];
    if (paymentMethod !== "cash_on_delivery") {
      for (const { order } of createdOrders) {
        try {
          // Calculate order total from shipping address and items
          const orderTotal = order.message?.match(/\$(\d+\.\d+)/)?.[1];
          let amount = parseFloat(orderTotal || "0") || 0;
          
          // Convert USD to MZN (approximate rate: 1 USD = 64 MZN)
          const usdToMzn = 64;
          amount = Math.round(amount * usdToMzn * 100) / 100;

          if (amount <= 0) continue; // Skip if no valid amount

          // Create payment using existing service
          const paymentRequest = {
            orderId: order.id,
            sellerId: order.sellerId,
            customerId: order.customerId || undefined,
            method: paymentMethod as "mpesa" | "bank_transfer",
            amount,
            currency: "MZN",
            customerPhone,
            customerName: shippingAddress.name,
            customerEmail: shippingAddress.email,
            metadata: {
              provider: paymentMethod === "mpesa" ? "vodacom" : undefined, // Default to Vodacom for M-Pesa
              checkoutTimestamp: new Date().toISOString(),
            },
          };

          const paymentResult = await paymentService.createPayment(paymentRequest);

          paymentResults.push({
            orderId: order.id,
            payment: {
              id: paymentResult.id,
              method: paymentMethod,
              status: paymentResult.status,
              amount: amount.toString(),
              currency: "MZN",
              externalId: paymentResult.externalId,
              confirmationCode: paymentResult.confirmationCode,
              instructions: paymentResult.instructions,
            },
            ...(paymentResult.metadata && { metadata: paymentResult.metadata }),
          });
        } catch (paymentError) {
          console.error(`Payment creation failed for order ${order.id}:`, paymentError);
          // Don't fail the entire checkout if payment creation fails
          paymentResults.push({
            orderId: order.id,
            error: "Payment setup failed",
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      orders: createdOrders.map(({ order }) => ({
        id: order.id,
        trackingToken: order.trackingToken,
        status: order.status
      })),
      trackingTokens,
      payments: paymentResults,
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process order" },
      { status: 500 }
    );
  }
}

async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  orders,
  shippingAddress,
  billingAddress,
  shippingMethod,
  paymentMethod,
  discountAmount,
  couponCode,
  trackingTokens
}: {
  customerEmail: string;
  customerName: string;
  orders: any[];
  shippingAddress: CartAddress;
  billingAddress: CartAddress;
  shippingMethod?: ShippingMethod;
  paymentMethod: string;
  discountAmount: number;
  couponCode?: string;
  trackingTokens: string[];
}) {
  const subtotal = orders.reduce((sum, { items }) => 
    sum + items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0), 0
  );
  
  const shippingCost = shippingMethod?.cost || 0;
  const total = subtotal - discountAmount + shippingCost;
  
  const paymentMethodNames = {
    bank_transfer: 'Bank Transfer',
    cash_on_delivery: 'Cash on Delivery',
    mpesa: 'M-Pesa Mobile Money'
  };
  
  const emailContent = `
    <h2>Order Confirmation</h2>
    <p>Dear ${customerName},</p>
    <p>Thank you for your order! Here are the details:</p>
    
    <h3>Order Summary</h3>
    ${orders.map(({ seller, items }, index) => `
      <div style="border: 1px solid #e5e5e5; padding: 15px; margin: 10px 0;">
        <h4>From: ${seller.name}</h4>
        <ul>
          ${items.map((item: any) => `
            <li>${item.name}${item.variantName ? ` (${item.variantName})` : ''} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</li>
          `).join('')}
        </ul>
        <p><strong>Tracking: ${trackingTokens[index]}</strong></p>
      </div>
    `).join('')}
    
    <h3>Pricing</h3>
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    ${shippingMethod ? `<p>Shipping (${shippingMethod.name}): $${shippingCost.toFixed(2)}</p>` : ''}
    ${discountAmount > 0 ? `<p>Discount${couponCode ? ` (${couponCode})` : ''}: -$${discountAmount.toFixed(2)}</p>` : ''}
    <p><strong>Total: $${total.toFixed(2)}</strong></p>
    
    <h3>Shipping Address</h3>
    <p>
      ${shippingAddress.name}<br>
      ${shippingAddress.address}<br>
      ${shippingAddress.city}, ${shippingAddress.country}<br>
      Phone: ${shippingAddress.phone}
    </p>
    
    ${shippingMethod ? `
    <h3>Shipping Information</h3>
    <p>
      <strong>Method:</strong> ${shippingMethod.name}<br>
      <strong>Estimated Delivery:</strong> ${shippingMethod.estimatedDays} business days
      ${shippingMethod.type === 'pickup' ? '<br><strong>Note:</strong> This is a pickup order. You will be contacted when ready for pickup.' : ''}
    </p>
    ` : ''}
    
    <h3>Payment Method</h3>
    <p>${paymentMethodNames[paymentMethod as keyof typeof paymentMethodNames]}</p>
    ${paymentMethod === 'bank_transfer' ? '<p>Bank transfer details will be provided by the seller.</p>' : ''}
    
    <p>You can track your orders using the tracking numbers provided above.</p>
    
    <p>Best regards,<br>MyShop Team</p>
  `;
  
  await sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - ${trackingTokens.join(', ')}`,
    body: emailContent
  });
}

async function sendSellerNotificationEmail({
  sellerEmail,
  sellerName,
  order,
  items,
  customerInfo
}: {
  sellerEmail: string;
  sellerName: string;
  order: any;
  items: any[];
  customerInfo: CartAddress;
}) {
  const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const emailContent = `
    <h2>New Order Received!</h2>
    <p>Dear ${sellerName},</p>
    <p>You have received a new order:</p>
    
    <h3>Order Details</h3>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Tracking Token:</strong> ${order.trackingToken}</p>
    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    
    <h3>Customer Information</h3>
    <p>
      <strong>Name:</strong> ${customerInfo.name}<br>
      <strong>Email:</strong> ${customerInfo.email}<br>
      <strong>Phone:</strong> ${customerInfo.phone}<br>
      <strong>Address:</strong> ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.country}
    </p>
    
    <h3>Items Ordered</h3>
    <ul>
      ${items.map(item => `
        <li>${item.name}${item.variantName ? ` (${item.variantName})` : ''} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</li>
      `).join('')}
    </ul>
    
    <p><strong>Order Total: $${orderTotal.toFixed(2)}</strong></p>
    
    <p>Please log in to your dashboard to manage this order.</p>
    
    <p>Best regards,<br>MyShop Platform</p>
  `;
  
  await sendEmail({
    to: sellerEmail,
    subject: `New Order #${order.id} - ${order.trackingToken}`,
    body: emailContent
  });
}