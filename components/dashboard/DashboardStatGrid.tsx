interface StatItem {
  label: string;
  value: string;
  sub?: string;
}

interface DashboardStatGridProps {
  stats: StatItem[];
  columns?: 2 | 4;
}

export function DashboardStatGrid({ stats, columns = 4 }: DashboardStatGridProps) {
  const gridClass =
    columns === 2
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={gridClass}>
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">{stat.label}</p>
          <p className="mt-1 text-lg font-bold leading-snug text-zinc-900">{stat.value}</p>
          {stat.sub && <p className="mt-1 text-sm text-zinc-600">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
}
