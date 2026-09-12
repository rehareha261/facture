import { formatAuditDate } from "@/lib/audit-utils";
import type { AuditDisplay } from "@/lib/types";

export interface SuiviItem {
  type: string;
  label: string;
  href: string;
  audit: AuditDisplay;
}

interface SuiviModificationsProps {
  items: SuiviItem[];
}

/** Tableau des dernières modifications — visible admin uniquement */
export function SuiviModifications({ items }: SuiviModificationsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">Aucune modification enregistrée.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Élément
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Modifié le
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Modifié par
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Créé par
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {items.map((item) => (
            <tr key={`${item.type}-${item.label}`}>
              <td className="px-4 py-3">
                <span className="mr-2 text-xs text-zinc-400">{item.type}</span>
                <a href={item.href} className="font-medium text-blue-600 hover:underline">
                  {item.label}
                </a>
              </td>
              <td className="px-4 py-3 text-zinc-600">{formatAuditDate(item.audit.updated_at)}</td>
              <td className="px-4 py-3 text-zinc-600">{item.audit.updated_by_name ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-600">{item.audit.created_by_name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
