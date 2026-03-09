import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

function handleError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[Admin Permissions Error]", error);
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// GET /api/admin/permissions?userId=xxx
// Returns all server permissions for a user
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const permissions = await db.serverPermission.findMany({
      where: { userId },
      select: {
        id: true,
        serviceId: true,
        mask: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    return handleError(error);
  }
}

const upsertSchema = z.object({
  userId: z.string().min(1),
  serviceId: z.string().min(1),
  mask: z.number().int().min(0).max(255),
});

// POST /api/admin/permissions — create or update a server permission
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, serviceId, mask } = parsed.data;

    // Verify user exists and is not an admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Admins have full access; permissions are only for regular users" }, { status: 400 });
    }

    // If mask is 0, delete the permission row entirely
    if (mask === 0) {
      await db.serverPermission.deleteMany({
        where: { userId, serviceId },
      });
      return NextResponse.json({ success: true, data: null });
    }

    const permission = await db.serverPermission.upsert({
      where: { userId_serviceId: { userId, serviceId } },
      update: { mask },
      create: { userId, serviceId, mask },
    });

    return NextResponse.json({ success: true, data: permission });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/permissions — remove a server permission
const deleteSchema = z.object({
  userId: z.string().min(1),
  serviceId: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await db.serverPermission.deleteMany({
      where: { userId: parsed.data.userId, serviceId: parsed.data.serviceId },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleError(error);
  }
}
