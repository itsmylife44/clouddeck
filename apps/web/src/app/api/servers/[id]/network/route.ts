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
    const result = await client.getServiceIps(id);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

const rdnsSchema = z.object({
  ip: z.string().min(1),
  rdns: z.string().min(1),
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
    const parsed = rdnsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("IP and rDNS are required", 400);
    }

    const client = await requireDatalixClient();
    const result = await client.setRdns(id, parsed.data.ip, parsed.data.rdns);

    if (result.status === "error") {
      return Response.json({ success: false, error: result.message }, { status: 502 });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "network.rdns",
        serviceId: id,
        metadata: parsed.data,
      },
    });

    return successResponse({ message: "rDNS updated" });
  } catch (error) {
    return handleApiError(error);
  }
}
