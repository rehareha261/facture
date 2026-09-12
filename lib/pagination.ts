export const FACTURES_PAGE_SIZE = 50;

export function paginationRange(page: number, pageSize = FACTURES_PAGE_SIZE) {
  const p = Math.max(1, page);
  const from = (p - 1) * pageSize;
  return { page: p, from, to: from + pageSize - 1 };
}

export function totalPages(total: number, pageSize = FACTURES_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}
