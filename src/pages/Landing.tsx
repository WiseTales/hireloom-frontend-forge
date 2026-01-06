import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Building2, Users, Shield, ArrowRight, Search, MapPin, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
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
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || job.category === departmentFilter;
    const matchesWorkType = !workTypeFilter || workTypeFilter === 'all' || job.work_type === workTypeFilter;
    return matchesSearch && matchesLocation && matchesDepartment && matchesWorkType;
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Enterprise Hiring Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Streamline your recruitment process with HireLoom's powerful B2B hiring solution
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#jobs">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20">
                View Open Positions
              </Button>
            </a>
          </div>

          <p className="text-primary-foreground/70 text-sm">
            Already have a company account?{' '}
            <Link to="/login" className="underline hover:text-primary-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Open Positions
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore career opportunities from top companies
          </p>

          {/* Search and Filters */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
          </div>

          {/* Job Listings */}
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <CardTitle className="text-xl">
                            <Link to={`/jobs/${job.id}`} className="hover:text-primary">
                              {job.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-base">{job.company}</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary">{job.category}</Badge>
                          {job.is_remote && <Badge variant="outline">Remote</Badge>}
                          {job.work_type && (
                            <Badge variant="outline" className="capitalize">{job.work_type}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                          <Clock className="h-4 w-4" />
                          {formatDate(job.created_at)}
                        </span>
                        {job.experience_level && (
                          <span className="capitalize">{job.experience_level} level</span>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link to={`/jobs/${job.id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Modern Recruiting Teams
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to attract, evaluate, and hire top talent efficiently
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Job Management</h3>
              <p className="text-muted-foreground text-sm">
                Create, publish, and manage job postings with rich descriptions and visibility controls
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground text-sm">
                Assign roles to hiring managers, recruiters, and interviewers with granular permissions
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Company Branding</h3>
              <p className="text-muted-foreground text-sm">
                Showcase your company with a professional careers page that attracts top talent
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">RBAC Security</h3>
              <p className="text-muted-foreground text-sm">
                Role-based access control ensures the right people have access to the right data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Company Account</h3>
              <p className="text-muted-foreground text-sm">
                Sign up with your company email to get started in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Post Jobs & Build Team</h3>
              <p className="text-muted-foreground text-sm">
                Create detailed job listings and invite team members with appropriate roles
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Receive Applications</h3>
              <p className="text-muted-foreground text-sm">
                Candidates apply directly with their resumes - no account required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join companies who trust HireLoom for their recruitment needs
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8">
              Create Company Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">HireLoom</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#jobs" className="hover:text-foreground">Open Positions</a>
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
