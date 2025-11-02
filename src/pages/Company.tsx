import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Globe, MapPin, Users, Briefcase } from 'lucide-react';
import { JobCard } from '@/components/JobCard';
import { useToast } from '@/hooks/use-toast';
import type { Job } from '@/types/job';

interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  follower_count?: number;
  is_following?: boolean;
}

export default function Company() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchCompanyJobs();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyData) {
      const { count } = await supabase
        .from('company_followers')
        .select('*', { count: 'exact' })
        .eq('company_id', id);

      const { data: followData } = await supabase
        .from('company_followers')
        .select('id')
        .eq('company_id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      setCompany({
        ...companyData,
        follower_count: count || 0,
        is_following: !!followData,
      });
    }
    setLoading(false);
  };

  const fetchCompanyJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (data) {
      const mappedJobs: Job[] = data.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        category: job.category,
        description: job.description,
        salary: job.salary,
        posted: new Date(job.created_at).toLocaleDateString(),
        requirements: [],
        isRemote: job.is_remote || false,
      }));
      setJobs(mappedJobs);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to follow companies',
        variant: 'destructive',
      });
      return;
    }

    if (company?.is_following) {
      await supabase
        .from('company_followers')
        .delete()
        .eq('company_id', id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('company_followers')
        .insert({ company_id: id, user_id: user.id });
    }

    fetchCompanyDetails();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                  {company.industry && (
                    <p className="text-muted-foreground mt-1">{company.industry}</p>
                  )}
                </div>
                <Button
                  onClick={handleFollowToggle}
                  variant={company.is_following ? 'outline' : 'default'}
                >
                  {company.is_following ? 'Following' : 'Follow'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </div>
                )}
                {company.company_size && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {company.company_size} employees
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {company.follower_count} followers
                </Badge>
                <Badge variant="secondary">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {jobs.length} open positions
                </Badge>
              </div>
            </div>
          </div>

          {company.description && (
            <p className="mt-6 text-muted-foreground">{company.description}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Open Positions</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No open positions at the moment
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Company Overview</h3>
                <p className="text-muted-foreground">
                  {company.description || 'No description available'}
                </p>
              </div>

              {company.industry && (
                <div>
                  <h3 className="font-semibold mb-2">Industry</h3>
                  <p className="text-muted-foreground">{company.industry}</p>
                </div>
              )}

              {company.company_size && (
                <div>
                  <h3 className="font-semibold mb-2">Company Size</h3>
                  <p className="text-muted-foreground">{company.company_size} employees</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
