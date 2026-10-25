import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
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
import { PostInspectDialog } from "@/components/admin/PostInspectDialog";
import { formatAdminDate } from "@/lib/adminPostInspect";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  likes_count: number;
  comments_count: number;
  category: string | null;
  created_at: string;
  is_reported?: boolean;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const postsPerPage = 10;
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;

      const { data, error, count } = await supabase
        .from("posts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const postIds = data?.map(post => post.id) || [];
      const { data: reports } = await supabase
        .from("post_reports")
        .select("post_id")
        .in("post_id", postIds)
        .eq("status", "pending");

      const reportedPostIds = new Set(reports?.map(r => r.post_id) || []);

      const postsWithReportStatus = data?.map(post => ({
        ...post,
        is_reported: reportedPostIds.has(post.id)
      })) || [];

      setPosts(postsWithReportStatus);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (postId: string) => {
    setPostIdToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postIdToDelete) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postIdToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setDetailsDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostIdToDelete(null);
    }
  };

  const openPostDetails = (postId: string) => {
    setSelectedPostId(postId);
    setDetailsDialogOpen(true);
  };

  const formatDate = formatAdminDate;

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const totalPages = Math.ceil(totalCount / postsPerPage);

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
          <h1 className="heading-responsive-xl font-bold text-foreground">Posts Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage all posts on your platform ({totalCount} total). Click a row to inspect comments and likes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Posts</CardTitle>
          <CardDescription className="text-sm">View and manage posts from your users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="block md:hidden space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openPostDetails(post.id)}
              >
                <div className="flex items-start gap-3">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="w-20 h-20 object-cover rounded-md shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-3">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ❤️ {post.likes_count} 💬 {post.comments_count}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(post.id);
                  }}
                  className="w-full touch-target"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => openPostDetails(post.id)}
                  >
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-sm">{truncateText(post.content)}</p>
                        <p className="text-xs text-muted-foreground">ID: {post.id.substring(0, 8)}…</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {post.user_id.substring(0, 8)}…
                      </code>
                    </TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge variant="secondary">{post.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>❤️ {post.likes_count}</div>
                        <div>💬 {post.comments_count}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.is_reported ? (
                        <Badge variant="destructive">Reported</Badge>
                      ) : (
                        <Badge variant={post.likes_count > 10 ? "default" : "secondary"}>
                          {post.likes_count > 10 ? "Popular" : "Normal"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPostDetails(post.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(post.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer touch-target"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(window.innerWidth < 768 ? 3 : 5, totalPages) }, (_, i) => {
                    const maxPages = window.innerWidth < 768 ? 3 : 5;
                    let pageNum;
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
                          className="cursor-pointer touch-target"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer touch-target"}
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
          if (!open) setPostIdToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PostInspectDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        postId={selectedPostId}
        title="Post details"
        description="Full post, every comment, and who liked it"
        footer={
          selectedPostId ? (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => openDeleteDialog(selectedPostId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete this post
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
