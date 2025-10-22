import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Calendar, Building2, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NetworkSearch = () => {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<'jobs' | 'people' | 'companies'>('jobs');
  
  // Filter states
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [datePosted, setDatePosted] = useState('');

  // Results
  const [jobs, setJobs] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, activeTab, location, salaryRange, datePosted]);

  const performSearch = async () => {
    setLoadingResults(true);

    if (activeTab === 'jobs') {
      let jobQuery = supabase
        .from('jobs')
        .select('*')
        .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`);

      if (location) {
        jobQuery = jobQuery.ilike('location', `%${location}%`);
      }

      if (datePosted) {
        const daysAgo = parseInt(datePosted);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        jobQuery = jobQuery.gte('created_at', date.toISOString());
      }

      const { data } = await jobQuery.order('created_at', { ascending: false });
      if (data) setJobs(data);
    } else if (activeTab === 'people') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);
      
      if (data) setPeople(data);
    } else if (activeTab === 'companies') {
      const { data } = await supabase
        .from('jobs')
        .select('company')
        .ilike('company', `%${query}%`)
        .limit(20);
      
      if (data) {
        const uniqueCompanies = [...new Set(data.map(j => j.company))];
        setCompanies(uniqueCompanies.map(c => ({ name: c })));
      }
    }

    setLoadingResults(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for jobs, people, or companies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Panel */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeTab === 'jobs' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="City, state, or remote"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary Range</Label>
                        <Select value={salaryRange} onValueChange={setSalaryRange}>
                          <SelectTrigger id="salary">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-50k">$0 - $50k</SelectItem>
                            <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                            <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                            <SelectItem value="150k+">$150k+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date Posted</Label>
                        <Select value={datePosted} onValueChange={setDatePosted}>
                          <SelectTrigger id="date">
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Past 24 hours</SelectItem>
                            <SelectItem value="7">Past week</SelectItem>
                            <SelectItem value="30">Past month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setLocation('');
                          setSalaryRange('');
                          setDatePosted('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </aside>

            {/* Results */}
            <div className="lg:col-span-3">
              <TabsContent value="jobs" className="mt-0">
                <div className="space-y-4">
                  {loadingResults ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : jobs.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No jobs found matching your criteria</p>
                      </CardContent>
                    </Card>
                  ) : (
                    jobs.map((job) => (
                      <Card key={job.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-xl">{job.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">{job.company}</p>
                            </div>
                            <Badge>{job.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                              {job.salary && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {job.salary}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(job.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm line-clamp-2">{job.description}</p>
                            <Button className="w-full sm:w-auto">Apply Now</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="people" className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  {people.map((person) => {
                    const initials = person.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase() || person.email?.[0]?.toUpperCase() || 'U';

                    return (
                      <Card key={person.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{person.full_name || person.email}</h3>
                              <p className="text-sm text-muted-foreground">Professional at HireLoom</p>
                            </div>
                            <Button className="w-full">Connect</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="companies" className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  {companies.map((company: any, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{company.name}</h3>
                            <p className="text-sm text-muted-foreground">Company</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          View Jobs
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default NetworkSearch;