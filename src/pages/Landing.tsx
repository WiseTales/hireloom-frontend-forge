import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, Building2, Users, Shield, ArrowRight, Search, MapPin, Clock, 
  DollarSign, TrendingUp, Sparkles, ChevronRight, Filter, X
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

  // Real-time letter-by-letter search (no debounce)
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

  // Top 10 trending jobs (latest)
  const trendingJobs = jobs.slice(0, 10);
  
  // Jobs for search section (only when searching/filtering or showing all)
  const isSearching = searchTerm || locationFilter || departmentFilter || workTypeFilter;
  const displayedJobs = isSearching || showAllJobs ? filteredJobs : [];

  const uniqueLocations = [...new Set(jobs.map(job => job.location))];
  const uniqueDepartments = [...new Set(jobs.map(job => job.category))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-28 px-4 gradient-hero overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm text-white/90">Trusted by 500+ Companies</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground animate-fade-in stagger-1">
            Enterprise Hiring
            <br />
            <span className="relative">
              Platform
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10C50 4 150 4 298 10" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in stagger-2">
            Streamline your recruitment process with HireLoom's powerful B2B hiring solution
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6 animate-fade-in stagger-3">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 group hover-lift">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#trending-jobs">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                View Trending Jobs
              </Button>
            </a>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Trending Jobs Section */}
      <section id="trending-jobs" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Trending Jobs
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in stagger-1">
            Latest opportunities from top companies — freshly posted and ready for you
          </p>

          {/* Trending Jobs Grid */}
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 rounded-xl shimmer" />
                ))}
              </div>
            ) : trendingJobs.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                  <Briefcase className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
                <p className="text-muted-foreground">Check back soon for new opportunities</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {trendingJobs.map((job, index) => (
                  <Card 
                    key={job.id} 
                    className="group hover-lift card-shine border-border/50 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {index < 3 && (
                              <Badge variant="default" className="bg-primary/90 text-xs">
                                🔥 Hot
                              </Badge>
                            )}
                            {job.is_remote && (
                              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                Remote
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            <Link to={`/jobs/${job.id}`} className="hover:underline underline-offset-4">
                              {job.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-base flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {job.work_type && (
                            <Badge variant="secondary" className="capitalize text-xs">
                              {job.work_type}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {job.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {truncateDescription(job.description)}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-orange-500" />
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <Button size="sm" className="group/btn">
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search-jobs" className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Search All Jobs
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in stagger-1">
            Find your perfect role with instant search and powerful filters
          </p>

          {/* Search and Filters */}
          <div className="max-w-5xl mx-auto mb-8 animate-fade-in stagger-2">
            <div className="bg-card border rounded-2xl p-6 shadow-medium">
              <div className="flex flex-col gap-4">
                {/* Main Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Start typing to search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-primary transition-colors"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-3">
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full md:w-44 rounded-lg">
                        <SelectValue placeholder="📍 Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {uniqueLocations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full md:w-44 rounded-lg">
                        <SelectValue placeholder="🏢 Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {uniqueDepartments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                      <SelectTrigger className="w-full md:w-44 rounded-lg">
                        <SelectValue placeholder="💼 Work Type" />
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
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Show All Jobs Button */}
                {!isSearching && !showAllJobs && jobs.length > 10 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" onClick={() => setShowAllJobs(true)}>
                      Show all {jobs.length} jobs
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          {(isSearching || showAllJobs) && (
            <div className="max-w-5xl mx-auto animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{filteredJobs.length}</span> jobs
                  {searchTerm && <> matching "<span className="font-semibold text-foreground">{searchTerm}</span>"</>}
                </p>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job, index) => (
                    <Card 
                      key={job.id} 
                      className="hover-lift card-shine animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-xl hover:text-primary transition-colors">
                              <Link to={`/jobs/${job.id}`} className="hover:underline underline-offset-4">
                                {job.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-base flex items-center gap-2 mt-1">
                              <Building2 className="h-4 w-4" />
                              {job.company}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{job.category}</Badge>
                            {job.is_remote && <Badge variant="outline" className="border-primary/30 text-primary">Remote</Badge>}
                            {job.work_type && (
                              <Badge variant="outline" className="capitalize">{job.work_type}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {truncateDescription(job.description, 200)}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-primary/70" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              {job.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {formatDate(job.created_at)}
                          </span>
                          {job.experience_level && (
                            <span className="capitalize bg-muted px-2 py-0.5 rounded-full text-xs">
                              {job.experience_level} level
                            </span>
                          )}
                        </div>
                        <Link to={`/jobs/${job.id}`}>
                          <Button size="sm" className="group">
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
            Built for Modern Recruiting Teams
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in stagger-1">
            Everything you need to attract, evaluate, and hire top talent efficiently
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Briefcase, title: 'Job Management', desc: 'Create, publish, and manage job postings with rich descriptions and visibility controls' },
              { icon: Users, title: 'Team Collaboration', desc: 'Assign roles to hiring managers, recruiters, and interviewers with granular permissions' },
              { icon: Building2, title: 'Company Branding', desc: 'Showcase your company with a professional careers page that attracts top talent' },
              { icon: Shield, title: 'RBAC Security', desc: 'Role-based access control ensures the right people have access to the right data' },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="text-center p-6 rounded-xl border bg-card hover-lift card-shine animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { num: 1, title: 'Create Company Account', desc: 'Sign up with your company email to get started in minutes' },
              { num: 2, title: 'Post Jobs & Build Team', desc: 'Create detailed job listings and invite team members with appropriate roles' },
              { num: 3, title: 'Receive Applications', desc: 'Candidates apply directly with their resumes - no account required' },
            ].map((step, index) => (
              <div 
                key={step.num} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 pulse-glow">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl float" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary-foreground animate-fade-in">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto animate-fade-in stagger-1">
            Join companies who trust HireLoom for their recruitment needs
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-10 hover-lift animate-fade-in stagger-2">
              Create Company Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-card">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg">HireLoom</span>
              <p className="text-xs text-muted-foreground">Enterprise Hiring Platform</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#trending-jobs" className="hover:text-foreground transition-colors">Jobs</a>
            <a href="#search-jobs" className="hover:text-foreground transition-colors">Search</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 HireLoom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;