import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";
import { requireServerPermission, Permission } from "@/lib/permissions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.EXTEND);
    if (!perm.ok) return perm.response;

    const client = await requireDatalixClient();
    const result = await client.hideService(id);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: perm.session.user.id,
        action: "server.hide",
        serviceId: id,
        metadata: {},
      },
    });

    return successResponse({ message: "Service hidden" });
  } catch (error) {
    return handleApiError(error);
  }
}
