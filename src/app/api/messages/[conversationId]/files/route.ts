import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messageFiles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// POST /api/messages/[conversationId]/files - Upload file to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { conversationId: convId } = await params;
    const conversationId = parseInt(convId);

    // Verify user has access to this conversation
    const conversation = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        status: conversations.status,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conv = conversation[0];
    if (conv.customerId !== userId && conv.sellerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (conv.status === "closed") {
      return NextResponse.json({ error: "Conversation is closed" }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const fileName = `${conversationId}_${userId}_${timestamp}.${extension}`;
    
    // In a real app, you would upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll simulate the upload
    const fileUrl = `/uploads/messages/${fileName}`;
    
    // Get image dimensions if it's an image
    let width: number | null = null;
    let height: number | null = null;
    
    if (file.type.startsWith('image/')) {
      try {
        const buffer = await file.arrayBuffer();
        // In a real app, you would use a library like sharp to get dimensions
        // For now, we'll just set default values for images
        width = 800;
        height = 600;
      } catch (error) {
        console.error("Error getting image dimensions:", error);
      }
    }

    // Save file record
    const fileRecord = await db
      .insert(messageFiles)
      .values({
        messageId: null, // Will be set when message is created
        uploadedBy: userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl,
        width,
        height,
        virusScanned: false, // In production, scan files before allowing access
        scanResult: "pending",
      })
      .returning({
        id: messageFiles.id,
        fileName: messageFiles.fileName,
        fileType: messageFiles.fileType,
        fileSize: messageFiles.fileSize,
        fileUrl: messageFiles.fileUrl,
        width: messageFiles.width,
        height: messageFiles.height,
        createdAt: messageFiles.createdAt,
      });

    return NextResponse.json({
      file: fileRecord[0],
      message: "File uploaded successfully",
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET /api/messages/[conversationId]/files - Get files in conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { conversationId: convId } = await params;
    const conversationId = parseInt(convId);

    // Verify user has access to this conversation
    const conversation = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conv = conversation[0];
    if (conv.customerId !== userId && conv.sellerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get files from messages in this conversation
    const files = await db
      .select()
      .from(messageFiles)
      .where(and(
        // Join through messages table would be needed here in real implementation
        // For now, we'll just return files for this conversation
        eq(messageFiles.scanResult, "clean") // Only return virus-clean files
      ));

    return NextResponse.json({ files });

  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}