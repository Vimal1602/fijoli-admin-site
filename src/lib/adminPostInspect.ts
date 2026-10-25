import { supabase } from "@/integrations/supabase/client";

export interface AdminUserSnippet {
  id: string;
  name: string | null;
  email: string | null;
  phone_e164: string | null;
}

export interface AdminPostRow {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string | null;
  likes_count: number | null;
  comments_count: number | null;
  category: string | null;
  created_at: string | null;
  price: number | null;
  currency: string | null;
}

export interface AdminPostLike {
  id: string;
  created_at: string | null;
  user_id: string;
  user: AdminUserSnippet | null;
}

export interface AdminPostComment {
  id: string;
  content: string;
  created_at: string | null;
  user_id: string;
  parent_comment_id: string | null;
  user: AdminUserSnippet | null;
}

export interface PostInspectData {
  post: AdminPostRow | null;
  author: AdminUserSnippet | null;
  likes: AdminPostLike[];
  comments: AdminPostComment[];
  pendingReportCount: number;
}

export async function fetchPostInspectData(postId: string): Promise<PostInspectData> {
  const [postRes, likesRes, commentsRes, reportsRes] = await Promise.all([
    supabase.from("posts").select("*").eq("id", postId).maybeSingle(),
    supabase
      .from("post_likes")
      .select(
        `
        id,
        created_at,
        user_id,
        user:user_id (id, name, email, phone_e164)
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("post_comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        parent_comment_id,
        user:user_id (id, name, email, phone_e164)
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("post_reports")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("status", "pending"),
  ]);

  if (postRes.error) throw postRes.error;
  if (likesRes.error) throw likesRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const post = postRes.data as AdminPostRow | null;
  let author: AdminUserSnippet | null = null;

  if (post?.user_id) {
    const { data: authorData, error: authorError } = await supabase
      .from("users")
      .select("id, name, email, phone_e164")
      .eq("id", post.user_id)
      .maybeSingle();
    if (!authorError) author = authorData;
  }

  const likes: AdminPostLike[] = (likesRes.data ?? []).map((row) => {
    const r = row as {
      id: string;
      created_at: string | null;
      user_id: string;
      user: AdminUserSnippet | AdminUserSnippet[] | null;
    };
    const user = Array.isArray(r.user) ? r.user[0] : r.user;
    return { id: r.id, created_at: r.created_at, user_id: r.user_id, user };
  });

  const comments: AdminPostComment[] = (commentsRes.data ?? []).map((row) => {
    const r = row as {
      id: string;
      content: string;
      created_at: string | null;
      user_id: string;
      parent_comment_id: string | null;
      user: AdminUserSnippet | AdminUserSnippet[] | null;
    };
    const user = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      user_id: r.user_id,
      parent_comment_id: r.parent_comment_id,
      user,
    };
  });

  return {
    post,
    author,
    likes,
    comments,
    pendingReportCount: reportsRes.count ?? 0,
  };
}

export function formatAdminDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
