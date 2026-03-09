import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { validateServerId } from "@/lib/validate-server-id";
import { db } from "@/lib/db";

/** GET /api/servers/labels — admin-only, returns all labels as { serviceId: label } */
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return errorResponse("Admin access required", 403);
    }

    const labels = await db.serverLabel.findMany();
    const map: Record<string, string> = {};
    for (const l of labels) {
      map[l.serviceId] = l.label;
    }

    return successResponse(map);
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/servers/labels — upsert a label for a server (admin only) */
export async function PUT(request: Request) {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return errorResponse("Admin access required", 403);
    }

    const body = await request.json();
    const { serviceId, label } = body as { serviceId?: string; label?: string };

    if (!serviceId || typeof serviceId !== "string") {
      return errorResponse("serviceId is required", 400);
    }

    // Validate serviceId format using shared utility
    const check = validateServerId(serviceId);
    if (!check.valid) return check.response;

    // Empty label = delete
    if (!label || !label.trim()) {
      await db.serverLabel.deleteMany({ where: { serviceId } });
      return successResponse({ serviceId, label: null });
    }

    const trimmed = label.trim().slice(0, 100);

    const result = await db.serverLabel.upsert({
      where: { serviceId },
      update: { label: trimmed },
      create: { serviceId, label: trimmed },
    });

    return successResponse({ serviceId: result.serviceId, label: result.label });
  } catch (error) {
    return handleApiError(error);
  }
}
