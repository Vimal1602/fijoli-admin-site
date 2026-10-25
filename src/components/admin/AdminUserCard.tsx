import { User } from "lucide-react";
import type { AdminUserSnippet } from "@/lib/adminPostInspect";

export function AdminUserCard({
  label,
  user,
  fallbackId,
}: {
  label: string;
  user: AdminUserSnippet | null;
  fallbackId?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {user ? (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {user.name || "Unknown"}
          </div>
          {user.email && <p className="text-xs text-muted-foreground break-all">{user.email}</p>}
          {user.phone_e164 && <p className="text-xs text-muted-foreground">{user.phone_e164}</p>}
          <p className="font-mono text-[11px] text-muted-foreground break-all">{user.id}</p>
        </div>
      ) : (
        <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{fallbackId ?? "—"}</p>
      )}
    </div>
  );
}
