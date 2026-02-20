import { randomBytes, createHash } from 'crypto';
import { getDb } from './db';
import { apiKeys } from './schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export interface ApiKeyData {
  id: number;
  sellerId: number | null;
  userId: number;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

// Generate a secure API key
export function generateApiKey(): string {
  return 'mshop_' + randomBytes(32).toString('hex');
}

// Hash API key for storage
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Create a new API key
export async function createApiKey(userId: number, sellerId: number | null, name: string, permissions: string[], expiresAt?: Date): Promise<string> {
  const db = getDb();
  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = key.substring(0, 12) + '...';
  
  await db.insert(apiKeys).values({
    userId,
    sellerId,
    name,
    keyHash,
    keyPrefix,
    permissions,
    isActive: true,
    expiresAt,
  });
  
  return key;
}

// Validate and get API key data
export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  if (!key || !key.startsWith('mshop_')) {
    return null;
  }
  
  const db = getDb();
  const keyHash = hashApiKey(key);
  
  const result = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    ))
    .limit(1);
    
  if (!result.length) {
    return null;
  }
  
  const apiKey = result[0];
  
  // Check if expired
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return null;
  }
  
  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ 
      lastUsedAt: new Date(),
      usageCount: (apiKey.usageCount || 0) + 1
    })
    .where(eq(apiKeys.id, apiKey.id));
  
  return apiKey;
}

// Get API key from request headers
export function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return request.headers.get('X-API-Key');
}

// Check if API key has specific permission
export function hasPermission(apiKey: ApiKeyData, permission: string): boolean {
  return apiKey.permissions.includes('*') || apiKey.permissions.includes(permission);
}

// Available API permissions
export const API_PERMISSIONS = {
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  ORDERS_READ: 'orders:read', 
  ORDERS_WRITE: 'orders:write',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  WEBHOOKS_MANAGE: 'webhooks:manage',
  FEEDS_READ: 'feeds:read',
  ALL: '*'
} as const;

// API middleware for authentication and authorization
export async function authenticateApiRequest(
  request: NextRequest, 
  requiredPermission: string
): Promise<{ success: true; sellerId: number | null; userId: number } | { success: false; error: string }> {
  const apiKeyValue = getApiKeyFromRequest(request);
  
  if (!apiKeyValue) {
    return { success: false, error: 'API key required' };
  }
  
  const apiKey = await validateApiKey(apiKeyValue);
  
  if (!apiKey) {
    return { success: false, error: 'Invalid or expired API key' };
  }
  
  if (!hasPermission(apiKey, requiredPermission)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  return { success: true, sellerId: apiKey.sellerId, userId: apiKey.userId };
}