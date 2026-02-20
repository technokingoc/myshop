import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { getSessionFromCookie } from "@/lib/session";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `mk_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 16);
  
  return { key, hash, prefix };
}

// GET /api/dashboard/api-keys - List API keys for current store
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch API keys for the seller's store
    const apiKeys = await sql`
      SELECT 
        id, name, key_prefix, permissions, last_used_at, usage_count, 
        rate_limit_per_day, is_active, notes, created_at, expires_at,
        store_id, user_id
      FROM api_keys
      WHERE seller_id = ${session.sellerId} OR store_id IN (
        SELECT id FROM stores WHERE user_id = ${session.sellerId}
      )
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.key_prefix,
        permissions: key.permissions,
        lastUsedAt: key.last_used_at,
        usageCount: key.usage_count,
        rateLimitPerDay: key.rate_limit_per_day,
        isActive: key.is_active,
        notes: key.notes,
        createdAt: key.created_at,
        expiresAt: key.expires_at
      }))
    });

  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.permissions || !Array.isArray(body.permissions)) {
      return NextResponse.json(
        { error: "Missing required fields: name, permissions" },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = [
      "*", 
      "products:read", 
      "products:write", 
      "orders:read", 
      "orders:write"
    ];
    
    const hasInvalidPermissions = body.permissions.some((perm: string) => 
      !validPermissions.includes(perm)
    );
    
    if (hasInvalidPermissions) {
      return NextResponse.json(
        { error: "Invalid permissions. Valid options: " + validPermissions.join(", ") },
        { status: 400 }
      );
    }

    // Check if seller has a store
    const storeResult = await sql`
      SELECT id FROM stores WHERE user_id = ${session.sellerId}
      UNION
      SELECT id FROM sellers WHERE id = ${session.sellerId} -- Legacy support
      LIMIT 1
    `;
    
    if (!storeResult.length) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeId = storeResult[0].id;
    
    // Generate API key
    const { key, hash, prefix } = generateApiKey();
    
    // Create API key record
    const newApiKey = await sql`
      INSERT INTO api_keys (
        store_id, seller_id, user_id, name, key_hash, key_prefix, 
        permissions, rate_limit_per_day, is_active, notes, expires_at
      )
      VALUES (
        ${storeId}, ${session.sellerId}, ${session.sellerId}, ${body.name}, 
        ${hash}, ${prefix}, ${JSON.stringify(body.permissions)}, 
        ${body.rateLimitPerDay || 1000}, true, ${body.notes || ""}, 
        ${body.expiresAt || null}
      )
      RETURNING id, name, key_prefix, permissions, rate_limit_per_day, 
                is_active, notes, created_at, expires_at
    `;

    if (!newApiKey.length) {
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    const apiKeyData = newApiKey[0];

    return NextResponse.json({
      success: true,
      data: {
        id: apiKeyData.id,
        name: apiKeyData.name,
        key: key, // Only returned once on creation!
        keyPrefix: apiKeyData.key_prefix,
        permissions: apiKeyData.permissions,
        rateLimitPerDay: apiKeyData.rate_limit_per_day,
        isActive: apiKeyData.is_active,
        notes: apiKeyData.notes,
        createdAt: apiKeyData.created_at,
        expiresAt: apiKeyData.expires_at
      },
      message: "API key created successfully. Make sure to copy it now - you won't be able to see it again!"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/api-keys - Revoke all API keys (bulk action)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    if (action === "revoke-all") {
      // Revoke all API keys for this seller
      const result = await sql`
        UPDATE api_keys
        SET is_active = false
        WHERE seller_id = ${session.sellerId} OR store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        )
        RETURNING id
      `;
      
      return NextResponse.json({
        success: true,
        message: `Revoked ${result.length} API key(s)`
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error revoking API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}