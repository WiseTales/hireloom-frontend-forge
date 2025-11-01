import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AppliedJobs = () => {
  const { isAuthenticated, user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, jobs(*)')
      .eq('user_id', user?.id)
      .order('applied_at', { ascending: false });

    if (data) {
      setApplications(data);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      shortlisted: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Applied Jobs</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : applications.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <Card key={app.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-1">{app.jobs?.title}</h3>
                    <p className="text-muted-foreground">{app.jobs?.company}</p>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Location:</span> {app.jobs?.location}</p>
                  <p><span className="font-medium">Type:</span> {app.jobs?.type}</p>
                  {app.jobs?.salary && (
                    <p><span className="font-medium">Salary:</span> {app.jobs.salary}</p>
                  )}
                  <p className="text-muted-foreground">
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No applications yet</p>
            <p className="text-muted-foreground">Start applying to jobs that match your skills</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
