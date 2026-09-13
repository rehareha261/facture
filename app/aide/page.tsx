import { GuideMarkdown } from "@/components/aide/GuideMarkdown";
import { getGuideUtilisateurMarkdown } from "@/lib/guide-utilisateur";

export const metadata = { title: "Aide — Facturation" };

export default function AidePage() {
  const content = getGuideUtilisateurMarkdown();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <GuideMarkdown content={content} />
    </div>
  );
}
