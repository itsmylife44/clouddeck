import { successResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
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

    const perm = await requireServerPermission(id, Permission.VIEW);
    if (!perm.ok) return perm.response;

    const client = await requireDatalixClient();
    const result = await client.getLiveData(id);

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
