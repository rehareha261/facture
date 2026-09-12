import { formatAuditDate } from "@/lib/audit-utils";
import type { AuditDisplay } from "@/lib/types";

interface AuditInfoProps {
  audit: AuditDisplay;
  label?: string;
}

/**
 * Bloc de traçabilité — réservé aux administrateurs.
 * Affiche qui a créé / modifié et quand.
 */
export function AuditInfo({ audit, label = "Traçabilité" }: AuditInfoProps) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-xs text-zinc-600">
      <p className="mb-2 font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <dl className="grid gap-1 sm:grid-cols-2">
        <div>
          <dt className="text-zinc-400">Créé le</dt>
          <dd>{formatAuditDate(audit.created_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Créé par</dt>
          <dd>{audit.created_by_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Modifié le</dt>
          <dd>{formatAuditDate(audit.updated_at)}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Modifié par</dt>
          <dd>{audit.updated_by_name ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
