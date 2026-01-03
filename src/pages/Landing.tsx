import { Button } from '@/components/ui/button';
import { Briefcase, Building2, Users, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Enterprise Hiring Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Streamline your recruitment process with HireLoom's powerful B2B hiring solution
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20">
                View Open Positions
              </Button>
            </Link>
          </div>

          <p className="text-primary-foreground/70 text-sm">
            Already have a company account?{' '}
            <Link to="/login" className="underline hover:text-primary-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Modern Recruiting Teams
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to attract, evaluate, and hire top talent efficiently
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Job Management</h3>
              <p className="text-muted-foreground text-sm">
                Create, publish, and manage job postings with rich descriptions and visibility controls
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground text-sm">
                Assign roles to hiring managers, recruiters, and interviewers with granular permissions
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Company Branding</h3>
              <p className="text-muted-foreground text-sm">
                Showcase your company with a professional careers page that attracts top talent
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border bg-card">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">RBAC Security</h3>
              <p className="text-muted-foreground text-sm">
                Role-based access control ensures the right people have access to the right data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Company Account</h3>
              <p className="text-muted-foreground text-sm">
                Sign up with your company email to get started in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Post Jobs & Build Team</h3>
              <p className="text-muted-foreground text-sm">
                Create detailed job listings and invite team members with appropriate roles
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Receive Applications</h3>
              <p className="text-muted-foreground text-sm">
                Candidates apply directly with their resumes - no account required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join companies who trust HireLoom for their recruitment needs
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8">
              Create Company Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">HireLoom</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/jobs" className="hover:text-foreground">Open Positions</Link>
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
