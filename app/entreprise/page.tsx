import { EntreprisesManager } from "@/components/entreprise/EntreprisesManager";
import { Alert } from "@/components/ui/Alert";
import { getEntreprises } from "@/lib/actions/entreprise";

export const metadata = { title: "Mes entreprises — Facturation" };
export const dynamic = "force-dynamic";

export default async function EntreprisePage() {
  const { data: entreprises, error } = await getEntreprises();

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Mes entreprises</h1>
        <Alert variant="error">Impossible de charger les entreprises : {error}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Mes entreprises</h1>
      <EntreprisesManager entreprises={entreprises} />
    </div>
  );
}
