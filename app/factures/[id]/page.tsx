import { notFound } from "next/navigation";
import { FactureDetailView } from "@/components/factures/FactureDetailView";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser, getProfilesByIds } from "@/lib/auth";
import { buildAuditDisplay } from "@/lib/audit-utils";
import { isAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { FactureComplete } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/factures/[id]">) {
  const supabase = await createClient();
  const { id } = await params;
  const { data } = await supabase.from("factures").select("numero").eq("id", id).single();
  return { title: data ? `Facture ${data.numero}` : "Facture" };
}

export default async function FactureDetailPage({ params }: PageProps<"/factures/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("factures")
    .select("*, clients(*), lignes_facture(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") notFound();
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert variant="error">
          Impossible de charger la facture : {getSupabaseErrorMessage(error)}
        </Alert>
      </div>
    );
  }

  if (!data) notFound();

  const facture = data as FactureComplete;
  let audit = undefined;

  if (user && isAdmin(user.profile.role)) {
    const profiles = await getProfilesByIds([facture.created_by, facture.updated_by]);
    audit = buildAuditDisplay(facture, profiles);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FactureDetailView facture={facture} audit={audit} />
    </div>
  );
}
