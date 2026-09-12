"use server";

import { revalidatePath } from "next/cache";
import { parseProduitsCsv } from "@/lib/import-produits";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import { getTauxTvaGlobal } from "@/lib/taux-tva";

export type ImportResult = {
  success: boolean;
  imported: number;
  errors: string[];
  error?: string;
};

/** Importe des produits depuis un contenu CSV */
export async function importProduitsCsv(csvContent: string): Promise<ImportResult> {
  const { rows, errors: parseErrors } = parseProduitsCsv(csvContent);

  if (rows.length === 0) {
    return {
      success: false,
      imported: 0,
      errors: parseErrors.length > 0 ? parseErrors : ["Aucune ligne valide à importer."],
      error: "Import impossible.",
    };
  }

  const taux_tva = await getTauxTvaGlobal();
  const supabase = await createSupabaseClient();
  const payload = rows.map((r) => ({
    designation: r.designation,
    prix_unitaire_ht: r.prix_unitaire_ht,
    taux_tva,
  }));

  const { error } = await supabase.from("produits").insert(payload);

  if (error) {
    return {
      success: false,
      imported: 0,
      errors: parseErrors,
      error: getSupabaseErrorMessage(error),
    };
  }

  revalidatePath("/produits");
  revalidatePath("/admin");

  return {
    success: true,
    imported: rows.length,
    errors: parseErrors,
  };
}
