import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  reported_content_type: string;
  reported_content_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter: {
    full_name: string;
    email: string;
  };
}

const Moderation = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (userRole !== 'admin') {
      navigate('/dashboard');
      toast.error('Access denied. Admins only.');
      return;
    }
    fetchReports();
  }, [user, userRole, navigate, activeTab]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey (
            full_name,
            email
          )
        `)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: newStatus,
          reviewed_by: user?.id,
        })
        .eq('id', reportId);

      if (error) throw error;
      toast.success(`Report ${newStatus}`);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const getReasonBadgeColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500/10 text-yellow-500',
      harassment: 'bg-red-500/10 text-red-500',
      inappropriate: 'bg-orange-500/10 text-orange-500',
      violence: 'bg-red-600/10 text-red-600',
      false_info: 'bg-blue-500/10 text-blue-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return colors[reason] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
            <p className="text-muted-foreground">Review and manage reported content</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {report.reported_content_type}
                          </Badge>
                          <Badge className={getReasonBadgeColor(report.reason)}>
                            {report.reason.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          Report from {report.reporter?.full_name || report.reporter?.email}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {report.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Content ID: {report.reported_content_id}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No {activeTab} reports</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Moderation;
