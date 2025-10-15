import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RecruiterDashboard from '@/components/RecruiterDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import JobSeekerDashboard from '@/components/JobSeekerDashboard';

const Dashboard = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (userRole === 'recruiter') {
    return <RecruiterDashboard />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  // Default: Job Seeker Dashboard
  return <JobSeekerDashboard />;
};

export default Dashboard;

