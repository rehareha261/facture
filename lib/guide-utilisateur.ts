import { readFileSync } from "fs";
import { join } from "path";

export function getGuideUtilisateurMarkdown(): string {
  const filePath = join(process.cwd(), "GUIDE-UTILISATEUR.md");
  return readFileSync(filePath, "utf-8");
}
