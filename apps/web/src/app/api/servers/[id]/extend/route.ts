import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";
import { requireServerPermission, Permission } from "@/lib/permissions";

const extendSchema = z.object({
  days: z.number().int().min(1).max(365),
  credit: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.EXTEND);
    if (!perm.ok) return perm.response;

    const body = await request.json();
    const parsed = extendSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Valid days (1-365) required", 400);
    }

    const client = await requireDatalixClient();
    const result = await client.extendService(id, parsed.data.days, parsed.data.credit);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: perm.session.user.id,
        action: "server.extend",
        serviceId: id,
        metadata: { days: parsed.data.days, credit: parsed.data.credit },
      },
    });

    return successResponse({ message: `Service extended by ${parsed.data.days} days` });
  } catch (error) {
    return handleApiError(error);
  }
}
