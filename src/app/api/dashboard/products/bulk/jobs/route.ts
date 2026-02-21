import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bulkJobs } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

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

    // Get bulk jobs for this seller
    const jobRecords = await db
      .select()
      .from(bulkJobs)
      .where(eq(bulkJobs.sellerId, sellerId))
      .orderBy(desc(bulkJobs.createdAt))
      .limit(50);

    const jobs: BulkJob[] = jobRecords.map(job => ({
      id: job.id,
      type: job.jobType,
      status: job.status as 'pending' | 'running' | 'completed' | 'failed',
      progress: job.progress,
      total: job.totalItems,
      processed: job.processedItems,
      errors: (job.results as any)?.errors || [],
      createdAt: job.createdAt.toISOString()
    }));

    return NextResponse.json({
      jobs
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
    const jobId = jobData.id || uuidv4();

    const newJob = {
      id: jobId,
      sellerId,
      jobType: jobData.type || 'unknown',
      status: 'pending' as const,
      progress: 0,
      totalItems: jobData.total || 0,
      processedItems: 0,
      failedItems: 0,
      payload: jobData.payload || {},
      results: {}
    };

    const [insertedJob] = await db.insert(bulkJobs).values(newJob).returning();

    const job: BulkJob = {
      id: insertedJob.id,
      type: insertedJob.jobType,
      status: insertedJob.status as 'pending' | 'running' | 'completed' | 'failed',
      progress: insertedJob.progress,
      total: insertedJob.totalItems,
      processed: insertedJob.processedItems,
      errors: [],
      createdAt: insertedJob.createdAt.toISOString()
    };

    return NextResponse.json({ job });

  } catch (error) {
    console.error("Failed to create bulk job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}