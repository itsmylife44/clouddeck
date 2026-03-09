import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

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
    console.error("[Admin Users Error]", error);
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { apiKeys: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleError(error);
  }
}

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        preferences: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

const updateUserSchema = z.object({
  id: z.string(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { id, role, active } = parsed.data;

    // Prevent admin from deactivating themselves
    if (id === session.user.id && active === false) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (id === session.user.id && role === "USER") {
      return NextResponse.json({ error: "You cannot demote your own account" }, { status: 400 });
    }

    // Prevent removing the last admin
    if (role === "USER") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
      }
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}
