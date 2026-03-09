import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { db } from "@/lib/db";

const orderSchema = z.object({
  packetId: z.string().min(1),
  os: z.string().min(1),
  paymentMethod: z.string().min(1),
  ipcount: z.number().int().min(1).max(10).default(1),
  credit: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid order data", 400);
    }

    const { packetId, os, paymentMethod, ipcount, credit } = parsed.data;
    const client = await requireDatalixClient();
    const result = await client.orderKvmServer(packetId, {
      paymentMethod,
      os: Number(os),
      ipcount,
      credit,
    });

    if (result.status === "error") {
      return Response.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "order.create",
        metadata: { packetId, os, paymentMethod },
      },
    });

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
