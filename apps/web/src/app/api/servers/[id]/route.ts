import { successResponse, handleApiError } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";
import { validateServerId } from "@/lib/validate-server-id";
import { flattenServiceDetail } from "@clouddeck/datalix-client";
import { requireServerPermission, Permission } from "@/lib/permissions";
import { db } from "@/lib/db";

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
    const result = await client.getService(id);

    if (result.status === "error") {
      return Response.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    // Detail endpoint returns nested { display, product, service }
    // Flatten into a single object for the frontend
    let service = result.data as unknown as Record<string, unknown>;
    if (result.data && "service" in result.data && "product" in result.data) {
      service = flattenServiceDetail(result.data as unknown as import("@clouddeck/datalix-client").ServiceDetailRaw) as unknown as Record<string, unknown>;
    }

    // Resolve OS UUID and custom label in parallel
    const [osName, serverLabel] = await Promise.all([
      service.os && typeof service.os === "string"
        ? client.getServiceOs(id).then((r) => {
            if (r.status === "success" && Array.isArray(r.data)) {
              return r.data.find((o) => o.id === service.os)?.displayname ?? null;
            }
            return null;
          }).catch(() => null)
        : Promise.resolve(null),
      db.serverLabel.findUnique({ where: { serviceId: id } }),
    ]);

    if (osName) {
      service = { ...service, osName };
    }
    if (serverLabel) {
      service = { ...service, customLabel: serverLabel.label };
    }

    return successResponse(service);
  } catch (error) {
    return handleApiError(error);
  }
}
