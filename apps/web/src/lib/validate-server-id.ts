import { z } from "zod";
import { errorResponse } from "./api-response";

const serverIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid server ID");

export function validateServerId(id: string) {
  const parsed = serverIdSchema.safeParse(id);
  if (!parsed.success) {
    return { valid: false as const, response: errorResponse("Invalid server ID", 400) };
  }
  return { valid: true as const, id: parsed.data };
}
