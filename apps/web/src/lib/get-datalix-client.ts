import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DatalixClient } from "@clouddeck/datalix-client";

/**
 * Resolve the Datalix API client.
 *
 * - ADMINs: use their own API key
 * - USERs: use the first available ADMIN's API key
 *   (users don't have their own keys; admins share API access)
 */
export async function getDatalixClient(): Promise<DatalixClient | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Re-validate role from DB to prevent stale JWT privilege escalation
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, active: true },
  });

  if (!dbUser || !dbUser.active) return null;

  let apiKey;

  if (dbUser.role === "ADMIN") {
    // Admin uses their own key
    apiKey = await db.apiKey.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Regular user: find any admin's API key
    apiKey = await db.apiKey.findFirst({
      where: { user: { role: "ADMIN" } },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!apiKey) return null;

  const token = decrypt(apiKey.encryptedKey, apiKey.iv, apiKey.authTag);

  // Only update lastUsedAt if it hasn't been updated in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (!apiKey.lastUsedAt || apiKey.lastUsedAt < fiveMinutesAgo) {
    db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});
  }

  return new DatalixClient(token);
}

export async function requireDatalixClient(): Promise<DatalixClient> {
  const client = await getDatalixClient();
  if (!client) {
    throw new Error("NO_API_KEY");
  }
  return client;
}
