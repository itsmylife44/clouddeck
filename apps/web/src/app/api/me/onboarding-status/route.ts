import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Re-validate role from DB (never trust JWT role for decisions)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, active: true },
    });

    if (!user || !user.active) {
      return errorResponse("Authentication required", 401);
    }

    if (user.role === "ADMIN") {
      const keyCount = await db.apiKey.count({ where: { userId } });
      if (keyCount === 0) {
        return successResponse({ ready: false, reason: "no_api_key", role: "ADMIN" });
      }
      return successResponse({ ready: true, role: "ADMIN" });
    }

    // Regular user: run both checks in parallel
    const [adminKeyCount, permCount] = await Promise.all([
      db.apiKey.count({ where: { user: { role: "ADMIN" } } }),
      db.serverPermission.count({ where: { userId } }),
    ]);

    if (adminKeyCount === 0) {
      return successResponse({ ready: false, reason: "admin_no_api_key", role: "USER" });
    }

    if (permCount === 0) {
      return successResponse({ ready: false, reason: "no_permissions", role: "USER" });
    }

    return successResponse({ ready: true, role: "USER" });
  } catch (error) {
    return handleApiError(error);
  }
}
