import { Briefcase, Users, TrendingUp, UserCheck } from 'lucide-react';

interface DashboardStatsProps {
  jobs: any[];
  applications: any[];
}

export default function DashboardStats({ jobs, applications }: DashboardStatsProps) {
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = applications.length;
  const hired = applications.filter(a => a.status === 'hired').length;
  
  // New this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = applications.filter(a => new Date(a.created_at) > weekAgo).length;

  const stats = [
    { label: 'Active Jobs', value: activeJobs, icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Applicants', value: totalApplicants, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Hires', value: hired, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'New This Week', value: newThisWeek, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-heading font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
