import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RecruiterDashboard from '@/components/RecruiterDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import InterviewerDashboard from '@/components/InterviewerDashboard';

const Dashboard = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
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

  // Hiring managers see a read-only view (reuse InterviewerDashboard for now)
  if (userRole === 'hiring_manager' || userRole === 'interviewer') {
    return <InterviewerDashboard />;
  }

  // Default fallback
  return <RecruiterDashboard />;
};

export default Dashboard;
