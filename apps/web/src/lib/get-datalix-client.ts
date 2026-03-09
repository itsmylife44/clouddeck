import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { DatalixClient } from "@clouddeck/datalix-client";

export async function getDatalixClient(): Promise<DatalixClient | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const apiKey = await db.apiKey.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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
