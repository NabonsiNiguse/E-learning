import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Trash2, UserCog, ShieldCheck, GraduationCap, User, ShieldOff } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useUsers } from "@/lib/use-api";
import { usersApi, type UserRole } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users — Learnly" }] }),
  component: UsersPage,
});

const ROLE_STYLES: Record<string, string> = {
  admin:       "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  super_admin: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  teacher:     "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  student:     "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin:       ShieldCheck,
  super_admin: ShieldCheck,
  teacher:     GraduationCap,
  student:     User,
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function UsersPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search,     setSearch]  = useState("");
  const [roleFilter, setRoleF]   = useState<UserRole | "all">("all");
  const [delTarget,  setDel]     = useState<any | null>(null);

  useEffect(() => {
    if (role !== "admin" && role !== "super_admin") navigate({ to: "/dashboard" });
  }, [role, navigate]);

  const { data, isLoading } = useUsers(roleFilter !== "all" ? { role: roleFilter } : undefined);
  const users = (data as any)?.results ?? (Array.isArray(data) ? data : []);

  if (role !== "admin" && role !== "super_admin") return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldOff className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </div>
    </AppLayout>
  );

  const filtered = users.filter((u: any) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await usersApi.delete(delTarget.id);
      toast.success(`${delTarget.full_name} removed.`);
      qc.invalidateQueries({ queryKey: QK.users() });
    } catch {
      toast.error("Failed to delete user.");
    }
    setDel(null);
  }

  async function handleToggleActive(target: any) {
    if (!target) return;
    try {
      const updated = await usersApi.update(target.id, { is_active: !target.is_active });
      toast.success(`${updated?.full_name ?? target.full_name} ${updated?.is_active ? 'enabled' : 'disabled'}`);
      qc.invalidateQueries({ queryKey: QK.users() });
    } catch (e) {
      toast.error('Failed to update user status.');
    }
  }

  async function handleResetAccess(target: any) {
    if (!target) return;
    try {
      // Best-effort: try a dedicated reset endpoint, fallback to enabling account
      const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
      try {
        await fetch(`${base}/api/v1/users/${target.id}/reset-access/`, { method: 'POST', credentials: 'include' });
        toast.success('Reset access requested.');
      } catch {
        await usersApi.update(target.id, { is_active: true });
        toast.success('Access reset by enabling account.');
      }
      qc.invalidateQueries({ queryKey: QK.users() });
    } catch {
      toast.error('Reset access failed.');
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} total users</p>
        </div>
      </div>

      <Card className="p-4 border-border shadow-soft mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "admin", "teacher", "student"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleF(r as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all",
                  roleFilter === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-border shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-secondary/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
                {filtered.map((u: any) => {
                  const Icon = ROLE_ICONS[u.role] ?? User;
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials(u.full_name ?? "")}
                          </div>
                          <span className="font-medium">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cn("capitalize gap-1", ROLE_STYLES[u.role] ?? "")}>
                          <Icon className="h-3 w-3" /> {u.role?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.is_active ? "text-emerald-600" : "text-red-600"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" title={u.is_active ? "Disable account" : "Enable account"} onClick={() => handleToggleActive(u)} className="h-8 w-8">
                            {u.is_active ? <ShieldOff className="h-3.5 w-3.5 text-red-600" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                          </Button>
                          <Button size="icon" variant="ghost" title="Reset access" onClick={() => handleResetAccess(u)} className="h-8 w-8">
                            <UserCog className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => setDel(u)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete confirm */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Delete User</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Remove <span className="font-semibold text-foreground">{delTarget.full_name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDel(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
