import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { getAllowedServiceIds } from "@/lib/permissions";
import { db } from "@/lib/db";
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

    const [allowedIds, labels] = await Promise.all([
      getAllowedServiceIds(session.user.id),
      db.serverLabel.findMany(),
    ]);

    // ADMINs see all, USERs only see servers they have VIEW permission for
    let servers = result.data as ServiceListItem[];
    if (allowedIds !== null) {
      servers = servers.filter((s) => allowedIds.includes(String(s.id)));
    }

    // Enrich with custom labels
    const labelMap = new Map(labels.map((l) => [l.serviceId, l.label]));
    const enriched = servers.map((s) => ({
      ...s,
      customLabel: labelMap.get(String(s.id)) ?? null,
    }));

    return successResponse(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}
