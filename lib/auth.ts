import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

/** Utilisateur connecté avec son profil, ou null */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
  };
}

/** Redirige vers /login si non connecté */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirige si l'utilisateur n'est pas admin */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.profile.role !== "admin") redirect("/");
  return user;
}

/** Charge les profils pour afficher les noms dans l'audit */
export async function getProfilesByIds(
  ids: (string | null | undefined)[]
): Promise<Map<string, Profile>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))] as string[];
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").in("id", uniqueIds);

  const map = new Map<string, Profile>();
  for (const p of data ?? []) {
    map.set(p.id, p as Profile);
  }
  return map;
}
