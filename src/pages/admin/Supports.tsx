import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, LifeBuoy, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AdminDetailDialog } from "@/components/admin/AdminDetailDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type SupportStatus = (typeof SUPPORT_STATUSES)[number];

type StatusFilter = "all" | SupportStatus;

interface SupportUser {
  id: string;
  name: string | null;
  email: string | null;
  phone_e164: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  number_details: string;
  issue_type: string | null;
  support_comment: string;
  status: SupportStatus;
  created_at: string;
  updated_at: string;
  admin_comment: string | null;
  admin_comment_at: string | null;
  user: SupportUser | null;
}

const SUPPORT_SELECT =
  "id, user_id, number_details, issue_type, support_comment, status, admin_comment, admin_comment_at, created_at, updated_at, user:user_id ( id, name, email, phone_e164 )";

const ticketsPerPage = 10;

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

function quickToggleTarget(status: SupportStatus): SupportStatus {
  return status === "closed" ? "open" : "closed";
}

function statusBadgeVariant(status: SupportStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "open":
      return "default";
    case "in_progress":
      return "secondary";
    case "resolved":
      return "outline";
    case "closed":
      return "secondary";
    default:
      return "secondary";
  }
}

export default function Supports() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [counts, setCounts] = useState<{ all: number; open: number; in_progress: number; resolved: number; closed: number }>({
    all: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminReplyDraft, setAdminReplyDraft] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, openRes, progRes, resRes, closedRes] = await Promise.all([
        supabase.from("supports").select("id", { count: "exact", head: true }),
        supabase.from("supports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("supports").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("supports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("supports").select("id", { count: "exact", head: true }).eq("status", "closed"),
      ]);

      setCounts({
        all: allRes.count ?? 0,
        open: openRes.count ?? 0,
        in_progress: progRes.count ?? 0,
        resolved: resRes.count ?? 0,
        closed: closedRes.count ?? 0,
      });
    } catch (e) {
      console.error("Error fetching support counts:", e);
    }
  }, []);

  const fetchTickets = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const from = (currentPage - 1) * ticketsPerPage;
      const to = from + ticketsPerPage - 1;

      let query = supabase
        .from("supports")
        .select(SUPPORT_SELECT, { count: "exact" })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setTickets((data || []) as SupportTicket[]);
      setTotalCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const [maxPageButtons, setMaxPageButtons] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMaxPageButtons(mq.matches ? 5 : 3);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (detailsOpen && selected) {
      setAdminReplyDraft(selected.admin_comment || "");
    }
  }, [detailsOpen, selected?.id, selected?.admin_comment]);

  const saveAdminReply = async () => {
    if (!selected) return;
    setSavingReply(true);
    try {
      const trimmed = adminReplyDraft.trim();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("supports")
        .update({
          admin_comment: trimmed || null,
          admin_comment_at: trimmed ? now : null,
          updated_at: now,
        })
        .eq("id", selected.id);

      if (error) throw error;

      toast({
        title: "Reply saved",
        description: "The user will see this under Support in the Fijoli app.",
      });

      setSelected((prev) =>
        prev && prev.id === selected.id
          ? { ...prev, admin_comment: trimmed || null, admin_comment_at: trimmed ? now : null, updated_at: now }
          : prev,
      );
      await fetchTickets({ silent: true });
    } catch (error) {
      console.error("Error saving admin reply:", error);
      toast({
        title: "Error",
        description: "Could not save reply to user",
        variant: "destructive",
      });
    } finally {
      setSavingReply(false);
    }
  };

  const changeStatus = async (ticketId: string, next: SupportStatus) => {
    setUpdatingId(ticketId);
    try {
      const { error } = await supabase
        .from("supports")
        .update({
          status: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({ title: "Updated", description: `Ticket marked as ${statusLabel(next)}` });

      setSelected((prev) =>
        prev && prev.id === ticketId ? { ...prev, status: next, updated_at: new Date().toISOString() } : prev,
      );

      await fetchCounts();
      await fetchTickets({ silent: true });
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Could not update ticket status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const setFilter = (next: StatusFilter) => {
    setCurrentPage(1);
    setStatusFilter(next);
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setAdminReplyDraft(ticket.admin_comment || "");
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
  };

  const totalPages = Math.ceil(totalCount / ticketsPerPage);

  const filterChips: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "open", label: "Open", count: counts.open },
    { value: "in_progress", label: "In progress", count: counts.in_progress },
    { value: "resolved", label: "Resolved", count: counts.resolved },
    { value: "closed", label: "Closed", count: counts.closed },
  ];

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
    <div className="page-padding space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div className="min-w-0">
          <h1 className="heading-responsive-xl font-bold text-foreground flex items-start sm:items-center gap-2">
            <LifeBuoy className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 text-primary mt-0.5 sm:mt-0" aria-hidden />
            <span className="leading-tight">Support tickets</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            In-app support requests ({counts.all} total)
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <CardTitle className="text-lg md:text-xl">Tickets</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              <span className="hidden sm:inline">
                Filter by status, then update a ticket from the table. List loads one page at a time.
              </span>
              <span className="sm:hidden">Swipe filters, tap a ticket to view or change status.</span>
            </CardDescription>
          </div>
          <div
            className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-0.5 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter by ticket status"
          >
            {filterChips.map((chip) => (
              <Button
                key={chip.value}
                type="button"
                variant={statusFilter === chip.value ? "default" : "outline"}
                size="sm"
                className="shrink-0 touch-target h-10 px-3 sm:h-9"
                onClick={() => setFilter(chip.value)}
                aria-pressed={statusFilter === chip.value}
              >
                {chip.label}
                <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs tabular-nums">{chip.count}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
          {/* Mobile */}
          <div className="block md:hidden space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => openTicket(ticket)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openTicket(ticket);
                  }
                }}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3 cursor-pointer hover:bg-accent/10 active:bg-accent/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-mono break-all leading-snug">
                      {ticket.id}
                    </p>
                    <p className="text-sm font-medium mt-2 leading-snug line-clamp-4 break-words">
                      {ticket.issue_type || "Support request"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ticket.support_comment}</p>
                    {ticket.admin_comment && (
                      <p className="text-xs text-primary mt-2 line-clamp-2">Team reply sent — tap to view</p>
                    )}
                  </div>
                  <Badge variant={statusBadgeVariant(ticket.status)} className="shrink-0 text-xs">
                    {statusLabel(ticket.status)}
                  </Badge>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-xs border-t border-border pt-3">
                  <div>
                    <dt className="text-muted-foreground font-medium">User</dt>
                    <dd className="mt-0.5 break-words">
                      {ticket.user?.name || "—"}
                      <span className="block font-mono text-[11px] text-muted-foreground mt-0.5 break-all">
                        {ticket.user_id}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Contact</dt>
                    <dd className="mt-0.5 break-words">{ticket.number_details}</dd>
                  </div>
                  {ticket.issue_type && (
                    <div>
                      <dt className="text-muted-foreground font-medium">Issue type</dt>
                      <dd className="mt-0.5 break-words">{ticket.issue_type}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 gap-y-1">
                    <div>
                      <dt className="text-muted-foreground font-medium">Created</dt>
                      <dd className="mt-0.5 text-muted-foreground leading-tight">{formatDate(ticket.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground font-medium">Updated</dt>
                      <dd className="mt-0.5 text-muted-foreground leading-tight">{formatDate(ticket.updated_at)}</dd>
                    </div>
                  </div>
                </dl>
                <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => changeStatus(ticket.id, v as SupportStatus)}
                    disabled={updatingId === ticket.id}
                  >
                    <SelectTrigger className="w-full h-11 min-h-11 touch-target text-base sm:text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[min(50vh,320px)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {SUPPORT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="min-h-11 py-3">
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={ticket.status === "closed" ? "outline" : "secondary"}
                      size="default"
                      className="h-11 min-h-11 touch-target text-base sm:text-sm"
                      disabled={updatingId === ticket.id}
                      onClick={() => changeStatus(ticket.id, quickToggleTarget(ticket.status))}
                    >
                      {ticket.status === "closed" ? (
                        <Unlock className="h-4 w-4 mr-2 shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2 shrink-0" />
                      )}
                      {ticket.status === "closed" ? "Reopen" : "Close"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="default"
                      className="h-11 min-h-11 touch-target text-base sm:text-sm"
                      onClick={() => openTicket(ticket)}
                    >
                      <Eye className="h-4 w-4 mr-2 shrink-0" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="text-center text-muted-foreground py-10 px-2 text-sm">No tickets in this view.</p>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[140px]">User</TableHead>
                  <TableHead className="min-w-[120px]">Contact #</TableHead>
                  <TableHead className="min-w-[100px]">Issue type</TableHead>
                  <TableHead className="min-w-[220px]">Comment</TableHead>
                  <TableHead className="min-w-[140px]">Status</TableHead>
                  <TableHead className="min-w-[130px]">Created</TableHead>
                  <TableHead className="min-w-[130px]">Updated</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openTicket(ticket)}
                  >
                    <TableCell className="font-mono text-xs align-top">{ticket.id.substring(0, 8)}…</TableCell>
                    <TableCell className="align-top text-sm">
                      <div>{ticket.user?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                        {ticket.user_id}
                      </div>
                      {ticket.user?.email && (
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{ticket.user.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-sm whitespace-pre-wrap break-words max-w-[160px]">
                      {ticket.number_details}
                    </TableCell>
                    <TableCell className="align-top text-sm">{ticket.issue_type || "—"}</TableCell>
                    <TableCell className="align-top text-sm max-w-xs">
                      <span title={ticket.support_comment}>{truncateText(ticket.support_comment, 120)}</span>
                    </TableCell>
                    <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => changeStatus(ticket.id, v as SupportStatus)}
                        disabled={updatingId === ticket.id}
                      >
                        <SelectTrigger className="w-[150px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(ticket.updated_at)}
                    </TableCell>
                    <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="touch-target"
                          title="Reply to user"
                          onClick={() => openTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="touch-target"
                          disabled={updatingId === ticket.id}
                          title={ticket.status === "closed" ? "Reopen ticket" : "Close ticket"}
                          onClick={() => changeStatus(ticket.id, quickToggleTarget(ticket.status))}
                        >
                          {ticket.status === "closed" ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {tickets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No tickets in this view.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground md:hidden tabular-nums">
                Page {currentPage} of {totalPages}
                <span className="text-muted-foreground/80">
                  {" "}
                  ({totalCount} {totalCount === 1 ? "ticket" : "tickets"})
                </span>
              </p>
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-1 max-w-full">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer touch-target min-h-10 min-w-10"
                      }
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
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer touch-target min-h-10 min-w-10"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminDetailDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selected?.issue_type || "Support ticket"}
        description="Reply here — the user sees it under Support in the Fijoli app."
        footer={
          selected ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={savingReply}
              onClick={() => void saveAdminReply()}
            >
              {savingReply ? "Saving…" : "Save reply for user"}
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={statusBadgeVariant(selected.status)}>{statusLabel(selected.status)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">User message</p>
              <p className="whitespace-pre-wrap break-words bg-muted p-3 rounded-md mt-1">{selected.support_comment}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">User</p>
                <p className="font-medium mt-1">{selected.user?.name || "—"}</p>
                {selected.user?.email && <p className="text-xs break-all">{selected.user.email}</p>}
                <p className="text-xs font-mono break-all text-muted-foreground mt-1">{selected.user_id}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Contact (WhatsApp)</p>
                <p className="mt-1 break-words">{selected.number_details}</p>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="font-medium text-sm">Your reply to the user</p>
              <Textarea
                value={adminReplyDraft}
                onChange={(e) => setAdminReplyDraft(e.target.value)}
                rows={5}
                placeholder="Write your response…"
                className="resize-y min-h-[7rem] text-base sm:text-sm"
              />
              {selected.admin_comment_at && (
                <p className="text-xs text-muted-foreground">Last saved: {formatDate(selected.admin_comment_at)}</p>
              )}
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground font-medium">Ticket status</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={selected.status}
                  onValueChange={(v) => changeStatus(selected.id, v as SupportStatus)}
                  disabled={updatingId === selected.id}
                >
                  <SelectTrigger className="w-full h-11 touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(50vh,320px)]">
                    {SUPPORT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="min-h-11">
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 touch-target shrink-0"
                  disabled={updatingId === selected.id}
                  onClick={() => changeStatus(selected.id, quickToggleTarget(selected.status))}
                >
                  {selected.status === "closed" ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Reopen
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Close
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground break-all">ID: {selected.id}</p>
          </div>
        )}
      </AdminDetailDialog>
    </div>
  );
}
