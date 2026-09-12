"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { updateUserRole } from "@/lib/actions/admin";
import type { Profile, UserRole } from "@/lib/types";

interface UsersManagerProps {
  profiles: Profile[];
  currentUserId: string;
}

export function UsersManager({ profiles, currentUserId }: UsersManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setLoadingId(userId);
    setError(null);
    const result = await updateUserRole(userId, role);
    setLoadingId(null);
    if (!result.success) {
      setError(result.error ?? "Erreur");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Rôle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-4 py-3 text-sm font-medium">
                  {profile.full_name ?? "—"}
                  {profile.id === currentUserId && (
                    <span className="ml-1 text-xs text-zinc-400">(vous)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">{profile.email}</td>
                <td className="px-4 py-3 text-sm">
                  {profile.id === currentUserId ? (
                    <Badge variant={profile.role === "admin" ? "pro" : "default"}>
                      {profile.role === "admin" ? "Admin" : "Utilisateur"}
                    </Badge>
                  ) : (
                    <select
                      value={profile.role}
                      disabled={loadingId === profile.id}
                      onChange={(e) =>
                        handleRoleChange(profile.id, e.target.value as UserRole)
                      }
                      className="rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
