"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function Pagination({ currentPage, totalPages, totalItems }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const q = params.toString();
    return q ? `/factures?${q}` : "/factures";
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
      <span>{totalItems} facture{totalItems !== 1 ? "s" : ""}</span>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link href={href(currentPage - 1)} className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50">
            Précédent
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-400">Précédent</span>
        )}
        <span>
          Page {currentPage} / {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link href={href(currentPage + 1)} className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50">
            Suivant
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-400">Suivant</span>
        )}
      </div>
    </div>
  );
}
