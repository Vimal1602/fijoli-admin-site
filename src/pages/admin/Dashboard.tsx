import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileImage, AlertTriangle, TrendingUp, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  reportedPosts: number;
  recentSignups: number;
  openSupport: number;
}

function lastNDayLabels(n: number) {
  const labels: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
  }
  return labels;
}

function bucketByDay(dates: string[], days: number): number[] {
  const counts = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const iso of dates) {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff] += 1;
  }
  return counts;
}

function MiniBarChart({
  title,
  description,
  values,
  labels,
}: {
  title: string;
  description: string;
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values, 1);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-primary">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-28">
          {values.map((v, i) => (
            <div key={labels[i]} className="flex flex-1 flex-col items-center gap-1 min-w-0">
              <span className="text-[10px] font-medium tabular-nums">{v}</span>
              <div
                className="w-full max-w-8 rounded-t bg-primary"
                style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
              />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{labels[i]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    reportedPosts: 0,
    recentSignups: 0,
    openSupport: 0,
  });
  const [signupSeries, setSignupSeries] = useState<number[]>(new Array(7).fill(0));
  const [postSeries, setPostSeries] = useState<number[]>(new Array(7).fill(0));
  const [loading, setLoading] = useState(true);
  const dayLabels = useMemo(() => lastNDayLabels(7), []);

  useEffect(() => {
    void (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const sinceIso = since.toISOString();

        const [
          usersRes,
          postsRes,
          reportsRes,
          signupsRes,
          supportRes,
          signupRows,
          postRows,
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", sinceIso),
          supabase.from("supports").select("*", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("users").select("created_at").gte("created_at", sinceIso),
          supabase.from("posts").select("created_at").gte("created_at", sinceIso),
        ]);

        setStats({
          totalUsers: usersRes.count ?? 0,
          totalPosts: postsRes.count ?? 0,
          reportedPosts: reportsRes.count ?? 0,
          recentSignups: signupsRes.count ?? 0,
          openSupport: supportRes.count ?? 0,
        });

        setSignupSeries(
          bucketByDay((signupRows.data ?? []).map((r) => r.created_at).filter(Boolean) as string[], 7),
        );
        setPostSeries(
          bucketByDay((postRows.data ?? []).map((r) => r.created_at).filter(Boolean) as string[], 7),
        );
      } catch (e) {
        console.error("Dashboard stats error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    { title: "Total users", value: stats.totalUsers, desc: "On Fijoli", icon: Users },
    { title: "Total posts", value: stats.totalPosts, desc: "Published", icon: FileImage },
    { title: "Pending reports", value: stats.reportedPosts, desc: "Moderation", icon: AlertTriangle, alert: stats.reportedPosts > 0 },
    { title: "Open support", value: stats.openSupport, desc: "Tickets", icon: LifeBuoy, alert: stats.openSupport > 0 },
    { title: "New signups", value: stats.recentSignups, desc: "Last 7 days", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="page-padding">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}><CardContent className="h-20 animate-pulse bg-muted/50 m-4 rounded" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-padding space-y-6 pb-10">
      <div>
        <h1 className="heading-responsive-xl font-bold text-primary">Fijoli Admin</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">Platform overview at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.title} className={s.alert ? "border-primary/40 ring-1 ring-primary/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary tabular-nums">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MiniBarChart title="New signups" description="Last 7 days" values={signupSeries} labels={dayLabels} />
        <MiniBarChart title="New posts" description="Last 7 days" values={postSeries} labels={dayLabels} />
      </div>

      <Card className="border-dashed bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-base text-primary">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm"><Link to="/admin/reports">Reports</Link></Button>
          <Button asChild variant="outline" size="sm" className="border-primary text-primary"><Link to="/admin/supports">Support</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/admin/users">Users</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/admin/posts">Posts</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
