import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface Hashtag {
  id: string;
  name: string;
  use_count: number;
}

export const TrendingHashtags = ({ onHashtagClick }: { onHashtagClick?: (tag: string) => void }) => {
  const [trending, setTrending] = useState<Hashtag[]>([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    const { data } = await supabase
      .from("hashtags")
      .select("*")
      .order("use_count", { ascending: false })
      .limit(10);

    if (data) setTrending(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {trending.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => onHashtagClick?.(tag.name)}
            >
              #{tag.name}
              <span className="ml-1 text-muted-foreground">({tag.use_count})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
