import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;
    const client = await requireDatalixClient();
    const result = await client.listBackups(id);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

const backupActionSchema = z.object({
  action: z.enum(["create", "restore", "delete"]),
  backup: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;
    const body = await request.json();
    const parsed = backupActionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid request", 400);
    }

    const client = await requireDatalixClient();
    const { action, backup } = parsed.data;

    let result;
    switch (action) {
      case "create":
        result = await client.createBackup(id);
        break;
      case "restore":
        if (!backup) return errorResponse("Backup ID required", 400);
        result = await client.restoreBackup(id, backup);
        break;
      case "delete":
        if (!backup) return errorResponse("Backup ID required", 400);
        result = await client.deleteBackup(id, backup);
        break;
    }

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `backup.${action}`,
        serviceId: id,
        metadata: backup ? { backup } : undefined,
      },
    });

    return successResponse({ message: `Backup ${action} executed` });
  } catch (error) {
    return handleApiError(error);
  }
}
