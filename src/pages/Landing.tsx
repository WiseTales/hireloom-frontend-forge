import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Briefcase, Building2, Users, Shield, ArrowRight, Search, MapPin, Clock,
  DollarSign, TrendingUp, ChevronRight, Filter, X, Zap, BarChart3, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  description: string;
  experience_level: string | null;
  is_remote: boolean | null;
  salary: string | null;
  work_type: string | null;
  created_at: string;
}

const Landing = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [showAllJobs, setShowAllJobs] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('visibility', 'external')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.category.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower);
    const matchesLocation = !locationFilter || locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || job.category === departmentFilter;
    const matchesWorkType = !workTypeFilter || workTypeFilter === 'all' || job.work_type === workTypeFilter;
    return matchesSearch && matchesLocation && matchesDepartment && matchesWorkType;
  });

  const trendingJobs = jobs.slice(0, 8);
  const isSearching = searchTerm || locationFilter || departmentFilter || workTypeFilter;
  const displayedJobs = isSearching || showAllJobs ? filteredJobs : [];
  const uniqueLocations = [...new Set(jobs.map(job => job.location))];
  const uniqueDepartments = [...new Set(jobs.map(job => job.category))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setDepartmentFilter('');
    setWorkTypeFilter('');
    setShowAllJobs(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section — Dark Navy */}
      <section className="relative py-24 md:py-32 px-4 gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-sm mb-8 animate-fade-in">
            <Zap className="h-3.5 w-3.5 text-primary-foreground/80" />
            <span className="text-sm text-primary-foreground/80 font-medium">Modern ATS for scaling teams</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary-foreground tracking-tight animate-fade-in stagger-1 font-heading">
            Hire smarter.
            <br />
            <span className="text-primary-foreground/70">Grow faster.</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 text-primary-foreground/70 max-w-2xl mx-auto animate-fade-in stagger-2 leading-relaxed">
            HireLoom is the enterprise hiring platform that helps recruiting teams
            manage jobs, candidates, and pipelines — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-in stagger-3">
            <Link to="/signup">
              <Button size="lg" className="text-base px-8 h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-lg">
                Start Hiring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent">
                Browse Open Roles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: `${jobs.length}+`, label: 'Open Positions' },
              { value: '500+', label: 'Companies' },
              { value: '10k+', label: 'Candidates Placed' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold font-heading text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Jobs */}
      <section id="trending-jobs" className="py-16 md:py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Latest Openings</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Freshly posted roles from companies hiring now.
          </p>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 rounded-lg shimmer" />
              ))}
            </div>
          ) : trendingJobs.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No jobs posted yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon for new opportunities.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="group">
                  <Card className="h-full border border-border/60 hover:border-primary/30 hover:shadow-medium transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        {job.is_remote && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">Remote</Badge>
                        )}
                        {job.work_type && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 capitalize">{job.work_type}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search Section */}
      <section id="search-jobs" className="py-16 md:py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Search All Positions</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Find the right role with instant search and filters.
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mb-8">
            <div className="bg-card border rounded-lg p-4 shadow-soft">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filters:</span>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2">
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {uniqueLocations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {uniqueDepartments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                        <SelectValue placeholder="Work Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(isSearching || showAllJobs) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9">
                      <X className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {!isSearching && !showAllJobs && jobs.length > 8 && (
                  <Button variant="outline" size="sm" onClick={() => setShowAllJobs(true)} className="self-start">
                    Show all {jobs.length} positions
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          {(isSearching || showAllJobs) && (
            <div className="max-w-4xl animate-fade-in">
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-semibold text-foreground">{filteredJobs.length}</span> positions found
                {searchTerm && <> for "<span className="font-semibold text-foreground">{searchTerm}</span>"</>}
              </p>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No positions found</h3>
                  <p className="text-sm text-muted-foreground mb-3">Try adjusting your filters.</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <Card key={job.id} className="border border-border/60 hover:border-primary/30 hover:shadow-soft transition-all duration-200">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg hover:text-primary transition-colors">
                              <Link to={`/jobs/${job.id}`} className="hover:underline underline-offset-4">
                                {job.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1.5 mt-0.5">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.company}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                            {job.is_remote && <Badge variant="outline" className="text-xs">Remote</Badge>}
                            {job.work_type && <Badge variant="outline" className="text-xs capitalize">{job.work_type}</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {truncateDescription(job.description, 180)}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {job.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(job.created_at)}
                          </span>
                          <Link to={`/jobs/${job.id}`} className="ml-auto">
                            <Button size="sm" variant="outline" className="text-xs h-8 group">
                              View
                              <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-2">
            Built for Modern Recruiting Teams
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Everything you need to attract, evaluate, and hire — efficiently.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, title: 'Job Management', desc: 'Create, publish, and manage job postings with rich descriptions and visibility controls.' },
              { icon: Users, title: 'Pipeline Tracking', desc: 'Move candidates through hiring stages with a visual Kanban board.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track time-to-hire, pipeline metrics, and application volume at a glance.' },
              { icon: Globe, title: 'Multi-Channel', desc: 'Post to your career page and external boards automatically.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-lg border bg-card hover:border-primary/20 hover:shadow-soft transition-all duration-200"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent mb-3">
                  <feature.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-1 font-heading">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-center mb-10">
            Get started in minutes
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { num: '01', title: 'Create Account', desc: 'Sign up with your company email and set up your workspace.' },
              { num: '02', title: 'Post & Publish', desc: 'Create jobs, invite your team, and publish across channels.' },
              { num: '03', title: 'Hire Talent', desc: 'Review applications, run interviews, and make great hires.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <span className="text-3xl font-bold font-heading text-primary/20 block mb-2">{step.num}</span>
                <h3 className="font-semibold mb-1 font-heading">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 px-4 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-primary-foreground/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-primary-foreground/3 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground font-heading">
            Ready to transform your hiring?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-8">
            Join hundreds of companies that use HireLoom to hire better.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-12 px-10 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-base">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold font-heading">HireLoom</span>
              <p className="text-xs text-muted-foreground">Enterprise Hiring Platform</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#trending-jobs" className="hover:text-foreground transition-colors">Jobs</a>
            <a href="#search-jobs" className="hover:text-foreground transition-colors">Search</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 HireLoom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;