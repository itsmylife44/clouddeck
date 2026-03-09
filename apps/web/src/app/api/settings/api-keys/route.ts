import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { DatalixClient } from "@clouddeck/datalix-client";

async function requireAdmin() {
  const session = await requireAuth();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const apiKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        label: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(apiKeys);
  } catch (error) {
    return handleApiError(error);
  }
}

const createKeySchema = z.object({
  label: z.string().min(1).max(50).default("Default"),
  apiKey: z.string().min(10, "API key seems too short"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { label, apiKey } = parsed.data;

    // Test the API key before saving
    const testClient = new DatalixClient(apiKey);
    const testResult = await testClient.testConnection();

    if (!testResult) {
      return errorResponse("API key is invalid or Datalix is unreachable", 422);
    }

    const encrypted = encrypt(apiKey);

    const created = await db.apiKey.create({
      data: {
        userId: session.user.id,
        label,
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { id } = await request.json();

    if (!id) return errorResponse("API key ID required", 400);

    await db.apiKey.deleteMany({
      where: { id, userId: session.user.id },
    });

    return successResponse({ message: "API key deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
