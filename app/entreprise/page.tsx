import { EntrepriseForm } from "@/components/entreprise/EntrepriseForm";
import { AuditInfo } from "@/components/admin/AuditInfo";
import { Alert } from "@/components/ui/Alert";
import { getEntreprise } from "@/lib/actions/entreprise";
import { getCurrentUser, getProfilesByIds } from "@/lib/auth";
import { buildAuditDisplay } from "@/lib/audit-utils";
import { isAdmin } from "@/lib/roles";

export const metadata = { title: "Mon entreprise — Facturation" };
export const dynamic = "force-dynamic";

export default async function EntreprisePage() {
  const user = await getCurrentUser();
  const { data: entreprise, error } = await getEntreprise();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Mon entreprise</h1>
        <Alert variant="error">Impossible de charger les informations : {error}</Alert>
      </div>
    );
  }

  let audit = undefined;
  if (entreprise && user && isAdmin(user.profile.role)) {
    const profiles = await getProfilesByIds([entreprise.created_by, entreprise.updated_by]);
    audit = buildAuditDisplay(entreprise, profiles);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Mon entreprise</h1>

      {!entreprise && (
        <div className="mb-6">
          <Alert variant="info">Aucune information enregistrée.</Alert>
        </div>
      )}

      <EntrepriseForm key={entreprise?.id ?? "new"} entreprise={entreprise} />

      {audit && (
        <div className="mt-6">
          <AuditInfo audit={audit} />
        </div>
      )}
    </div>
  );
}
