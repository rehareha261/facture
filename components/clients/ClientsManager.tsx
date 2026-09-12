"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { deleteClient } from "@/lib/actions/clients";
import type { AuditDisplay, Client } from "@/lib/types";

interface ClientsManagerProps {
  clients: Client[];
  isAdmin?: boolean;
  auditMap?: Record<string, AuditDisplay>;
}

export function ClientsManager({ clients, isAdmin = false, auditMap }: ClientsManagerProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (client: Client) => {
    const confirmed = window.confirm(
      `Supprimer le client « ${client.nom} » ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setDeletingId(client.id);
    setDeleteError(null);

    const result = await deleteClient(client.id);
    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.error ?? "Impossible de supprimer ce client.");
      return;
    }

    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nouveau client
        </button>
      </div>

      {deleteError && (
        <div className="mb-4">
          <Alert variant="error">{deleteError}</Alert>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-zinc-500">Aucun client enregistré.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Ajouter votre premier client
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Téléphone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                    {client.nom}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {client.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {client.telephone ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {client.est_professionnel ? (
                      <Badge variant="pro">Pro</Badge>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(client)}
                      className="mr-2 font-medium text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client)}
                      disabled={deletingId === client.id}
                      className="font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === client.id ? "Suppression…" : "Supprimer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientFormModal
        open={formOpen}
        onClose={closeForm}
        client={editingClient}
        audit={editingClient && auditMap ? auditMap[editingClient.id] : undefined}
        showAudit={isAdmin}
      />
    </>
  );
}
