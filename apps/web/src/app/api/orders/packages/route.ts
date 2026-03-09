import { NextRequest } from "next/server";
import { successResponse, handleApiError, requireAuth } from "@/lib/api-response";
import { requireDatalixClient } from "@/lib/get-datalix-client";

// Known Datalix KVM lines
const KVM_LINES = ["intelxeon", "amdepyc"];

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const lineId = request.nextUrl.searchParams.get("line");
    const client = await requireDatalixClient();

    if (lineId) {
      const result = await client.getKvmLine(lineId);
      if (result.status === "error") {
        return Response.json({ success: false, error: result.message }, { status: 502 });
      }
      return successResponse(result.data);
    }

    // Fetch all known lines in parallel
    const results = await Promise.all(
      KVM_LINES.map(async (id) => {
        const r = await client.getKvmLine(id);
        return { id, packages: Array.isArray(r.data) ? r.data : [] };
      })
    );

    const lines: Record<string, unknown[]> = {};
    for (const r of results) {
      if (r.packages.length > 0) lines[r.id] = r.packages;
    }

    return successResponse(lines);
  } catch (error) {
    return handleApiError(error);
  }
}
