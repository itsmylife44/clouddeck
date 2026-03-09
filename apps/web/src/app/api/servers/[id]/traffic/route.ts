import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";

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
    const result = await client.getTraffic(id);

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
