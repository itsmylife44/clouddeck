import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";

export async function GET() {
  try {
    await requireAuth();
    const client = await requireDatalixClient();
    const result = await client.listServices();

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
