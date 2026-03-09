import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { isSetupComplete, invalidateSetupCache } from "@/lib/setup";

const setupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
});

export async function GET() {
  const complete = await isSetupComplete();
  return NextResponse.json({ setupComplete: complete });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const passwordHash = await hash(password, 12);

    // Atomic check-and-create inside a transaction to prevent race conditions
    try {
      await db.$transaction(async (tx) => {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount > 0) {
          throw new Error("SETUP_COMPLETE");
        }
        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "ADMIN",
            preferences: { create: {} },
          },
        });
      });
    } catch (txError) {
      if (txError instanceof Error && txError.message === "SETUP_COMPLETE") {
        return NextResponse.json(
          { error: "Setup has already been completed" },
          { status: 403 }
        );
      }
      throw txError;
    }

    invalidateSetupCache();

    return NextResponse.json(
      { message: "Admin account created. You can now sign in." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
