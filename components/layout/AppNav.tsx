"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/factures", label: "Factures" },
  { href: "/factures/nouvelle", label: "Nouvelle facture" },
  { href: "/produits", label: "Produits" },
  { href: "/entreprise", label: "Mes entreprises" },
];

interface AppNavProps {
  user: AuthUser | null;
}

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) return null;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          Facturation
        </Link>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
          {user && isAdmin(user.profile.role) && (
            <Link
              href="/admin"
              className="rounded-md px-2 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Admin
            </Link>
          )}
        </nav>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">
              {user.profile.full_name || user.email}
              {isAdmin(user.profile.role) && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                  Admin
                </span>
              )}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-600 hover:bg-zinc-50"
              >
                Déconnexion
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
