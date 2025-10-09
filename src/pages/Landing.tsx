import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, Users, Building2, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { mockJobs } from '@/data/mockJobs';
import { JobCard } from '@/components/JobCard';
import { supabase } from '@/integrations/supabase/client';

const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedJobs, setDisplayedJobs] = useState(mockJobs.slice(0, 12));
  const [liveSearchResults, setLiveSearchResults] = useState<typeof mockJobs>([]);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [allJobs, setAllJobs] = useState(mockJobs);

  useEffect(() => {
    // Fetch real jobs from database and combine with mock jobs
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dbJobs = data.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || 'Not specified',
          type: job.type,
          category: job.category,
          description: job.description,
          requirements: [],
          posted: new Date(job.created_at).toLocaleDateString(),
          isRemote: job.location.toLowerCase().includes('remote')
        }));
        setAllJobs([...dbJobs, ...mockJobs]);
        setDisplayedJobs([...dbJobs, ...mockJobs].slice(0, 12));
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = allJobs.filter((job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.category.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
      setLiveSearchResults(filtered);
      setShowLiveResults(true);
    } else {
      setShowLiveResults(false);
      setLiveSearchResults([]);
    }
  }, [searchQuery, allJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Find Your Dream Job with HireLoom
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Discover thousands of opportunities from top companies worldwide
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
            <div className="flex flex-col md:flex-row gap-3 bg-background p-2 rounded-xl shadow-elevated">
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Job title, skills, or company..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="md:w-auto">
                Search Jobs
              </Button>
            </div>

            {/* Live Search Results */}
            {showLiveResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl shadow-elevated border max-h-[600px] overflow-y-auto z-50">
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {liveSearchResults.length} {liveSearchResults.length === 1 ? 'job' : 'jobs'} found
                  </p>
                  {liveSearchResults.length > 0 ? (
                    <div className="grid gap-4">
                      {liveSearchResults.slice(0, 6).map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No jobs found matching "{searchQuery}"
                    </p>
                  )}
                  {liveSearchResults.length > 6 && (
                    <div className="mt-4 text-center">
                      <Button onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}>
                        View All {liveSearchResults.length} Results
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-background/50 hover:bg-background">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Featured Opportunities
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <div className="text-center">
            <Link to="/register">
              <Button size="lg">
                View All Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose HireLoom?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thousands of Jobs</h3>
              <p className="text-muted-foreground">
                Access opportunities from leading companies across all industries
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Apply</h3>
              <p className="text-muted-foreground">
                Apply to multiple jobs with just one click using your profile
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Companies</h3>
              <p className="text-muted-foreground">
                Connect with industry-leading employers actively hiring
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
              <p className="text-muted-foreground">
                Get personalized recommendations based on your profile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who found their perfect role through HireLoom
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
