import { NextRequest } from "next/server";
import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { db } from "@/lib/db";

// GET /api/me/permissions?serviceId=xxx
// Returns the current user's permission mask for a specific server
// ADMINs get 255 (all permissions)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const role = (session.user as { role?: string }).role;

    const serviceId = request.nextUrl.searchParams.get("serviceId");

    if (role === "ADMIN") {
      return successResponse({ mask: 255, role: "ADMIN" });
    }

    if (!serviceId) {
      // Return all permissions for the user
      const perms = await db.serverPermission.findMany({
        where: { userId: session.user.id },
        select: { serviceId: true, mask: true },
      });
      return successResponse({ permissions: perms, role: "USER" });
    }

    const perm = await db.serverPermission.findUnique({
      where: {
        userId_serviceId: { userId: session.user.id, serviceId },
      },
      select: { mask: true },
    });

    return successResponse({ mask: perm?.mask ?? 0, role: "USER" });
  } catch (error) {
    return handleApiError(error);
  }
}
