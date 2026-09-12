"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { VentesMensuellesChartData } from "@/lib/dashboard-ventes";
import { formatMontant } from "@/lib/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const COULEURS = ["#2563eb", "#16a34a", "#9333ea"] as const;

interface VentesMensuellesChartProps {
  data: VentesMensuellesChartData;
}

export function VentesMensuellesChart({ data }: VentesMensuellesChartProps) {
  const [anN, anN1, anN2] = data.annees;

  const chartData = {
    labels: data.labels,
    datasets: data.series.map((s, i) => ({
      label: String(s.annee),
      data: s.montants,
      borderColor: COULEURS[i],
      backgroundColor: `${COULEURS[i]}22`,
      tension: 0.25,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">
        Vente de boisson alcoolique par mois hors taxe
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        Total HT facturé — comparaison {anN2}, {anN1} et {anN} (n)
      </p>
      <div className="h-80 w-full">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const v = ctx.parsed.y ?? 0;
                    return `${ctx.dataset.label} : ${formatMontant(v)} HT`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    const n = Number(value);
                    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
                    if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
                    return String(n);
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
