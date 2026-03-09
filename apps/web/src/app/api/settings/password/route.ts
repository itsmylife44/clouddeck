import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { successResponse, errorResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { db } from "@/lib/db";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(12, "New password must be at least 12 characters"),
});

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse("Current password is incorrect", 403);
    }

    const newHash = await hash(newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return successResponse({ message: "Password updated" });
  } catch (error) {
    return handleApiError(error);
  }
}
