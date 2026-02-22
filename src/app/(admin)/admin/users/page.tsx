"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  email: string | null;
  name: string;
  created_at: string;
  banned_until?: string | null;
  roles: string[];
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", searchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("q", searchDebounced);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load users");
      return json as { users: UserRow[] };
    },
  });
  const users = data?.users ?? [];

  const setStatus = async (userId: string, status: "active" | "suspended") => {
    setActing(`status-${userId}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage({ type: "success", text: status === "suspended" ? "User suspended" : "User activated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setActing(null);
    }
  };

  const toggleRole = async (userId: string, role: string, action: "add" | "remove") => {
    setActing(`${userId}-${role}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage({ type: "success", text: `Role ${action === "add" ? "added" : "removed"}` });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setActing(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    setActing(`del-${userId}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage({ type: "success", text: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete" });
    } finally {
      setActing(null);
    }
  };

  const isBanned = (u: UserRow) => !!u.banned_until;
  const isActingOn = (u: UserRow) =>
    acting !== null &&
    (acting === `status-${u.id}` ||
      acting === `del-${u.id}` ||
      acting.startsWith(`${u.id}-`));

  return (
    <div className="p-8 animate-admin-enter">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Users
      </h1>
      <p className="text-sm text-text-muted mb-6">
        Search and manage users. Suspend/activate and change roles (superadmin only).
      </p>

      <div className="mb-6 flex items-center gap-4">
        <Input
          label="Search"
          placeholder="Email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded-[var(--radius-md)] text-sm ${
            message.type === "success"
              ? "bg-success-dim text-success border border-success-border"
              : "bg-danger-dim text-danger border border-danger-border"
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          Loading users…
        </div>
      ) : !users.length ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-8 text-center text-text-muted text-sm">
          {searchDebounced ? "No users match your search." : "No users found."}
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  User
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Roles
                </th>
                <th className="text-left text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-text-muted uppercase px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-b-0 hover:bg-card"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email ?? "—"}</div>
                    <div className="text-[11px] text-text-muted font-mono mt-0.5">
                      {u.id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="default" className="text-[10px]">
                          {r}
                        </Badge>
                      ))}
                      {!u.roles.length && (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isBanned(u) ? (
                      <Badge variant="danger">Suspended</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap gap-2 justify-end items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActingOn(u)}
                        onClick={() => deleteUser(u.id)}
                        className="text-danger hover:text-danger hover:bg-danger-dim text-[11px]"
                        title="Permanently delete user"
                      >
                        {acting === `del-${u.id}` ? "…" : "Delete"}
                      </Button>
                      {isBanned(u) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isActingOn(u)}
                          onClick={() => setStatus(u.id, "active")}
                        >
                          {acting === `status-${u.id}` ? "…" : "Activate"}
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isActingOn(u)}
                          onClick={() => setStatus(u.id, "suspended")}
                        >
                          {acting === `status-${u.id}` ? "…" : "Suspend"}
                        </Button>
                      )}
                      {["customer", "vendor", "admin"].map((role) => (
                        <Button
                          key={role}
                          variant="ghost"
                          size="sm"
                          disabled={isActingOn(u)}
                          onClick={() =>
                            toggleRole(u.id, role, u.roles.includes(role) ? "remove" : "add")
                          }
                          className="text-[11px]"
                        >
                          {acting === `${u.id}-${role}` ? "…" : u.roles.includes(role) ? `− ${role}` : `+ ${role}`}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
