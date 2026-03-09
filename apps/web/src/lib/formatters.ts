/**
 * Shared formatting utilities.
 * Every formatter is a pure function — no side-effects, no mutations.
 */

export function formatMemory(mb?: number): string {
  if (!mb) return "—";
  return mb >= 1024
    ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
    : `${mb} MB`;
}

export function formatDisk(mb?: number): string {
  if (!mb) return "—";
  return mb >= 1024
    ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
    : `${mb} MB`;
}

export function formatUplink(mbit?: number): string {
  if (!mbit) return "—";
  return mbit >= 1000
    ? `${(mbit / 1000).toFixed(mbit % 1000 === 0 ? 0 : 1)} Gbit/s`
    : `${mbit} Mbit/s`;
}

export function formatExpiry(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Parse a string-or-number value to a number (handles comma decimals). */
export function num(v: string | number): number {
  return typeof v === "string" ? parseFloat(v.replace(",", ".")) || 0 : v;
}
