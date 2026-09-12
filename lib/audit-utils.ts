import type { AuditDisplay, AuditFields, Profile } from "@/lib/types";

function profileLabel(profile: Profile | undefined): string | null {
  if (!profile) return null;
  return profile.full_name || profile.email;
}

/** Construit les infos d'audit pour l'affichage admin */
export function buildAuditDisplay(
  record: AuditFields,
  profiles: Map<string, Profile>
): AuditDisplay {
  return {
    created_at: record.created_at,
    updated_at: record.updated_at,
    created_by_name: record.created_by
      ? profileLabel(profiles.get(record.created_by))
      : null,
    updated_by_name: record.updated_by
      ? profileLabel(profiles.get(record.updated_by))
      : null,
  };
}

export function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
