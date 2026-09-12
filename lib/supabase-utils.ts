/** Extrait un message d'erreur lisible depuis une réponse Supabase */
export function getSupabaseErrorMessage(error: { message: string } | null): string {
  if (!error) return "Une erreur inconnue est survenue.";
  return error.message;
}
