import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Heart, Loader2, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUserCard } from "@/components/admin/AdminUserCard";
import {
  fetchPostInspectData,
  formatAdminDate,
  type AdminPostComment,
  type PostInspectData,
} from "@/lib/adminPostInspect";

function CommentRow({ comment, depth }: { comment: AdminPostComment; depth: number }) {
  return (
    <div
      className="rounded-lg border bg-muted/30 p-3"
      style={{ marginLeft: depth > 0 ? Math.min(depth * 12, 36) : 0 }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{comment.user?.name || "Unknown"}</span>
        <span>·</span>
        <span>{formatAdminDate(comment.created_at)}</span>
        {comment.parent_comment_id && <Badge variant="outline" className="text-[10px]">Reply</Badge>}
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
      {(comment.user?.email || comment.user?.phone_e164) && (
        <p className="mt-2 text-[11px] text-muted-foreground break-all">
          {[comment.user?.email, comment.user?.phone_e164].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

function buildCommentTree(comments: AdminPostComment[]) {
  const roots = comments.filter((c) => !c.parent_comment_id);
  const byParent = new Map<string, AdminPostComment[]>();
  for (const c of comments) {
    if (!c.parent_comment_id) continue;
    const list = byParent.get(c.parent_comment_id) ?? [];
    list.push(c);
    byParent.set(c.parent_comment_id, list);
  }

  const render = (comment: AdminPostComment, depth: number): ReactNode[] => {
    const children = byParent.get(comment.id) ?? [];
    return [
      <CommentRow key={comment.id} comment={comment} depth={depth} />,
      ...children.flatMap((child) => render(child, depth + 1)),
    ];
  };

  if (roots.length === 0) return comments.map((c) => <CommentRow key={c.id} comment={c} depth={0} />);
  return roots.flatMap((r) => render(r, 0));
}

export function PostInspectDialog({
  open,
  onOpenChange,
  postId,
  title = "Post details",
  description = "Media, engagement, comments, and likes",
  headerExtra,
  sidePanel,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  title?: string;
  description?: string;
  headerExtra?: ReactNode;
  sidePanel?: ReactNode;
  footer?: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PostInspectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !postId) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPostInspectData(postId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not load post details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  const commentNodes = useMemo(
    () => (data?.comments ? buildCommentTree(data.comments) : []),
    [data?.comments],
  );

  const post = data?.post;
  const appPostUrl = postId ? `https://fijoli.com/post/${postId}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,880px)] w-[min(96vw,56rem)] max-w-[56rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[56rem]"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-left text-base sm:text-lg">{title}</DialogTitle>
            {headerExtra}
          </div>
          <DialogDescription className="text-left">{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          )}

          {!loading && error && (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && !post && postId && (
            <p className="py-8 text-center text-sm text-muted-foreground">This post was deleted.</p>
          )}

          {!loading && !error && post && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4 min-w-0">
                  {post.video_url ? (
                    <div className="overflow-hidden rounded-lg border bg-black">
                      <video src={post.video_url} controls className="max-h-56 w-full" />
                    </div>
                  ) : post.image_url ? (
                    <div className="overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={post.image_url}
                        alt=""
                        className="max-h-56 w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                      No media
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <MessageCircle className="h-4 w-4" />
                      Caption
                    </h3>
                    <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{post.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Likes</p>
                      <p className="text-xl font-semibold">{post.likes_count ?? 0}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Comments</p>
                      <p className="text-xl font-semibold">{post.comments_count ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {post.category && <Badge variant="secondary">{post.category}</Badge>}
                    {data.pendingReportCount > 0 && (
                      <Badge variant="destructive">{data.pendingReportCount} pending report(s)</Badge>
                    )}
                    <span>Posted {formatAdminDate(post.created_at)}</span>
                  </div>

                  {appPostUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={appPostUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open on fijoli.com
                      </a>
                    </Button>
                  )}

                  <p className="font-mono text-[11px] text-muted-foreground break-all">Post ID: {post.id}</p>
                </div>

                <div className="space-y-4 min-w-0">
                  <AdminUserCard label="Author" user={data.author} fallbackId={post.user_id ?? undefined} />
                  {sidePanel}
                </div>
              </div>

              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="comments">
                    Comments ({data.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="likes">
                    <Heart className="mr-1 h-3.5 w-3.5" />
                    Likes ({data.likes.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-3 space-y-2 max-h-[min(40vh,320px)] overflow-y-auto pr-1">
                  {commentNodes.length > 0 ? (
                    commentNodes
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No comments</p>
                  )}
                </TabsContent>
                <TabsContent value="likes" className="mt-3 space-y-2 max-h-[min(40vh,320px)] overflow-y-auto pr-1">
                  {data.likes.length > 0 ? (
                    data.likes.map((like) => (
                      <div key={like.id} className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{like.user?.name || "Unknown"}</p>
                          {(like.user?.email || like.user?.phone_e164) && (
                            <p className="text-xs text-muted-foreground break-all">
                              {[like.user?.email, like.user?.phone_e164].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <p className="font-mono text-[10px] text-muted-foreground">{like.user_id}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatAdminDate(like.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No likes yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {footer && (
          <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">{footer}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
