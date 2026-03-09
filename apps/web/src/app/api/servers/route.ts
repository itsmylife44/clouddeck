import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { getAllowedServiceIds } from "@/lib/permissions";
import type { ServiceListItem } from "@clouddeck/datalix-client";

export async function GET() {
  try {
    const session = await requireAuth();
    const client = await requireDatalixClient();
    const result = await client.listServices();

    if (result.status === "error") {
      return Response.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    const allowedIds = await getAllowedServiceIds(session.user.id);

    // ADMINs see all, USERs only see servers they have VIEW permission for
    let servers = result.data as ServiceListItem[];
    if (allowedIds !== null) {
      servers = servers.filter((s) => allowedIds.includes(String(s.id)));
    }

    return successResponse(servers);
  } catch (error) {
    return handleApiError(error);
  }
}
