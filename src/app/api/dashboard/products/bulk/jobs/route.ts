import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { like, desc, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

interface BulkJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  processed: number;
  errors: string[];
  createdAt: string;
  sellerId?: number;
}

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all bulk job records for this seller
    const jobRecords = await db
      .select({
        key: platformSettings.key,
        value: platformSettings.value,
        updatedAt: platformSettings.updatedAt
      })
      .from(platformSettings)
      .where(like(platformSettings.key, 'bulk_job_%'))
      .orderBy(desc(platformSettings.updatedAt));

    const jobs: BulkJob[] = [];

    for (const record of jobRecords) {
      try {
        const jobData = JSON.parse(record.value || '{}');
        
        // Filter jobs for this seller
        if (jobData.sellerId === sellerId) {
          jobs.push({
            id: record.key.replace('bulk_job_', ''),
            type: jobData.type || 'unknown',
            status: jobData.status || 'pending',
            progress: jobData.progress || 0,
            total: jobData.total || 0,
            processed: jobData.processed || 0,
            errors: jobData.errors || [],
            createdAt: jobData.createdAt || record.updatedAt?.toISOString() || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error parsing job data:', error);
      }
    }

    // Sort by creation date, newest first
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      jobs: jobs.slice(0, 50) // Limit to last 50 jobs
    });

  } catch (error) {
    console.error("Failed to fetch bulk jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobData = await request.json();
    const jobId = jobData.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: BulkJob = {
      id: jobId,
      type: jobData.type || 'unknown',
      status: 'pending',
      progress: 0,
      total: jobData.total || 0,
      processed: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      sellerId
    };

    // Store job in platform settings
    await db.execute(sql`
      INSERT INTO platform_settings (key, value) 
      VALUES (${`bulk_job_${jobId}`}, ${JSON.stringify(job)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);

    return NextResponse.json({ job });

  } catch (error) {
    console.error("Failed to create bulk job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}