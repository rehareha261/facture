import { UsersManager } from "@/components/admin/UsersManager";
import { SuiviModifications, type SuiviItem } from "@/components/admin/SuiviModifications";
import { Alert } from "@/components/ui/Alert";
import { getProfilesByIds, requireAdmin } from "@/lib/auth";
import { buildAuditDisplay } from "@/lib/audit-utils";
import { getAllProfiles } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { AuditFields } from "@/lib/types";

export const metadata = { title: "Administration — Facturation" };
export const dynamic = "force-dynamic";

async function getRecentActivity(): Promise<SuiviItem[]> {
  const supabase = await createClient();

  const [factures, produits] = await Promise.all([
    supabase.from("factures").select("*").order("updated_at", { ascending: false }).limit(10),
    supabase.from("produits").select("*").order("updated_at", { ascending: false }).limit(10),
  ]);

  const records: { type: string; label: string; href: string; record: AuditFields }[] = [];

  for (const f of factures.data ?? []) {
    records.push({
      type: "Facture",
      label: f.numero,
      href: `/factures/${f.id}`,
      record: f as AuditFields,
    });
  }
  for (const p of produits.data ?? []) {
    records.push({
      type: "Produit",
      label: p.designation,
      href: "/produits",
      record: p as AuditFields,
    });
  }

  records.sort(
    (a, b) => new Date(b.record.updated_at).getTime() - new Date(a.record.updated_at).getTime()
  );

  const top = records.slice(0, 15);
  const profileIds = top.flatMap((r) => [r.record.created_by, r.record.updated_by]);
  const profiles = await getProfilesByIds(profileIds);

  return top.map((r) => ({
    type: r.type,
    label: r.label,
    href: r.href,
    audit: buildAuditDisplay(r.record, profiles),
  }));
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const { data: profiles, error } = await getAllProfiles();
  const activity = await getRecentActivity();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">Administration</h1>

      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Utilisateurs</h2>
        <UsersManager profiles={profiles} currentUserId={admin.id} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Dernières modifications</h2>
        <SuiviModifications items={activity} />
      </section>
    </div>
  );
}
