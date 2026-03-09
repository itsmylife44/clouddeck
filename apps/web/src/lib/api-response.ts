import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return errorResponse("Authentication required", 401);
    }
    if (error.message === "FORBIDDEN") {
      return errorResponse("You do not have permission for this action", 403);
    }
    if (error.message === "NO_API_KEY") {
      return errorResponse("No Datalix API key configured. Please add one in Settings.", 422);
    }
    console.error("[API Error]", error);
  }
  return errorResponse("Internal server error", 500);
}
