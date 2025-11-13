import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, ThumbsUp, MessageCircle, Users, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

interface AnalyticsData {
  totalProfileViews: number;
  totalPostImpressions: number;
  totalPostEngagements: number;
  totalConnections: number;
  recentViews: Array<{ date: string; count: number }>;
}

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProfileViews: 0,
    totalPostImpressions: 0,
    totalPostEngagements: 0,
    totalConnections: 0,
    recentViews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch profile views
      const { count: profileViewsCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", user?.id || "");

      // Fetch post reactions
      const { data: posts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user?.id || "");

      const postIds = posts?.map((p) => p.id) || [];

      const { count: reactionsCount } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);

      const { count: commentsCount } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);

      // Fetch connections
      const { count: connectionsCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .eq("status", "accepted");

      // Fetch recent views (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), i));
        return format(date, "yyyy-MM-dd");
      }).reverse();

      const { data: recentViewsData } = await supabase
        .from("profile_views")
        .select("viewed_at")
        .eq("profile_id", user?.id || "")
        .gte("viewed_at", format(subDays(new Date(), 7), "yyyy-MM-dd"));

      const viewsByDate = last7Days.map((date) => ({
        date,
        count: recentViewsData?.filter(
          (v) => format(new Date(v.viewed_at), "yyyy-MM-dd") === date
        ).length || 0,
      }));

      setAnalytics({
        totalProfileViews: profileViewsCount || 0,
        totalPostImpressions: (reactionsCount || 0) + (commentsCount || 0),
        totalPostEngagements: (reactionsCount || 0) + (commentsCount || 0),
        totalConnections: connectionsCount || 0,
        recentViews: viewsByDate,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProfileViews}</div>
            <p className="text-xs text-muted-foreground">Total profile views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Post Engagement</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPostEngagements}</div>
            <p className="text-xs text-muted-foreground">Reactions & comments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConnections}</div>
            <p className="text-xs text-muted-foreground">Total connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPostImpressions}</div>
            <p className="text-xs text-muted-foreground">Total post impressions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Views - Last 7 Days</CardTitle>
          <CardDescription>Your profile visibility trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentViews.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(day.date), "MMM d")}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{
                      width: `${Math.max((day.count / Math.max(...analytics.recentViews.map(v => v.count))) * 200, 20)}px`,
                    }}
                  />
                  <span className="text-sm font-medium w-8">{day.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
