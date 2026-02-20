import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionFromCookie } from "@/lib/session";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

// GET /api/dashboard/api-keys/[id] - Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const keyId = parseInt(id);
    
    if (isNaN(keyId)) {
      return NextResponse.json(
        { error: "Invalid API key ID" },
        { status: 400 }
      );
    }

    // Fetch API key with usage statistics
    const apiKeyResult = await sql`
      SELECT 
        ak.id, ak.name, ak.key_prefix, ak.permissions, ak.last_used_at, 
        ak.usage_count, ak.rate_limit_per_day, ak.is_active, ak.notes, 
        ak.created_at, ak.expires_at,
        COUNT(wd.id) as webhook_deliveries_count,
        COUNT(CASE WHEN wd.status = 'success' THEN 1 END) as successful_deliveries,
        COUNT(CASE WHEN wd.status = 'failure' THEN 1 END) as failed_deliveries
      FROM api_keys ak
      LEFT JOIN webhook_deliveries wd ON wd.created_at >= ak.created_at 
        AND EXISTS (
          SELECT 1 FROM webhooks w 
          WHERE w.id = wd.webhook_id 
            AND (w.store_id = ak.store_id OR w.seller_id = ak.seller_id)
        )
      WHERE ak.id = ${keyId}
        AND (ak.seller_id = ${session.sellerId} OR ak.store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        ))
      GROUP BY ak.id, ak.name, ak.key_prefix, ak.permissions, ak.last_used_at, 
               ak.usage_count, ak.rate_limit_per_day, ak.is_active, ak.notes, 
               ak.created_at, ak.expires_at
    `;

    if (!apiKeyResult.length) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    const apiKey = apiKeyResult[0];

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.last_used_at,
        usageCount: apiKey.usage_count,
        rateLimitPerDay: apiKey.rate_limit_per_day,
        isActive: apiKey.is_active,
        notes: apiKey.notes,
        createdAt: apiKey.created_at,
        expiresAt: apiKey.expires_at,
        stats: {
          webhookDeliveries: parseInt(apiKey.webhook_deliveries_count || "0"),
          successfulDeliveries: parseInt(apiKey.successful_deliveries || "0"),
          failedDeliveries: parseInt(apiKey.failed_deliveries || "0")
        }
      }
    });

  } catch (error) {
    console.error("Error fetching API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/api-keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const keyId = parseInt(id);
    
    if (isNaN(keyId)) {
      return NextResponse.json(
        { error: "Invalid API key ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate permissions if provided
    if (body.permissions) {
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
    }

    // Build update data
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.permissions !== undefined) updateData.permissions = JSON.stringify(body.permissions);
    if (body.rateLimitPerDay !== undefined) updateData.rate_limit_per_day = body.rateLimitPerDay;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.expiresAt !== undefined) updateData.expires_at = body.expiresAt;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    // Update API key
    const updatedApiKey = await sql`
      UPDATE api_keys
      SET ${sql(updateData)}
      WHERE id = ${keyId}
        AND (seller_id = ${session.sellerId} OR store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        ))
      RETURNING id, name, key_prefix, permissions, last_used_at, 
                usage_count, rate_limit_per_day, is_active, notes, 
                created_at, expires_at, updated_at
    `;

    if (!updatedApiKey.length) {
      return NextResponse.json(
        { error: "API key not found or update failed" },
        { status: 404 }
      );
    }

    const apiKey = updatedApiKey[0];

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.last_used_at,
        usageCount: apiKey.usage_count,
        rateLimitPerDay: apiKey.rate_limit_per_day,
        isActive: apiKey.is_active,
        notes: apiKey.notes,
        createdAt: apiKey.created_at,
        expiresAt: apiKey.expires_at,
        updatedAt: apiKey.updated_at
      }
    });

  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/api-keys/[id] - Revoke/delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const keyId = parseInt(id);
    
    if (isNaN(keyId)) {
      return NextResponse.json(
        { error: "Invalid API key ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "revoke";

    if (action === "delete") {
      // Permanently delete the API key
      const deletedApiKey = await sql`
        DELETE FROM api_keys
        WHERE id = ${keyId}
          AND (seller_id = ${session.sellerId} OR store_id IN (
            SELECT id FROM stores WHERE user_id = ${session.sellerId}
          ))
        RETURNING name
      `;

      if (!deletedApiKey.length) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `API key "${deletedApiKey[0].name}" deleted permanently`
      });
    } else {
      // Revoke (deactivate) the API key
      const revokedApiKey = await sql`
        UPDATE api_keys
        SET is_active = false, updated_at = NOW()
        WHERE id = ${keyId}
          AND (seller_id = ${session.sellerId} OR store_id IN (
            SELECT id FROM stores WHERE user_id = ${session.sellerId}
          ))
        RETURNING name
      `;

      if (!revokedApiKey.length) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `API key "${revokedApiKey[0].name}" revoked successfully`
      });
    }

  } catch (error) {
    console.error("Error revoking/deleting API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}