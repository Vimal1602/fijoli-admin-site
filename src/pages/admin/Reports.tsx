import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { XCircle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { PostInspectDialog } from "@/components/admin/PostInspectDialog";
import { AdminUserCard } from "@/components/admin/AdminUserCard";
import { formatAdminDate } from "@/lib/adminPostInspect";

interface ReportedPost {
  id: string;
  post_id: string;
  reported_by: string;
  reason: string | null;
  comment: string | null;
  admin_comment: string | null;
  admin_comment_at: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  post: {
    content: string;
    image_url: string | null;
    video_url: string | null;
    user_id: string;
    likes_count: number;
    comments_count: number;
  } | null;
  reporter: {
    id: string;
    name: string | null;
    email: string | null;
    phone_e164: string;
  } | null;
}

export default function Reports() {
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ postId: string; reportId: string } | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ReportedPost | null>(null);
  const [adminReplyDraft, setAdminReplyDraft] = useState("");
  const [savingAdminReply, setSavingAdminReply] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_reports")
        .select(`
          id,
          post_id,
          reported_by,
          reason,
          comment,
          admin_comment,
          admin_comment_at,
          status,
          created_at,
          posts:post_id (
            content,
            image_url,
            video_url,
            user_id,
            likes_count,
            comments_count
          ),
          reporter:reported_by (
            id,
            name,
            email,
            phone_e164
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedReports = (data?.map(report => ({
        ...report,
        post: report.posts,
        reporter: report.reporter,
        status: report.status as "pending" | "resolved" | "dismissed"
      })) || []) as ReportedPost[];

      setReports(transformedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      const { error } = await supabase
        .from("post_reports")
        .update({ status })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${status} successfully`,
      });

      fetchReports();
    } catch (error) {
      console.error("Error updating report status:", error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (postId: string, reportId: string) => {
    setPostToDelete({ postId, reportId });
    setDeleteDialogOpen(true);
  };

  const deleteReportedPost = async () => {
    if (!postToDelete) return;

    try {
      const { error: postError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postToDelete.postId);

      if (postError) throw postError;

      await updateReportStatus(postToDelete.reportId, "resolved");

      toast({
        title: "Success",
        description: "Reported post deleted successfully",
      });

      fetchReports();
    } catch (error) {
      console.error("Error deleting reported post:", error);
      toast({
        title: "Error",
        description: "Failed to delete reported post",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const saveAdminReply = async () => {
    if (!selectedPost) return;
    setSavingAdminReply(true);
    try {
      const trimmed = adminReplyDraft.trim();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("post_reports")
        .update({
          admin_comment: trimmed || null,
          admin_comment_at: trimmed ? now : null,
        })
        .eq("id", selectedPost.id);

      if (error) throw error;

      toast({
        title: "Reply saved",
        description: "The reporter will see this in the Fijoli app under Support → post reports.",
      });

      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              admin_comment: trimmed || null,
              admin_comment_at: trimmed ? now : null,
            }
          : prev,
      );
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedPost.id
            ? { ...r, admin_comment: trimmed || null, admin_comment_at: trimmed ? now : null }
            : r,
        ),
      );
    } catch (error) {
      console.error("Error saving report admin reply:", error);
      toast({
        title: "Error",
        description: "Could not save reply",
        variant: "destructive",
      });
    } finally {
      setSavingAdminReply(false);
    }
  };

  const openPostDetails = (report: ReportedPost) => {
    setSelectedPost(report);
    setAdminReplyDraft(report.admin_comment || "");
    setDetailsDialogOpen(true);
  };

  const formatDate = formatAdminDate;

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "resolved":
        return <Badge variant="default">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingReports = reports.filter(report => report.status === "pending");
  const resolvedReports = reports.filter(report => report.status !== "pending");

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-padding space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-responsive-xl font-bold text-foreground">Reported Posts</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Review and manage reported content ({pendingReports.length} pending)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Badge variant="destructive">{pendingReports.length}</Badge>
            Pending Reports
          </CardTitle>
          <CardDescription className="text-sm">
            Tap a row to open full post details, comments, likes, and reply to the reporter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending reports! 🎉</p>
            </div>
          ) : (
            <>
              <div className="block md:hidden space-y-4">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openPostDetails(report)}
                  >
                    {report.post && (
                      <div className="flex items-start gap-3">
                        {report.post.image_url ? (
                          <img
                            src={report.post.image_url}
                            alt="Post image"
                            className="w-20 h-20 object-cover rounded-md shrink-0"
                          />
                        ) : report.post.video_url ? (
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center shrink-0">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center shrink-0">
                            <span className="text-xs text-muted-foreground">No media</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-3">{report.post.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">❤️ {report.post.likes_count} 💬 {report.post.comments_count}</p>
                        </div>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">Reason:</span>
                      <p className="text-xs">{report.reason || "No reason provided"}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post Content</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Reporter Details</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => openPostDetails(report)}
                      >
                        <TableCell className="max-w-xs">
                          {report.post ? (
                            <div className="space-y-2">
                              <p className="text-sm">{truncateText(report.post.content)}</p>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>❤️ {report.post.likes_count}</span>
                                <span>💬 {report.post.comments_count}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Post deleted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.post?.image_url ? (
                            <img src={report.post.image_url} alt="" className="w-12 h-12 object-cover rounded-md" />
                          ) : report.post?.video_url ? (
                            <Video className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.reporter ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{report.reporter.name || "Unknown"}</p>
                              {report.reporter.email && (
                                <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
                              )}
                            </div>
                          ) : (
                            <code className="text-xs">{report.reported_by.substring(0, 8)}…</code>
                          )}
                        </TableCell>
                        <TableCell>{report.reason || "—"}</TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateReportStatus(report.id, "dismissed");
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                            {report.post && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(report.post_id, report.id);
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Recent Actions</CardTitle>
          <CardDescription className="text-sm">Recently resolved or dismissed reports</CardDescription>
        </CardHeader>
        <CardContent>
          {resolvedReports.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No recent actions</p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedReports.slice(0, 10).map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => openPostDetails(report)}
                    >
                      <TableCell>
                        {report.post ? truncateText(report.post.content) : "Post deleted"}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{formatDate(report.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reported Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reported post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteReportedPost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PostInspectDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        postId={selectedPost?.post_id ?? null}
        title="Reported post"
        description="Review the post, engagement, and send a reply visible in the Fijoli app"
        headerExtra={selectedPost ? getStatusBadge(selectedPost.status) : null}
        sidePanel={
          selectedPost ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Report</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <p className="mt-0.5 capitalize">{selectedPost.reason?.replace(/_/g, " ") || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reported</span>
                    <p className="mt-0.5">{formatDate(selectedPost.created_at)}</p>
                  </div>
                </div>
                {selectedPost.comment && (
                  <div>
                    <span className="text-xs text-muted-foreground">Reporter message</span>
                    <p className="mt-1 rounded-md border bg-background p-2 text-xs whitespace-pre-wrap">
                      {selectedPost.comment}
                    </p>
                  </div>
                )}
                <p className="font-mono text-[10px] text-muted-foreground break-all">Report ID: {selectedPost.id}</p>
              </div>
              <AdminUserCard
                label="Reporter"
                user={selectedPost.reporter}
                fallbackId={selectedPost.reported_by}
              />
              <div className="rounded-lg border bg-card p-3 space-y-2">
                <p className="text-sm font-semibold">Reply to reporter</p>
                <Textarea
                  value={adminReplyDraft}
                  onChange={(e) => setAdminReplyDraft(e.target.value)}
                  rows={4}
                  className="min-h-[100px] resize-y"
                  placeholder="Explain your decision or next steps…"
                />
                {selectedPost.admin_comment_at && (
                  <p className="text-xs text-muted-foreground">
                    Last saved: {formatDate(selectedPost.admin_comment_at)}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={savingAdminReply}
                  onClick={() => void saveAdminReply()}
                >
                  {savingAdminReply ? "Saving…" : "Save reply for user"}
                </Button>
              </div>
            </div>
          ) : null
        }
        footer={
          selectedPost?.status === "pending" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  updateReportStatus(selectedPost.id, "dismissed");
                  setDetailsDialogOpen(false);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss report
              </Button>
              {selectedPost.post && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    openDeleteDialog(selectedPost.post_id, selectedPost.id);
                  }}
                >
                  Delete post
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
