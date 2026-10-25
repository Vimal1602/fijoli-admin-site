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

function sanitizeSearch(term: string) {
  return term.replace(/[%_,]/g, " ").trim();
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const usersPerPage = 10;
  const [maxPageButtons, setMaxPageButtons] = useState(3);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMaxPageButtons(mq.matches ? 5 : 3);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsFetching(true);

      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

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
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = async (userId: string, newStatus: "active" | "suspended") => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${newStatus === "suspended" ? "suspended" : "activated"} successfully`,
      });

      void fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      toast({ title: "Success", description: "User deleted successfully" });
      void fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
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
    if (status === "suspended") {
      return <Badge variant="destructive">Suspended</Badge>;
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
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {user.status === "active" ? (
                      <Button
                        variant="outline"
                        className="h-11 touch-target"
                        onClick={() => updateUserStatus(user.id, "suspended")}
                      >
                        <Ban className="h-4 w-4 mr-1 shrink-0" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-11 touch-target"
                        onClick={() => updateUserStatus(user.id, "active")}
                      >
                        <UserX className="h-4 w-4 mr-1 shrink-0" />
                        Activate
                      </Button>
                    )}
                    <Button variant="destructive" className="h-11 touch-target" onClick={() => deleteUser(user.id)}>
                      <Trash2 className="h-4 w-4 mr-1 shrink-0" />
                      Delete
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
                  <TableHead className="w-[100px]">Actions</TableHead>
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
                          {user.status === "active" ? (
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateUserStatus(user.id, "suspended")}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateUserStatus(user.id, "active")}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => deleteUser(user.id)}>
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
    </div>
  );
}
