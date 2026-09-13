"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { QuantitesMensuellesData } from "@/lib/dashboard-produits";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface QuantitesProduitsChartProps {
  data: QuantitesMensuellesData;
}

export function QuantitesProduitsChart({ data }: QuantitesProduitsChartProps) {
  const total = data.quantites.reduce((s, q) => s + q, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">Quantités vendues par mois</h2>
      <p className="mb-4 text-sm text-zinc-500">
        {data.produitLabel} — {data.annee} ({total.toLocaleString("fr-FR")} unités)
      </p>
      <div className="h-72 w-full">
        <Bar
          data={{
            labels: data.labels,
            datasets: [
              {
                label: "Quantité",
                data: data.quantites,
                backgroundColor: "#2563eb99",
                borderColor: "#2563eb",
                borderWidth: 1,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString("fr-FR")} unités`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => Number(value).toLocaleString("fr-FR"),
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
