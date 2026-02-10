import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium tracking-widest uppercase mb-4 text-primary-foreground/70">About HireLoom</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Hiring shouldn't be this hard</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            We built HireLoom because every growing team deserves a hiring process that's organized, collaborative, and fair.
          </p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 gradient-subtle">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-12">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">The problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                Most teams start hiring with spreadsheets, email threads, and scattered notes. Candidates fall through the cracks. 
                Hiring managers don't know where things stand. Recruiters waste hours on manual data entry instead of talking to people.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Our solution</h2>
              <p className="text-muted-foreground leading-relaxed">
                HireLoom centralizes your entire hiring process — from job creation to offer letter — in one clean dashboard. 
                Every candidate, every interview, every decision is tracked and visible to the right people at the right time.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Who it's for</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: 'Startups', desc: 'Ship your first hires with a system that grows with you.' },
                  { title: 'SMBs', desc: 'Replace the chaos of spreadsheets with structured pipelines.' },
                  { title: 'Growing Teams', desc: 'Coordinate hiring across departments and managers seamlessly.' },
                ].map((item) => (
                  <div key={item.title} className="glass-card rounded-xl p-6">
                    <h3 className="font-heading font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Join the teams hiring smarter</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Get started in minutes. No credit card required.
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

export default About;
