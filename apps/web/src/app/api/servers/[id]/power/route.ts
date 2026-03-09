import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";
import type { PowerAction } from "@clouddeck/datalix-client";

const powerSchema = z.object({
  action: z.enum(["start", "stop", "shutdown", "restart"]),
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
    const parsed = powerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid action. Must be: start, stop, shutdown, or restart", 400);
    }

    const client = await requireDatalixClient();
    const result = await client.powerAction(id, parsed.data.action as PowerAction);

    if (result.status === "error") {
      return Response.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `server.${parsed.data.action}`,
        serviceId: id,
        ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
      },
    });

    return successResponse({ message: `Server ${parsed.data.action} executed` });
  } catch (error) {
    return handleApiError(error);
  }
}
