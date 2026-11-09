import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMaxPageButtons } from "@/hooks/use-max-page-buttons";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeletionSnapshot {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone_e164?: string | null;
  status?: string | null;
  phone_verified?: boolean | null;
  created_at?: string | null;
  [key: string]: unknown;
}

interface DeletionLog {
  id: string;
  deleted_user_id: string;
  snapshot: DeletionSnapshot;
  posts_deleted_count: number;
  reason: string | null;
  deleted_by: string | null;
  deleted_at: string;
}

const logsPerPage = 10;

export default function DeletedLogs() {
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<DeletionLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const maxPageButtons = useMaxPageButtons();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * logsPerPage;
      const to = from + logsPerPage - 1;

      const { data, error, count } = await supabase
        .from("user_deletion_logs")
        .select("*", { count: "exact" })
        .order("deleted_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs((data || []) as DeletionLog[]);
      setTotalCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching deletion logs:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error && /relation|does not exist|42P01/i.test(error.message)
            ? "Run the user_deletion_logs SQL migration in Supabase first."
            : "Failed to load deletion logs",
        variant: "destructive",
      });
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  if (loading) {
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
    <div className="page-padding space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="heading-responsive-xl font-bold text-foreground flex items-start gap-2">
          <ScrollText className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 text-primary mt-0.5" aria-hidden />
          <span>Deleted logs</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">
          Hard-deleted profiles ({totalCount} total). These are audit records only — accounts are gone.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg md:text-xl">Deletion history</CardTitle>
          <CardDescription className="text-sm">
            Written when an admin permanently deletes a user. There is no undo from this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
          <div className="block md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="mobile-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-content">
                      {(log.snapshot?.name as string) || "Unnamed user"}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground break-all mt-1">
                      {log.deleted_user_id}
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Deleted
                  </Badge>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-xs border-t border-border pt-3">
                  <div>
                    <dt className="text-muted-foreground font-medium">Email</dt>
                    <dd className="mt-0.5 break-content">{(log.snapshot?.email as string) || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Phone</dt>
                    <dd className="mt-0.5 font-mono break-all">
                      {(log.snapshot?.phone_e164 as string) || "—"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-muted-foreground font-medium">Posts removed</dt>
                      <dd className="mt-0.5 tabular-nums">{log.posts_deleted_count}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground font-medium">When</dt>
                      <dd className="mt-0.5 leading-tight">{formatDate(log.deleted_at)}</dd>
                    </div>
                  </div>
                </dl>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-11 touch-target"
                  onClick={() => {
                    setSelected(log);
                    setDetailsOpen(true);
                  }}
                >
                  View snapshot
                </Button>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-10 text-sm">
                No hard-deletes logged yet.
              </p>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Posts removed</TableHead>
                  <TableHead>Deleted at</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium break-words">
                      {(log.snapshot?.name as string) || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="break-words">{(log.snapshot?.email as string) || "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {(log.snapshot?.phone_e164 as string) || ""}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs break-all max-w-[180px]">
                      {log.deleted_user_id}
                    </TableCell>
                    <TableCell className="tabular-nums">{log.posts_deleted_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.deleted_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelected(log);
                          setDetailsOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No hard-deletes logged yet.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground md:hidden tabular-nums">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer touch-target min-h-10"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(maxPageButtons, totalPages) }, (_, i) => {
                    const maxPages = maxPageButtons;
                    let pageNum: number;
                    if (totalPages <= maxPages) pageNum = i + 1;
                    else if (currentPage <= Math.floor(maxPages / 2) + 1) pageNum = i + 1;
                    else if (currentPage >= totalPages - Math.floor(maxPages / 2))
                      pageNum = totalPages - maxPages + 1 + i;
                    else pageNum = currentPage - Math.floor(maxPages / 2) + i;
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
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer touch-target min-h-10"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[calc(100vw-1.25rem)] max-w-lg max-h-[min(90dvh,44rem)] p-4 sm:p-6">
          <DialogHeader className="text-left pr-8">
            <DialogTitle>Deletion snapshot</DialogTitle>
            <DialogDescription>Profile data captured before hard-delete.</DialogDescription>
          </DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[min(65dvh,28rem)] pr-3">
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(
                  {
                    deleted_user_id: selected.deleted_user_id,
                    posts_deleted_count: selected.posts_deleted_count,
                    reason: selected.reason,
                    deleted_by: selected.deleted_by,
                    deleted_at: selected.deleted_at,
                    snapshot: selected.snapshot,
                  },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
