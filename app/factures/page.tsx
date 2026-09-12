import Link from "next/link";
import { Suspense } from "react";
import { FacturesList } from "@/components/factures/FacturesList";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { FACTURES_PAGE_SIZE, paginationRange, totalPages } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { FactureAvecLignes, Produit } from "@/lib/types";

export const metadata = { title: "Factures — Facturation" };
export const dynamic = "force-dynamic";

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const numero = String(sp.numero ?? "").trim();
  const produitId = String(sp.produit ?? "").trim();
  const debut = String(sp.debut ?? "").trim();
  const fin = String(sp.fin ?? "").trim();

  const { from, to } = paginationRange(page);
  const supabase = await createClient();

  const selectCols = produitId
    ? "*, lignes_facture!inner(produit_id, designation)"
    : "*, lignes_facture(produit_id, designation)";

  let facturesQuery = supabase
    .from("factures")
    .select(selectCols, { count: "exact" })
    .order("date_emission", { ascending: false });

  if (numero) facturesQuery = facturesQuery.ilike("numero", `%${numero}%`);
  if (debut) facturesQuery = facturesQuery.gte("date_emission", debut);
  if (fin) facturesQuery = facturesQuery.lte("date_emission", fin);
  if (produitId) facturesQuery = facturesQuery.eq("lignes_facture.produit_id", produitId);

  const [facturesRes, produitsRes] = await Promise.all([
    facturesQuery.range(from, to),
    supabase.from("produits").select("id, designation").order("designation"),
  ]);

  if (facturesRes.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Factures</h1>
        <Alert variant="error">
          Impossible de charger les factures : {getSupabaseErrorMessage(facturesRes.error)}
        </Alert>
      </div>
    );
  }

  const total = facturesRes.count ?? 0;
  const pages = totalPages(total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Factures</h1>
        <Link
          href="/factures/nouvelle"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nouvelle facture
        </Link>
      </div>

      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <FacturesList
          factures={(facturesRes.data ?? []) as FactureAvecLignes[]}
          produits={(produitsRes.data ?? []) as Pick<Produit, "id" | "designation">[]}
        />
        <Pagination currentPage={page} totalPages={pages} totalItems={total} />
      </Suspense>
    </div>
  );
}
