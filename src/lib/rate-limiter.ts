import { neon } from "@neondatabase/serverless";
import { NextRequest } from "next/server";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 60000, // 1 minute default
      maxRequests: 100, // 100 requests per minute default
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  async checkRateLimit(request: NextRequest, apiKeyId?: number): Promise<RateLimitResult> {
    try {
      const key = this.config.keyGenerator!(request);
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.config.windowMs);
      
      // For API key requests, use more specific tracking
      let identifier: string;
      let rateLimitPerDay = this.config.maxRequests;

      if (apiKeyId) {
        // Get API key rate limit
        const apiKeyResult = await sql`
          SELECT rate_limit_per_day, daily_usage_count, daily_usage_date
          FROM api_keys 
          WHERE id = ${apiKeyId} AND is_active = true
        `;
        
        if (apiKeyResult.length) {
          const apiKey = apiKeyResult[0];
          const today = now.toISOString().split('T')[0];
          
          // Reset daily counter if needed
          if (apiKey.daily_usage_date !== today) {
            await sql`
              UPDATE api_keys 
              SET daily_usage_count = 0, daily_usage_date = ${today}
              WHERE id = ${apiKeyId}
            `;
            apiKey.daily_usage_count = 0;
          }
          
          identifier = `api_key:${apiKeyId}`;
          rateLimitPerDay = apiKey.rate_limit_per_day || 1000;
          
          // Check daily limit for API keys
          if (apiKey.daily_usage_count >= rateLimitPerDay) {
            const resetTime = new Date(now);
            resetTime.setUTCHours(24, 0, 0, 0); // Reset at midnight UTC
            
            return {
              allowed: false,
              limit: rateLimitPerDay,
              remaining: 0,
              resetTime,
              retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
            };
          }
        }
      } else {
        identifier = `ip:${key}`;
      }

      // Check request count in current window
      const requestCount = await sql`
        SELECT COUNT(*) as count
        FROM rate_limit_requests
        WHERE identifier = ${identifier} 
          AND created_at >= ${windowStart.toISOString()}
      `;

      const currentCount = parseInt(requestCount[0]?.count || '0');
      const windowLimit = apiKeyId ? Math.min(rateLimitPerDay, this.config.maxRequests) : this.config.maxRequests;
      
      if (currentCount >= windowLimit) {
        const resetTime = new Date(windowStart.getTime() + this.config.windowMs);
        const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
        
        return {
          allowed: false,
          limit: windowLimit,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }

      // Record this request
      await sql`
        INSERT INTO rate_limit_requests (identifier, created_at, metadata)
        VALUES (${identifier}, ${now.toISOString()}, ${JSON.stringify({
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          apiKeyId: apiKeyId || null
        })})
      `;

      // Update API key daily usage if applicable
      if (apiKeyId) {
        await sql`
          UPDATE api_keys 
          SET daily_usage_count = daily_usage_count + 1
          WHERE id = ${apiKeyId}
        `;
      }

      // Clean up old records (keep only last 24 hours)
      const cleanupTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await sql`
        DELETE FROM rate_limit_requests 
        WHERE created_at < ${cleanupTime.toISOString()}
      `;

      const resetTime = new Date(windowStart.getTime() + this.config.windowMs);
      
      return {
        allowed: true,
        limit: windowLimit,
        remaining: windowLimit - currentCount - 1,
        resetTime
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      
      // On error, allow the request but log it
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs)
      };
    }
  }

  // Create rate limit response headers
  createHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
    };

    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const feedRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes  
  maxRequests: 10, // 10 requests per 5 minutes (feeds are expensive)
});

export const webhookRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50, // 50 webhook deliveries per minute
});

// Enhanced API authentication with rate limiting
export async function authenticateApiRequestWithRateLimit(
  request: NextRequest, 
  requiredPermission: string,
  rateLimiter = apiRateLimiter
) {
  // First check rate limit by IP
  const rateLimitResult = await rateLimiter.checkRateLimit(request);
  
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      rateLimitResult
    };
  }

  // Then authenticate API key (existing logic from api-keys.ts would go here)
  // This would import and call authenticateApiRequest
  const { authenticateApiRequest } = await import('./api-keys');
  const authResult = await authenticateApiRequest(request, requiredPermission);
  
  if (!authResult.success) {
    return {
      ...authResult,
      rateLimitResult
    };
  }

  // Check rate limit for this specific API key
  const apiKeyResult = await sql`
    SELECT id FROM api_keys 
    WHERE user_id = ${authResult.userId} AND seller_id = ${authResult.sellerId}
    LIMIT 1
  `;

  if (apiKeyResult.length) {
    const apiKeyRateLimit = await rateLimiter.checkRateLimit(request, apiKeyResult[0].id);
    
    if (!apiKeyRateLimit.allowed) {
      return {
        success: false,
        error: 'API key rate limit exceeded',
        rateLimitResult: apiKeyRateLimit
      };
    }
    
    return {
      ...authResult,
      rateLimitResult: apiKeyRateLimit
    };
  }

  return {
    ...authResult,
    rateLimitResult
  };
}