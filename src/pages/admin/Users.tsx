import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserX, Ban, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone_e164: string;
  phone_verified: boolean;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

type StatusFilter = "all" | "active" | "deactivated";

function sanitizeSearch(term: string) {
  return term.replace(/[%_,]/g, " ").trim();
}

function isPubliclyActive(status: string | null | undefined) {
  return !status || status === "active";
}

function isDeactivated(status: string | null | undefined) {
  return status === "inactive" || status === "suspended";
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const usersPerPage = 10;
  const [maxPageButtons, setMaxPageButtons] = useState(3);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMaxPageButtons(mq.matches ? 5 : 3);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsFetching(true);

      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (statusFilter === "active") {
        query = query.or("status.eq.active,status.is.null");
      } else if (statusFilter === "deactivated") {
        query = query.in("status", ["inactive", "suspended"]);
      }

      const safe = sanitizeSearch(debouncedSearch);
      if (safe) {
        query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone_e164.ilike.%${safe}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setUsers((data || []) as User[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  /** Same status as self-deactivate in the Fijoli app. */
  const deactivateUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select("id");

      if (error) throw error;
      if (!data?.length) {
        throw new Error("No user was updated. Check UPDATE RLS on public.users.");
      }

      toast({
        title: "Account deactivated",
        description: "Same as self-deactivate (status=inactive). Public search/feeds must hide inactive users.",
      });
      void fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate user",
        variant: "destructive",
      });
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select("id");

      if (error) throw error;
      if (!data?.length) {
        throw new Error("No user was updated. Check UPDATE RLS on public.users.");
      }

      toast({
        title: "Account activated",
        description: "User is active again and can appear in search/feeds.",
      });
      void fetchUsers();
    } catch (error) {
      console.error("Error activating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (userId: string) => {
    setUserIdToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userIdToDelete) return;

    setDeleting(true);
    try {
      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userIdToDelete)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!userRow) throw new Error("User not found (already deleted?).");

      const { count: postsCount, error: countError } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userIdToDelete);

      if (countError) throw countError;
      const postsDeletedCount = postsCount ?? 0;

      const { error: logError } = await supabase.from("user_deletion_logs").insert({
        deleted_user_id: userIdToDelete,
        snapshot: userRow,
        posts_deleted_count: postsDeletedCount,
        reason: "admin_hard_delete",
        deleted_by: "admin_panel",
      });

      if (logError) {
        throw new Error(
          /user_deletion_logs|schema cache|does not exist|42P01/i.test(logError.message)
            ? "Run the user_deletion_logs SQL migration in Supabase, then try again."
            : `Could not write deletion log: ${logError.message}`,
        );
      }

      const { data: deletedPosts, error: postsError } = await supabase
        .from("posts")
        .delete()
        .eq("user_id", userIdToDelete)
        .select("id");

      if (postsError) throw postsError;

      const { data: deletedRows, error } = await supabase
        .from("users")
        .delete()
        .eq("id", userIdToDelete)
        .select("id");

      if (error) throw error;
      if (!deletedRows?.length) {
        throw new Error(
          "No user was deleted. Check that your Supabase role can DELETE from public.users (RLS).",
        );
      }

      toast({
        title: "Hard-deleted",
        description: `User removed. ${deletedPosts?.length ?? postsDeletedCount} post(s) removed. See Deleted logs.`,
      });
      void fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserIdToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, phoneVerified: boolean) => {
    if (isDeactivated(status)) {
      return (
        <Badge variant="destructive">{status === "suspended" ? "Suspended" : "Deactivated"}</Badge>
      );
    }
    if (!phoneVerified) {
      return <Badge variant="secondary">Unverified</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / usersPerPage));

  if (initialLoading && users.length === 0) {
    return (
      <div className="page-padding">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-2/3 max-w-xs" />
          <div className="h-48 sm:h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-padding space-y-4 sm:space-y-6 pb-8">
      <div className="min-w-0">
        <h1 className="heading-responsive-xl font-bold text-foreground">Users Management</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">
          Manage all users on your platform ({totalCount} total)
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <CardTitle className="text-lg md:text-xl">User search</CardTitle>
            <CardDescription className="text-sm mt-1">
              Search updates automatically — no need to reload the page.
            </CardDescription>
          </div>
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Name, email, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 touch-target text-base sm:text-sm"
              autoComplete="off"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <div
            className="-mx-1 flex gap-2 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter by user status"
          >
            {(
              [
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "deactivated", label: "Deactivated" },
              ] as const
            ).map((chip) => (
              <Button
                key={chip.value}
                type="button"
                variant={statusFilter === chip.value ? "default" : "outline"}
                size="sm"
                className="shrink-0 touch-target h-10 px-3"
                onClick={() => setStatusFilter(chip.value)}
                aria-pressed={statusFilter === chip.value}
              >
                {chip.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Deactivate sets <code className="text-[11px]">status=inactive</code> (same as self-deactivate).
            Hard delete removes the account + posts and writes a Deleted log.
          </p>
        </CardHeader>
        <CardContent className="relative px-3 pb-4 sm:px-6 sm:pb-6">
          {isFetching && users.length > 0 && (
            <div className="absolute inset-0 z-10 bg-background/40 pointer-events-none rounded-b-lg" aria-hidden />
          )}

          <div className="block md:hidden space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No users match your search.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-base break-words">{user.name || "No name"}</p>
                      <p className="text-[11px] text-muted-foreground font-mono break-all mt-1">{user.id}</p>
                    </div>
                    {getStatusBadge(user.status, user.phone_verified)}
                  </div>
                  <dl className="grid gap-2 text-sm border-t pt-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="text-xs break-all">{user.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="text-xs font-mono">{user.phone_e164}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Joined</dt>
                      <dd className="text-xs">{formatDate(user.created_at)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-2 pt-1">
                    {isPubliclyActive(user.status) ? (
                      <Button
                        variant="outline"
                        className="h-11 touch-target w-full"
                        onClick={() => deactivateUser(user.id)}
                      >
                        <Ban className="h-4 w-4 mr-1 shrink-0" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-11 touch-target w-full"
                        onClick={() => activateUser(user.id)}
                      >
                        <UserX className="h-4 w-4 mr-1 shrink-0" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="h-11 touch-target w-full"
                      onClick={() => openDeleteDialog(user.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1 shrink-0" />
                      Hard delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="align-top max-w-[200px]">
                        <p className="font-medium break-words">{user.name || "No name"}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{user.id}</p>
                      </TableCell>
                      <TableCell className="align-top text-sm break-all max-w-[180px]">
                        {user.email || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="align-top">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.phone_e164}</code>
                      </TableCell>
                      <TableCell className="align-top">{getStatusBadge(user.status, user.phone_verified)}</TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex gap-1">
                          {isPubliclyActive(user.status) ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              title="Deactivate"
                              onClick={() => deactivateUser(user.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              title="Activate"
                              onClick={() => activateUser(user.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9"
                            title="Hard delete"
                            onClick={() => openDeleteDialog(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground tabular-nums md:hidden">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer touch-target min-h-10 min-w-10"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(maxPageButtons, totalPages) }, (_, i) => {
                    const maxPages = maxPageButtons;
                    let pageNum: number;
                    if (totalPages <= maxPages) {
                      pageNum = i + 1;
                    } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
                      pageNum = totalPages - maxPages + 1 + i;
                    } else {
                      pageNum = currentPage - Math.floor(maxPages / 2) + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer touch-target min-h-10 min-w-10"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={
                        currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer touch-target min-h-10 min-w-10"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setUserIdToDelete(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-1.25rem)] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Hard-delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently removes the profile and all of their posts, then writes a snapshot to Deleted
              logs. Prefer Deactivate if you only want to hide them. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto touch-target" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteUser();
              }}
              disabled={deleting}
              className="w-full sm:w-auto touch-target bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Hard delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
