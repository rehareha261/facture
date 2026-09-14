import { ClientsManager } from "@/components/clients/ClientsManager";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import { getCurrentUser, getProfilesByIds } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { buildAuditDisplay } from "@/lib/audit-utils";
import type { Client } from "@/lib/types";

export const metadata = {
  title: "Clients — Facturation",
};

// Données live depuis Supabase — pas de cache statique
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("nom", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Clients</h1>
        <Alert variant="error">
          Impossible de charger les clients : {getSupabaseErrorMessage(error)}
        </Alert>
        <p className="mt-4 text-sm text-zinc-500">
          Vérifiez que vos clés Supabase sont configurées dans{" "}
          <code className="rounded bg-zinc-100 px-1">.env.local</code> et que la
          table <code className="rounded bg-zinc-100 px-1">clients</code> existe.
        </p>
      </div>
    );
  }

  const clients = (data ?? []) as Client[];

  let auditMap: Record<string, ReturnType<typeof buildAuditDisplay>> | undefined;
  if (user && isAdmin(user.profile.role)) {
    const profiles = await getProfilesByIds(
      clients.flatMap((c) => [c.created_by, c.updated_by])
    );
    auditMap = Object.fromEntries(
      clients.map((c) => [c.id, buildAuditDisplay(c, profiles)])
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Clients</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Gérez vos clients particuliers et professionnels.
      </p>
      <ClientsManager
        clients={clients}
        isAdmin={user ? isAdmin(user.profile.role) : false}
        auditMap={auditMap}
      />
    </div>
  );
}
