"use client";

import { useEffect, useState } from "react";
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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (searchDebounced) params.set("q", searchDebounced);
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setUsers(data.users ?? []);
      })
      .catch((err) => {
        if (!cancelled) setUsers([]);
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load users" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchDebounced]);

  const setStatus = async (userId: string, status: "active" | "suspended") => {
    setActing(userId);
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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, banned_until: status === "suspended" ? "banned" : null }
            : u
        )
      );
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
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const roles = new Set(u.roles);
          if (action === "add") roles.add(role);
          else roles.delete(role);
          return { ...u, roles: Array.from(roles) };
        })
      );
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setActing(null);
    }
  };

  const isBanned = (u: UserRow) => !!u.banned_until;

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
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

      {loading ? (
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
                    <div className="flex flex-wrap gap-2 justify-end">
                      {isBanned(u) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!acting}
                          onClick={() => setStatus(u.id, "active")}
                        >
                          {acting === u.id ? "…" : "Activate"}
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!!acting}
                          onClick={() => setStatus(u.id, "suspended")}
                        >
                          {acting === u.id ? "…" : "Suspend"}
                        </Button>
                      )}
                      {["customer", "vendor", "admin"].map((role) => (
                        <Button
                          key={role}
                          variant="ghost"
                          size="sm"
                          disabled={!!acting}
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
