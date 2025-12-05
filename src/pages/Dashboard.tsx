import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RecruiterDashboard from '@/components/RecruiterDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import InterviewerDashboard from '@/components/InterviewerDashboard';
import EmployeeDashboard from '@/components/EmployeeDashboard';
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

  if (userRole === 'interviewer') {
    return <InterviewerDashboard />;
  }

  if (userRole === 'employee') {
    return <EmployeeDashboard />;
  }

  // Default: Job Seeker Dashboard (legacy support)
  return <JobSeekerDashboard />;
};

export default Dashboard;