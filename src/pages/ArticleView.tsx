import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

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

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchArticle();
      incrementViewCount();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles!articles_author_id_fkey (
            full_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setArticle(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/articles");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_article_views", { article_id: id });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading article...</div>;
  }

  if (!article) {
    return <div className="container mx-auto p-6">Article not found</div>;
  }

  const isAuthor = user?.id === article.author_id;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/articles")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Button>
        {isAuthor && (
          <Button variant="outline" onClick={() => navigate(`/article/${article.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {article.cover_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">{article.title}</h1>
        {article.subtitle && (
          <p className="text-xl text-muted-foreground mb-6">{article.subtitle}</p>
        )}

        <div className="flex items-center gap-4 mb-8 not-prose">
          <Avatar>
            <AvatarFallback>
              {article.profiles.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{article.profiles.full_name}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(article.created_at), "MMMM d, yyyy")}</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.view_count} views</span>
              </div>
            </div>
          </div>
        </div>

        <div className="whitespace-pre-wrap">{article.content}</div>
      </article>
    </div>
  );
}
