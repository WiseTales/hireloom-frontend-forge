import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BarChart3, Layers, Globe, CheckCircle2, Zap } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Layers,
      title: 'Pipeline Management',
      description: 'Track every candidate through Applied → Interview → Offer → Hired with a visual Kanban board.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Hiring managers and recruiters work together with feedback, scoring, and internal notes.',
    },
    {
      icon: Globe,
      title: 'Multi-Channel Posting',
      description: 'Publish jobs to your career page, LinkedIn, and more — all from one dashboard.',
    },
    {
      icon: BarChart3,
      title: 'Hiring Analytics',
      description: 'Track time-to-hire, pipeline conversion rates, and team performance at a glance.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Autofill',
      description: 'Extract candidate details from resumes automatically with AI — no manual data entry.',
    },
    {
      icon: CheckCircle2,
      title: 'Structured Interviews',
      description: 'Standardized scorecards and feedback forms so every candidate gets a fair evaluation.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          <p className="text-sm font-medium tracking-widest uppercase mb-4 text-primary-foreground/70">
            Modern Hiring Platform
          </p>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl mx-auto mb-6">
            One Hiring System.<br />Every Candidate.<br />One Dashboard.
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-primary-foreground/80">
            HireLoom is the all-in-one applicant tracking system that helps growing teams hire faster, collaborate better, and never lose a candidate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-base px-8 py-6 font-semibold">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/features">See Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10x', label: 'Faster Hiring' },
              { value: '500+', label: 'Teams Trust Us' },
              { value: '98%', label: 'Customer Satisfaction' },
              { value: '50K+', label: 'Candidates Tracked' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-heading font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Features</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Everything you need to hire right</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From job creation to offer letter — manage your entire hiring process in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card rounded-xl p-6 hover-lift">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Built For</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Teams that want to grow</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { title: 'Startups', desc: 'Move fast with a lightweight ATS that scales with your team.' },
              { title: 'SMBs', desc: 'Replace spreadsheets with a structured hiring process.' },
              { title: 'Growing Teams', desc: 'Coordinate across hiring managers and recruiters seamlessly.' },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <h3 className="font-heading text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Ready to transform your hiring?</h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
            Join hundreds of teams that use HireLoom to find, track, and hire the best talent.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base px-8 py-6 font-semibold">
            <Link to="/signup">
              Start Hiring Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background/70 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-heading text-lg font-bold text-background mb-3">HireLoom</h4>
              <p className="text-sm">The modern hiring platform for growing teams.</p>
            </div>
            <div>
              <h5 className="font-semibold text-background mb-3 text-sm">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-background transition-colors">Features</Link></li>
                <li><Link to="/about" className="hover:text-background transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-background mb-3 text-sm">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-background transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-background mb-3 text-sm">Get Started</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-background transition-colors">Log In</Link></li>
                <li><Link to="/signup" className="hover:text-background transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-8 text-center text-xs">
            © {new Date().getFullYear()} HireLoom. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
