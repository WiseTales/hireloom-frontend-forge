import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layers, Users, Globe, BarChart3, Zap, CheckCircle2, ArrowRight, FileText, MessageSquare, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Layers,
      title: 'Visual Candidate Pipeline',
      description: 'Drag-and-drop Kanban board to move candidates through Applied → Interview → Offer → Hired. See your entire pipeline at a glance.',
    },
    {
      icon: FileText,
      title: 'Job Creation & Publishing',
      description: 'Create rich job descriptions with titles, locations, departments, and hiring stages. Publish with one click.',
    },
    {
      icon: Globe,
      title: 'Multi-Channel Distribution',
      description: 'Post jobs to your company career page and external boards simultaneously. Track which channels drive the best candidates.',
    },
    {
      icon: Users,
      title: 'Hiring Manager Collaboration',
      description: 'Assign candidates to hiring managers for review. Collect structured feedback and scores from the entire interview panel.',
    },
    {
      icon: MessageSquare,
      title: 'Internal Notes & Feedback',
      description: 'Leave private notes on any candidate. Build a shared record of interview impressions and hiring decisions.',
    },
    {
      icon: Zap,
      title: 'AI Resume Parsing',
      description: 'Upload a resume and let AI extract candidate details automatically — name, email, experience, and more.',
    },
    {
      icon: BarChart3,
      title: 'Hiring Analytics',
      description: 'Track time-to-hire, source effectiveness, pipeline conversion, and team performance with built-in dashboards.',
    },
    {
      icon: CheckCircle2,
      title: 'Structured Scorecards',
      description: 'Standardize your interview process with scorecards for technical, cultural, and communication assessments.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'HR, Hiring Managers, and Admins each get the right level of access. Secure and compliant by design.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium tracking-widest uppercase mb-4 text-primary-foreground/70">Platform Features</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Built for modern hiring teams</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Everything you need to source, track, and hire — in one powerful platform.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Set up your hiring pipeline in minutes. No credit card required.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6 font-semibold">
            <Link to="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Features;
