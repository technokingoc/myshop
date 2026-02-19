import { getDb } from "./db";
import { stockHistory, restockReminders, catalogItems, productVariants, warehouses, users, stores } from "./schema";
import { eq, and, desc, sql, isNull, or } from "drizzle-orm";
import { notifyLowStock, notifyOutOfStock } from "./notification-service";
import { sendRestockReminder } from "./email-service";

export type StockChangeType = 'adjustment' | 'sale' | 'restock' | 'return' | 'damage' | 'transfer' | 'initial';

export interface StockHistoryEntry {
  id: number;
  changeType: StockChangeType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  notes: string;
  orderId?: number;
  batchNumber?: string;
  expirationDate?: Date;
  costPrice?: number;
  createdBy?: number;
  createdAt: Date;
  createdByName?: string;
}

export interface RestockReminder {
  id: number;
  sellerId: number;
  productId?: number;
  variantId?: number;
  warehouseId?: number;
  triggerQuantity: number;
  targetQuantity: number;
  leadTimeDays: number;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  lastOrderDate?: Date;
  averageLeadTime: number;
  status: 'active' | 'snoozed' | 'disabled';
  lastTriggered?: Date;
  snoozeUntil?: Date;
  emailNotifications: boolean;
  autoReorderEnabled: boolean;
  minOrderQuantity: number;
  productName?: string;
  variantName?: string;
  currentStock?: number;
}

/**
 * Record a stock change and update inventory
 */
export async function recordStockChange({
  sellerId,
  productId,
  variantId = null,
  warehouseId = null,
  changeType,
  quantityChange,
  reason = '',
  notes = '',
  orderId = null,
  batchNumber = '',
  expirationDate = null,
  costPrice = null,
  createdBy = null,
}: {
  sellerId: number;
  productId?: number;
  variantId?: number | null;
  warehouseId?: number | null;
  changeType: StockChangeType;
  quantityChange: number;
  reason?: string;
  notes?: string;
  orderId?: number | null;
  batchNumber?: string;
  expirationDate?: Date | null;
  costPrice?: number | null;
  createdBy?: number | null;
}): Promise<{ success: boolean; newStock: number; error?: string }> {
  const db = getDb();

  try {
    // Get current stock
    let currentStock = 0;
    let lowStockThreshold = 5;
    
    if (variantId) {
      const [variant] = await db
        .select({ stockQuantity: productVariants.stockQuantity, lowStockThreshold: productVariants.lowStockThreshold })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);
      
      if (!variant) throw new Error('Variant not found');
      currentStock = variant.stockQuantity || 0;
      lowStockThreshold = variant.lowStockThreshold || 5;
    } else if (productId) {
      const [product] = await db
        .select({ stockQuantity: catalogItems.stockQuantity, lowStockThreshold: catalogItems.lowStockThreshold })
        .from(catalogItems)
        .where(eq(catalogItems.id, productId))
        .limit(1);
      
      if (!product) throw new Error('Product not found');
      currentStock = product.stockQuantity || 0;
      lowStockThreshold = product.lowStockThreshold || 5;
    } else {
      throw new Error('Either productId or variantId must be provided');
    }

    const newStock = currentStock + quantityChange;
    
    if (newStock < 0) {
      return { 
        success: false, 
        newStock: currentStock,
        error: 'Insufficient stock for this operation' 
      };
    }

    // Record in stock history
    await db.insert(stockHistory).values({
      sellerId,
      productId,
      variantId,
      warehouseId,
      changeType,
      quantityBefore: currentStock,
      quantityChange,
      quantityAfter: newStock,
      reason,
      notes,
      orderId,
      batchNumber,
      expirationDate,
      costPrice: costPrice ? costPrice.toString() : null,
      createdBy,
    });

    // Update actual stock
    if (variantId) {
      await db
        .update(productVariants)
        .set({ stockQuantity: newStock })
        .where(eq(productVariants.id, variantId));
    } else if (productId) {
      await db
        .update(catalogItems)
        .set({ stockQuantity: newStock })
        .where(eq(catalogItems.id, productId));
    }

    // Check for low stock alerts
    if (newStock <= lowStockThreshold && newStock > 0) {
      if (productId) {
        await notifyLowStock(productId, sellerId, newStock, lowStockThreshold);
      }
      await checkRestockReminders(sellerId, productId, variantId, newStock);
    } else if (newStock === 0 && productId) {
      await notifyOutOfStock(productId, sellerId);
    }

    return { success: true, newStock };
  } catch (error) {
    console.error('Failed to record stock change:', error);
    return { 
      success: false, 
      newStock: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get stock history for a product or variant
 */
export async function getStockHistory({
  sellerId,
  productId,
  variantId = null,
  limit = 50,
  offset = 0
}: {
  sellerId: number;
  productId?: number;
  variantId?: number | null;
  limit?: number;
  offset?: number;
}): Promise<StockHistoryEntry[]> {
  const db = getDb();

  try {
    const whereConditions = [eq(stockHistory.sellerId, sellerId)];
    
    if (variantId) {
      whereConditions.push(eq(stockHistory.variantId, variantId));
    } else if (productId) {
      whereConditions.push(eq(stockHistory.productId, productId));
      whereConditions.push(isNull(stockHistory.variantId));
    }

    const results = await db
      .select({
        history: stockHistory,
        createdByName: users.name,
      })
      .from(stockHistory)
      .leftJoin(users, eq(stockHistory.createdBy, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(stockHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.history.id,
      changeType: result.history.changeType as StockChangeType,
      quantityBefore: result.history.quantityBefore,
      quantityChange: result.history.quantityChange,
      quantityAfter: result.history.quantityAfter,
      reason: result.history.reason || '',
      notes: result.history.notes || '',
      orderId: result.history.orderId || undefined,
      batchNumber: result.history.batchNumber || undefined,
      expirationDate: result.history.expirationDate || undefined,
      costPrice: result.history.costPrice ? parseFloat(result.history.costPrice) : undefined,
      createdBy: result.history.createdBy || undefined,
      createdAt: result.history.createdAt,
      createdByName: result.createdByName || undefined,
    }));
  } catch (error) {
    console.error('Failed to get stock history:', error);
    return [];
  }
}

/**
 * Create or update restock reminder
 */
export async function createRestockReminder({
  sellerId,
  productId,
  variantId = null,
  warehouseId = null,
  triggerQuantity,
  targetQuantity,
  leadTimeDays = 7,
  supplierName = '',
  supplierEmail = '',
  supplierPhone = '',
  minOrderQuantity = 1,
  emailNotifications = true,
}: {
  sellerId: number;
  productId?: number;
  variantId?: number | null;
  warehouseId?: number | null;
  triggerQuantity: number;
  targetQuantity: number;
  leadTimeDays?: number;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  minOrderQuantity?: number;
  emailNotifications?: boolean;
}): Promise<{ success: boolean; reminderId?: number; error?: string }> {
  const db = getDb();

  try {
    // Check if reminder already exists
    const whereConditions = [eq(restockReminders.sellerId, sellerId)];
    
    if (variantId) {
      whereConditions.push(eq(restockReminders.variantId, variantId));
    } else if (productId) {
      whereConditions.push(eq(restockReminders.productId, productId));
      whereConditions.push(isNull(restockReminders.variantId));
    }

    const [existing] = await db
      .select({ id: restockReminders.id })
      .from(restockReminders)
      .where(and(...whereConditions))
      .limit(1);

    const reminderData = {
      sellerId,
      productId,
      variantId,
      warehouseId,
      triggerQuantity,
      targetQuantity,
      leadTimeDays,
      supplierName,
      supplierEmail,
      supplierPhone,
      minOrderQuantity,
      emailNotifications,
      updatedAt: new Date(),
    };

    let reminderId: number;

    if (existing) {
      // Update existing reminder
      await db
        .update(restockReminders)
        .set(reminderData)
        .where(eq(restockReminders.id, existing.id));
      reminderId = existing.id;
    } else {
      // Create new reminder
      const [newReminder] = await db
        .insert(restockReminders)
        .values(reminderData)
        .returning({ id: restockReminders.id });
      reminderId = newReminder.id;
    }

    return { success: true, reminderId };
  } catch (error) {
    console.error('Failed to create restock reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get restock reminders for a seller
 */
export async function getRestockReminders(sellerId: number): Promise<RestockReminder[]> {
  const db = getDb();

  try {
    const results = await db
      .select({
        reminder: restockReminders,
        product: catalogItems,
        variant: productVariants,
      })
      .from(restockReminders)
      .leftJoin(catalogItems, eq(restockReminders.productId, catalogItems.id))
      .leftJoin(productVariants, eq(restockReminders.variantId, productVariants.id))
      .where(eq(restockReminders.sellerId, sellerId))
      .orderBy(desc(restockReminders.updatedAt));

    return results.map(result => ({
      id: result.reminder.id,
      sellerId: result.reminder.sellerId,
      productId: result.reminder.productId || undefined,
      variantId: result.reminder.variantId || undefined,
      warehouseId: result.reminder.warehouseId || undefined,
      triggerQuantity: result.reminder.triggerQuantity || 5,
      targetQuantity: result.reminder.targetQuantity || 10,
      leadTimeDays: result.reminder.leadTimeDays || 7,
      supplierName: result.reminder.supplierName || undefined,
      supplierEmail: result.reminder.supplierEmail || undefined,
      supplierPhone: result.reminder.supplierPhone || undefined,
      lastOrderDate: result.reminder.lastOrderDate || undefined,
      averageLeadTime: result.reminder.averageLeadTime || 7,
      status: result.reminder.status as 'active' | 'snoozed' | 'disabled',
      lastTriggered: result.reminder.lastTriggered || undefined,
      snoozeUntil: result.reminder.snoozeUntil || undefined,
      emailNotifications: result.reminder.emailNotifications ?? true,
      autoReorderEnabled: result.reminder.autoReorderEnabled ?? false,
      minOrderQuantity: result.reminder.minOrderQuantity || 1,
      productName: result.product?.name || undefined,
      variantName: result.variant?.name || undefined,
      currentStock: result.variant?.stockQuantity || result.product?.stockQuantity || 0,
    }));
  } catch (error) {
    console.error('Failed to get restock reminders:', error);
    return [];
  }
}

/**
 * Check for restock reminders and send notifications
 */
export async function checkRestockReminders(
  sellerId: number, 
  productId?: number, 
  variantId?: number | null, 
  currentStock?: number
) {
  const db = getDb();

  try {
    const whereConditions = [
      eq(restockReminders.sellerId, sellerId),
      eq(restockReminders.status, 'active'),
    ];
    
    if (variantId) {
      whereConditions.push(eq(restockReminders.variantId, variantId));
    } else if (productId) {
      whereConditions.push(eq(restockReminders.productId, productId));
    }

    const reminders = await db
      .select({
        reminder: restockReminders,
        product: catalogItems,
        variant: productVariants,
      })
      .from(restockReminders)
      .leftJoin(catalogItems, eq(restockReminders.productId, catalogItems.id))
      .leftJoin(productVariants, eq(restockReminders.variantId, productVariants.id))
      .where(and(...whereConditions));

    for (const { reminder, product, variant } of reminders) {
      const stock = currentStock ?? (variant?.stockQuantity || product?.stockQuantity || 0);
      
      if (stock <= reminder.triggerQuantity) {
        // Check if we haven't sent a reminder recently (within last 24 hours)
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        if (!reminder.lastTriggered || reminder.lastTriggered < dayAgo) {
          // Update last triggered
          await db
            .update(restockReminders)
            .set({ lastTriggered: now })
            .where(eq(restockReminders.id, reminder.id));

          // Send email reminder if enabled
          if (reminder.emailNotifications) {
            const [seller] = await db
              .select({ user: users })
              .from(stores)
              .leftJoin(users, eq(stores.userId, users.id))
              .where(eq(stores.userId, sellerId))
              .limit(1);

            if (seller?.user?.email) {
              await sendRestockReminder(
                seller.user.email,
                product?.name || variant?.name || 'Product',
                stock,
                reminder.triggerQuantity,
                reminder.targetQuantity,
                reminder.supplierName || '',
                'en' // TODO: use user's language preference
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to check restock reminders:', error);
  }
}

/**
 * Snooze a restock reminder
 */
export async function snoozeRestockReminder(
  reminderId: number, 
  hours: number = 24
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();

  try {
    const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    await db
      .update(restockReminders)
      .set({ 
        status: 'snoozed',
        snoozeUntil,
        updatedAt: new Date(),
      })
      .where(eq(restockReminders.id, reminderId));

    return { success: true };
  } catch (error) {
    console.error('Failed to snooze restock reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get low stock products requiring attention
 */
export async function getLowStockProducts(sellerId: number): Promise<Array<{
  id: number;
  name: string;
  type: 'product' | 'variant';
  currentStock: number;
  threshold: number;
  variantName?: string;
  hasReminder: boolean;
}>> {
  const db = getDb();

  try {
    // Get low stock products
    const lowStockProducts = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        currentStock: catalogItems.stockQuantity,
        threshold: catalogItems.lowStockThreshold,
        trackInventory: catalogItems.trackInventory,
        hasVariants: catalogItems.hasVariants,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.trackInventory, true),
          eq(catalogItems.status, 'Published'),
          sql`${catalogItems.stockQuantity} <= ${catalogItems.lowStockThreshold}`
        )
      );

    // Get low stock variants
    const lowStockVariants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        name: productVariants.name,
        productName: catalogItems.name,
        currentStock: productVariants.stockQuantity,
        threshold: productVariants.lowStockThreshold,
      })
      .from(productVariants)
      .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(productVariants.active, true),
          eq(catalogItems.status, 'Published'),
          sql`${productVariants.stockQuantity} <= ${productVariants.lowStockThreshold}`
        )
      );

    // Get existing reminders
    const existingReminders = await db
      .select({
        productId: restockReminders.productId,
        variantId: restockReminders.variantId,
      })
      .from(restockReminders)
      .where(eq(restockReminders.sellerId, sellerId));

    const reminderMap = new Set();
    existingReminders.forEach(r => {
      if (r.variantId) {
        reminderMap.add(`variant_${r.variantId}`);
      } else if (r.productId) {
        reminderMap.add(`product_${r.productId}`);
      }
    });

    const results: Array<{
      id: number;
      name: string;
      type: 'product' | 'variant';
      currentStock: number;
      threshold: number;
      variantName?: string;
      hasReminder: boolean;
    }> = [];

    // Add products (only if they don't have variants)
    lowStockProducts.forEach(product => {
      if (!product.hasVariants) {
        results.push({
          id: product.id,
          name: product.name,
          type: 'product',
          currentStock: product.currentStock || 0,
          threshold: product.threshold || 5,
          hasReminder: reminderMap.has(`product_${product.id}`),
        });
      }
    });

    // Add variants
    lowStockVariants.forEach(variant => {
      results.push({
        id: variant.id,
        name: variant.productName || 'Product',
        type: 'variant',
        currentStock: variant.currentStock || 0,
        threshold: variant.threshold || 5,
        variantName: variant.name,
        hasReminder: reminderMap.has(`variant_${variant.id}`),
      });
    });

    return results.sort((a, b) => a.currentStock - b.currentStock);
  } catch (error) {
    console.error('Failed to get low stock products:', error);
    return [];
  }
}