import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";

const paySchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = paySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid payment data", 400);
    }

    const { orderId, paymentMethod } = parsed.data;
    const client = await requireDatalixClient();
    const result = await client.payOrder(orderId, paymentMethod);

    if (result.status === "error") {
      return Response.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    return successResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
