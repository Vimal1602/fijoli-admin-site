import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  admin_comment: string | null;
  admin_comment_at: string | null;
  created_at: string;
  reviewer: { id: string; name: string | null; username: string | null } | null;
  reviewee: { id: string; name: string | null; username: string | null } | null;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_reviews")
        .select(
          `
          id,
          rating,
          comment,
          admin_comment,
          admin_comment_at,
          created_at,
          reviewer:reviewer_id ( id, name, username ),
          reviewee:reviewee_id ( id, name, username )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setReviews((data || []) as ReviewRow[]);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const openReview = (row: ReviewRow) => {
    setSelected(row);
    setDraft(row.admin_comment || "");
  };

  const saveReply = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const trimmed = draft.trim();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("user_reviews")
        .update({
          admin_comment: trimmed || null,
          admin_comment_at: trimmed ? now : null,
          updated_at: now,
        })
        .eq("id", selected.id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Reviewers and profile owners will see this on the review in the app.",
      });

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selected.id
            ? { ...r, admin_comment: trimmed || null, admin_comment_at: trimmed ? now : null }
            : r,
        ),
      );
      setSelected((prev) =>
        prev
          ? { ...prev, admin_comment: trimmed || null, admin_comment_at: trimmed ? now : null }
          : prev,
      );
    } catch (error) {
      console.error("Error saving review reply:", error);
      toast({
        title: "Error",
        description: "Could not save admin comment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="page-padding">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-padding space-y-6">
      <div>
        <h1 className="heading-responsive-xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Profile reviews
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a team note on any review (visible in the Fijoli app).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
          <CardDescription>{reviews.length} loaded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No reviews yet.</p>
          ) : (
            reviews.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openReview(row)}
                className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {row.reviewer?.username || row.reviewer?.name || "Reviewer"} →{" "}
                    {row.reviewee?.username || row.reviewee?.name || "Profile"}
                  </span>
                  <span className="text-muted-foreground shrink-0">⭐ {row.rating}</span>
                </div>
                {row.comment && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{row.comment}</p>
                )}
                {row.admin_comment && (
                  <p className="text-xs text-primary mt-2">Team reply sent</p>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Review moderation</DialogTitle>
            <DialogDescription>Reply visible to reviewer and profile owner in the app.</DialogDescription>
          </DialogHeader>
          {selected && (
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-4 text-sm">
                <p>
                  <span className="text-muted-foreground">From:</span>{" "}
                  {selected.reviewer?.username || selected.reviewer?.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Profile:</span>{" "}
                  {selected.reviewee?.username || selected.reviewee?.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Rating:</span> {selected.rating} / 5
                </p>
                {selected.comment && (
                  <p className="bg-muted p-3 rounded-md whitespace-pre-wrap">{selected.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</p>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  placeholder="Fijoli team message on this review…"
                />
                {selected.admin_comment_at && (
                  <p className="text-xs text-muted-foreground">
                    Last sent: {formatDate(selected.admin_comment_at)}
                  </p>
                )}
                <Button disabled={saving} onClick={() => void saveReply()}>
                  {saving ? "Saving…" : "Send to users"}
                </Button>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
