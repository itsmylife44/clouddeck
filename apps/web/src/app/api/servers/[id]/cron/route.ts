import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";
import { requireServerPermission, Permission } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.CRON);
    if (!perm.ok) return perm.response;

    const client = await requireDatalixClient();
    const result = await client.listCronJobs(id);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

const cronSchema = z.object({
  name: z.string().min(1),
  action: z.enum(["start", "stop", "restart"]),
  expression: z.string().min(1),
  cronId: z.string().optional(),
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

    const perm = await requireServerPermission(id, Permission.CRON);
    if (!perm.ok) return perm.response;

    const body = await request.json();
    const parsed = cronSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const client = await requireDatalixClient();
    const { name, action, expression, cronId } = parsed.data;

    const result = cronId
      ? await client.updateCronJob(id, cronId, { name, action, expression })
      : await client.createCronJob(id, { name, action, expression });

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: perm.session.user.id,
        action: cronId ? "cron.update" : "cron.create",
        serviceId: id,
        metadata: { name, action, expression },
      },
    });

    return successResponse(result.data, cronId ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = await params;
    const check = validateServerId(raw.id);
    if (!check.valid) return check.response;
    const id = check.id;

    const perm = await requireServerPermission(id, Permission.CRON);
    if (!perm.ok) return perm.response;

    const { cronId } = await request.json();

    if (!cronId) return errorResponse("cronId required", 400);

    const client = await requireDatalixClient();
    const result = await client.deleteCronJob(id, cronId);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: perm.session.user.id,
        action: "cron.delete",
        serviceId: id,
        metadata: { cronId },
      },
    });

    return successResponse({ message: "Cron job deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
