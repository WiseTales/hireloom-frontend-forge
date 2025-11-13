import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Eye, Plus } from "lucide-react";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  view_count: number;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function Articles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my">("all");

  useEffect(() => {
    fetchArticles();
  }, [filter, user]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from("articles")
        .select(`
          *,
          profiles!articles_author_id_fkey (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (filter === "my" && user) {
        query = query.eq("author_id", user.id);
      } else {
        query = query.eq("published", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setArticles(data || []);
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

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading articles...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Articles</h1>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Articles
            </Button>
            <Button
              variant={filter === "my" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("my")}
            >
              My Articles
            </Button>
          </div>
        </div>
        <Button onClick={() => navigate("/article/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Write Article
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleArticleClick(article.id)}>
            {article.cover_image_url && (
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                {!article.published && (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              {article.subtitle && (
                <CardDescription className="line-clamp-2">
                  {article.subtitle}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {article.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
              </p>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{article.profiles.full_name}</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count}</span>
                </div>
              </div>
              <span>{format(new Date(article.created_at), "MMM d, yyyy")}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === "my"
              ? "You haven't written any articles yet. Start writing!"
              : "No articles found."}
          </p>
        </div>
      )}
    </div>
  );
}
