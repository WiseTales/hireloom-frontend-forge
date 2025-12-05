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
import { Users, Plus, Search, Briefcase, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

interface Referral {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  relationship: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  job: {
    title: string;
    company: string;
  } | null;
}

const Referrals = () => {
  const { user, userRole } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [search, setSearch] = useState('');
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
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      // Fetch all jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, company, location')
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);

      // Fetch referrals based on role
      if (user) {
        let query = supabase
          .from('referrals')
          .select(`
            *,
            job:jobs(title, company)
          `)
          .order('created_at', { ascending: false });

        // Employees only see their own referrals
        if (userRole === 'employee' || userRole === 'interviewer') {
          query = query.eq('referrer_id', user.id);
        }

        const { data: referralsData } = await query;
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
      setDialogOpen(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500">Contacted</Badge>;
      case 'applied':
        return <Badge className="bg-yellow-500">Applied</Badge>;
      case 'hired':
        return <Badge className="bg-green-500">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Not Selected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    r.candidate_email.toLowerCase().includes(search.toLowerCase()) ||
    r.job?.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-muted-foreground">
            {userRole === 'recruiter' || userRole === 'admin' 
              ? 'Manage all candidate referrals' 
              : 'Track your candidate referrals'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Referral
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
                  placeholder="e.g., Former colleague"
                  value={referralForm.relationship}
                  onChange={(e) => setReferralForm(prev => ({ ...prev, relationship: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Why would they be a good fit?"
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-muted-foreground text-sm">Total Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {referrals.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-muted-foreground text-sm">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {referrals.filter(r => r.status === 'applied').length}
              </p>
              <p className="text-muted-foreground text-sm">In Progress</p>
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
              <p className="text-muted-foreground text-sm">Hired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search referrals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Referrals List */}
      {filteredReferrals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No referrals found</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Make Your First Referral
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <Card key={referral.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{referral.candidate_name}</h3>
                      {getStatusBadge(referral.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {referral.job?.title} at {referral.job?.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {referral.candidate_email}
                      </span>
                      {referral.candidate_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {referral.candidate_phone}
                        </span>
                      )}
                    </div>
                    {referral.relationship && (
                      <p className="text-sm text-muted-foreground">
                        Relationship: {referral.relationship}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Referred on {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Referrals;