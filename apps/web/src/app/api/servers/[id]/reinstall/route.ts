import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";
import { requireServerPermission, Permission } from "@/lib/permissions";

const reinstallSchema = z.object({
  os: z.number().positive(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.REINSTALL);
    if (!perm.ok) return perm.response;

    const client = await requireDatalixClient();
    const result = await client.getServiceOs(id);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.REINSTALL);
    if (!perm.ok) return perm.response;

    const body = await request.json();
    const parsed = reinstallSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Valid OS ID required", 400);
    }

    const client = await requireDatalixClient();
    const result = await client.reinstall(id, parsed.data.os);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: perm.session.user.id,
        action: "server.reinstall",
        serviceId: id,
        metadata: { os: parsed.data.os },
      },
    });

    return successResponse({ message: "Reinstall initiated" });
  } catch (error) {
    return handleApiError(error);
  }
}
