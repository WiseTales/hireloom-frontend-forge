import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Users, ChevronRight, Plus, Search, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string;
  is_remote: boolean | null;
}

interface Referral {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  created_at: string;
  job: {
    title: string;
  } | null;
}

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [referralForm, setReferralForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    relationship: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Fetch user's referrals
      if (user) {
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select(`
            *,
            job:jobs(title)
          `)
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (referralsError) throw referralsError;
        setReferrals(referralsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReferral = async () => {
    if (!user || !selectedJobId) return;
    
    if (!referralForm.candidateName || !referralForm.candidateEmail) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          job_id: selectedJobId,
          referrer_id: user.id,
          candidate_name: referralForm.candidateName,
          candidate_email: referralForm.candidateEmail,
          candidate_phone: referralForm.candidatePhone || null,
          relationship: referralForm.relationship || null,
          notes: referralForm.notes || null
        });

      if (error) throw error;
      
      toast.success('Referral submitted successfully!');
      setReferralDialogOpen(false);
      setReferralForm({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        relationship: '',
        notes: ''
      });
      setSelectedJobId('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.location.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500">Contacted</Badge>;
      case 'applied':
        return <Badge className="bg-yellow-500">Applied</Badge>;
      case 'hired':
        return <Badge className="bg-green-500">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Portal</h1>
          <p className="text-muted-foreground">Browse open positions and refer candidates</p>
        </div>
        <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Refer a Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Refer a Candidate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Select Position *</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} - {job.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="candidateName">Candidate Name *</Label>
                <Input
                  id="candidateName"
                  value={referralForm.candidateName}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, candidateName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="candidateEmail">Candidate Email *</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={referralForm.candidateEmail}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, candidateEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="candidatePhone">Candidate Phone</Label>
                <Input
                  id="candidatePhone"
                  type="tel"
                  value={referralForm.candidatePhone}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, candidatePhone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="relationship">Your Relationship</Label>
                <Input
                  id="relationship"
                  placeholder="e.g., Former colleague, Friend"
                  value={referralForm.relationship}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, relationship: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Why do you think they'd be a good fit?"
                  value={referralForm.notes}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <Button onClick={handleSubmitReferral} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Referral'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-muted-foreground">Open Positions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-muted-foreground">Your Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {referrals.filter(r => r.status === 'hired').length}
              </p>
              <p className="text-muted-foreground">Successful Hires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Open Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Positions</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No jobs found</p>
              ) : (
                filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setReferralDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {job.company}
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{job.category}</Badge>
                          {job.is_remote && <Badge variant="outline">Remote</Badge>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Refer
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No referrals yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start referring great candidates!
                  </p>
                </div>
              ) : (
                referrals.map(referral => (
                  <div key={referral.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{referral.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referral.candidate_email}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          For: {referral.job?.title}
                        </p>
                      </div>
                      {getStatusBadge(referral.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;