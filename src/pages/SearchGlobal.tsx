import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Briefcase, Users, Building2, FileText, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function SearchGlobal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({
    people: [],
    jobs: [],
    companies: [],
    posts: [],
    articles: [],
    hashtags: [],
  });
  const navigate = useNavigate();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const [people, jobs, companies, posts, articles, hashtags] = await Promise.all([
      supabase.from("profiles").select("*").ilike("full_name", `%${searchQuery}%`).limit(10),
      supabase.from("jobs").select("*").ilike("title", `%${searchQuery}%`).limit(10),
      supabase.from("companies").select("*").ilike("name", `%${searchQuery}%`).limit(10),
      supabase.from("posts").select("*").ilike("content", `%${searchQuery}%`).limit(10),
      supabase.from("articles").select("*").ilike("title", `%${searchQuery}%`).limit(10),
      supabase.from("hashtags").select("*").ilike("name", `%${searchQuery}%`).limit(10),
    ]);

    setResults({
      people: people.data || [],
      jobs: jobs.data || [],
      companies: companies.data || [],
      posts: posts.data || [],
      articles: articles.data || [],
      hashtags: hashtags.data || [],
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search for people, jobs, companies, posts..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="people">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="h-4 w-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {Object.entries(results).map(([category, items]: [string, any[]]) => (
            items.length > 0 && (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-3 capitalize">{category}</h2>
                <div className="grid gap-3">
                  {items.slice(0, 3).map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="font-medium">{item.full_name || item.title || item.name || item.content?.substring(0, 100)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))}
        </TabsContent>

        <TabsContent value="people" className="mt-6">
          <div className="grid gap-3">
            {results.people.map((person: any) => (
              <Card key={person.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/profile/${person.id}`)}>
                <CardContent className="p-4">
                  <p className="font-medium">{person.full_name}</p>
                  <p className="text-sm text-muted-foreground">{person.headline || person.email}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <div className="grid gap-3">
            {results.jobs.map((job: any) => (
              <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <div className="grid gap-3">
            {results.companies.map((company: any) => (
              <Card key={company.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/company/${company.id}`)}>
                <CardContent className="p-4">
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-muted-foreground">{company.industry}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="articles" className="mt-6">
          <div className="grid gap-3">
            {results.articles.map((article: any) => (
              <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/articles/${article.id}`)}>
                <CardContent className="p-4">
                  <p className="font-medium">{article.title}</p>
                  <p className="text-sm text-muted-foreground">{article.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}