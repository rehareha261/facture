import { Suspense } from "react";
import { AdminCorbeilleManager } from "@/components/admin/AdminCorbeilleManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { SuiviModifications, type SuiviItem } from "@/components/admin/SuiviModifications";
import { Alert } from "@/components/ui/Alert";
import { getProfilesByIds, requireAdmin } from "@/lib/auth";
import { buildAuditDisplay } from "@/lib/audit-utils";
import { getAllProfiles, getCorbeilleElements } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type { CorbeilleFiltre } from "@/lib/soft-delete";
import type { AuditFields } from "@/lib/types";

export const metadata = { title: "Administration — Facturation" };
export const dynamic = "force-dynamic";

async function getRecentActivity(): Promise<SuiviItem[]> {
  const supabase = await createClient();

  const [factures, produits] = await Promise.all([
    supabase
      .from("factures")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("produits")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10),
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

function parseCorbeilleFiltre(raw: string | undefined): CorbeilleFiltre {
  if (raw === "supprimes" || raw === "tous") return raw;
  return "actifs";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const corbeilleFiltre = parseCorbeilleFiltre(
    typeof sp.corbeille === "string" ? sp.corbeille : undefined
  );

  const [{ data: profiles, error }, activity, corbeilleRes] = await Promise.all([
    getAllProfiles(),
    getRecentActivity(),
    getCorbeilleElements(corbeilleFiltre),
  ]);

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

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Corbeille</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Restaurez les factures, produits ou entreprises supprimés par erreur.
        </p>
        {corbeilleRes.error && (
          <div className="mb-4">
            <Alert variant="error">{corbeilleRes.error}</Alert>
          </div>
        )}
        <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
          <AdminCorbeilleManager elements={corbeilleRes.data} filtre={corbeilleFiltre} />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Dernières modifications</h2>
        <SuiviModifications items={activity} />
      </section>
    </div>
  );
}
