import type { UserRole } from "@/lib/types";

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
