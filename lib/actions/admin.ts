"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { CorbeilleElement, CorbeilleElementType, CorbeilleFiltre } from "@/lib/soft-delete";
import type { ActionResult } from "@/lib/actions/clients";
import type { Profile, UserRole } from "@/lib/types";

const CORBEILLE_TABLES: Record<CorbeilleElementType, string> = {
  facture: "factures",
  produit: "produits",
  entreprise: "entreprise",
};

function applyCorbeilleFiltre<T extends { is: (col: string, val: null) => T; not: (col: string, op: string, val: null) => T }>(
  query: T,
  filtre: CorbeilleFiltre
): T {
  if (filtre === "actifs") return query.is("deleted_at", null);
  if (filtre === "supprimes") return query.not("deleted_at", "is", null);
  return query;
}

/** Liste tous les utilisateurs (admin uniquement) */
export async function getAllProfiles(): Promise<{ data: Profile[]; error?: string }> {
  await requireAdmin();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: getSupabaseErrorMessage(error) };
  return { data: (data ?? []) as Profile[] };
}

/** Change le rôle d'un utilisateur (admin uniquement) */
export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (userId === admin.id && role !== "admin") {
    return { success: false, error: "Vous ne pouvez pas retirer votre propre rôle admin." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/admin");
  return { success: true };
}

/** Liste factures, produits et entreprises pour la corbeille admin */
export async function getCorbeilleElements(
  filtre: CorbeilleFiltre = "actifs"
): Promise<{ data: CorbeilleElement[]; error?: string }> {
  await requireAdmin();
  const supabase = await createSupabaseClient();

  const [facturesRes, produitsRes, entreprisesRes] = await Promise.all([
    applyCorbeilleFiltre(
      supabase.from("factures").select("id, numero, deleted_at, updated_at").order("updated_at", { ascending: false }),
      filtre
    ).limit(50),
    applyCorbeilleFiltre(
      supabase.from("produits").select("id, designation, deleted_at, updated_at").order("updated_at", { ascending: false }),
      filtre
    ).limit(50),
    applyCorbeilleFiltre(
      supabase.from("entreprise").select("id, nom, deleted_at, updated_at").order("updated_at", { ascending: false }),
      filtre
    ).limit(50),
  ]);

  const error =
    facturesRes.error ?? produitsRes.error ?? entreprisesRes.error;
  if (error) return { data: [], error: getSupabaseErrorMessage(error) };

  const elements: CorbeilleElement[] = [
    ...(facturesRes.data ?? []).map((f) => ({
      id: f.id,
      type: "facture" as const,
      label: f.numero,
      deleted_at: f.deleted_at as string | null,
      updated_at: f.updated_at,
    })),
    ...(produitsRes.data ?? []).map((p) => ({
      id: p.id,
      type: "produit" as const,
      label: p.designation,
      deleted_at: p.deleted_at as string | null,
      updated_at: p.updated_at,
    })),
    ...(entreprisesRes.data ?? []).map((e) => ({
      id: e.id,
      type: "entreprise" as const,
      label: e.nom,
      deleted_at: e.deleted_at as string | null,
      updated_at: e.updated_at,
    })),
  ];

  elements.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return { data: elements.slice(0, 50) };
}

/** Restaure un élément supprimé (admin uniquement) */
export async function restoreElement(
  type: CorbeilleElementType,
  id: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseClient();
  const table = CORBEILLE_TABLES[type];

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/admin");
  revalidatePath("/factures");
  revalidatePath("/produits");
  revalidatePath("/entreprise");
  revalidatePath("/");
  revalidatePath(`/factures/${id}`);
  return { success: true };
}
