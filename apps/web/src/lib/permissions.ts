import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-response";

// Bitmask permission flags
export const Permission = {
  VIEW: 1,       // View server details, status, IPs, livedata, traffic
  POWER: 2,      // Start, stop, restart, shutdown
  CONSOLE: 4,    // noVNC console access
  NETWORK: 8,    // Set rDNS, manage IPs
  BACKUP: 16,    // Create/restore/delete backups
  CRON: 32,      // Create/update/delete cron jobs
  REINSTALL: 64, // Reinstall OS
  EXTEND: 128,   // Extend service / hide service
} as const;

export type PermissionFlag = (typeof Permission)[keyof typeof Permission];

// Role templates for quick assignment
export const RoleTemplate = {
  VIEWER: Permission.VIEW,
  OPERATOR: Permission.VIEW | Permission.POWER | Permission.CONSOLE | Permission.BACKUP,
  MANAGER: Permission.VIEW | Permission.POWER | Permission.CONSOLE | Permission.NETWORK | Permission.BACKUP | Permission.CRON | Permission.REINSTALL | Permission.EXTEND,
} as const;

export const PERMISSION_LABELS: Record<number, string> = {
  [Permission.VIEW]: "View",
  [Permission.POWER]: "Power",
  [Permission.CONSOLE]: "Console",
  [Permission.NETWORK]: "Network",
  [Permission.BACKUP]: "Backup",
  [Permission.CRON]: "Cron",
  [Permission.REINSTALL]: "Reinstall",
  [Permission.EXTEND]: "Extend",
};

export function hasPermission(mask: number, flag: number): boolean {
  return (mask & flag) === flag;
}

export function addPermission(mask: number, flag: number): number {
  return mask | flag;
}

export function removePermission(mask: number, flag: number): number {
  return mask & ~flag;
}

export function permissionList(mask: number): string[] {
  return Object.entries(PERMISSION_LABELS)
    .filter(([flag]) => hasPermission(mask, Number(flag)))
    .map(([, label]) => label);
}

/**
 * Check if the current user has the required permission for a server.
 * ADMINs bypass permission checks entirely.
 * USERs must have an explicit ServerPermission row with the required flag.
 *
 * Returns the session on success, or a Response on failure.
 */
export async function requireServerPermission(
  serviceId: string,
  requiredFlag: number
): Promise<
  | { ok: true; session: { user: { id: string; role: string } } }
  | { ok: false; response: Response }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: errorResponse("Authentication required", 401) };
  }

  // Re-validate role from DB to prevent stale JWT privilege escalation
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, active: true },
  });

  if (!dbUser || !dbUser.active) {
    return { ok: false, response: errorResponse("Authentication required", 401) };
  }

  // ADMINs have full access to all servers
  if (dbUser.role === "ADMIN") {
    return { ok: true, session: { user: { id: session.user.id, role: "ADMIN" } } };
  }

  // USERs need explicit permission — VIEW is always required as a prerequisite
  const perm = await db.serverPermission.findUnique({
    where: { userId_serviceId: { userId: session.user.id, serviceId } },
    select: { mask: true },
  });

  if (!perm || !hasPermission(perm.mask, Permission.VIEW) || !hasPermission(perm.mask, requiredFlag)) {
    return { ok: false, response: errorResponse("You do not have permission for this server", 403) };
  }

  return { ok: true, session: { user: { id: session.user.id, role: "USER" } } };
}

/**
 * Get all service IDs the current user has VIEW permission for.
 * ADMINs get null (meaning "all servers").
 */
export async function getAllowedServiceIds(
  userId: string
): Promise<string[] | null> {
  // Re-validate role from DB
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, active: true },
  });

  if (!dbUser || !dbUser.active) return [];
  if (dbUser.role === "ADMIN") return null; // null = all

  const perms = await db.serverPermission.findMany({
    where: { userId },
    select: { serviceId: true, mask: true },
  });

  return perms
    .filter((p: { mask: number }) => hasPermission(p.mask, Permission.VIEW))
    .map((p: { serviceId: string }) => p.serviceId);
}
