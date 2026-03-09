import { db } from "./db";

let setupComplete: boolean | null = null;

export async function isSetupComplete(): Promise<boolean> {
  if (setupComplete === true) return true;

  const adminCount = await db.user.count({
    where: { role: "ADMIN" },
  });

  setupComplete = adminCount > 0;
  return setupComplete;
}

export function invalidateSetupCache() {
  setupComplete = null;
}
