import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, Users, BarChart3, Zap, ArrowRight, CheckCircle, Target } from 'lucide-react';

const stats = [
  { value: '10x', label: 'Faster Hiring' },
  { value: '500+', label: 'Teams Trust Us' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '50K+', label: 'Candidates Tracked' },
];

const features = [
  { icon: Target, title: 'Pipeline Management', desc: 'Track every candidate through Applied → Interview → Offer → Hired with a visual Kanban board.' },
  { icon: Users, title: 'Team Collaboration', desc: 'Hiring managers and recruiters work together with feedback, scoring, and internal notes.' },
  { icon: Briefcase, title: 'Multi-Channel Posting', desc: 'Publish jobs to your career page, LinkedIn, and more — all from one dashboard.' },
  { icon: BarChart3, title: 'Hiring Analytics', desc: 'Track time-to-hire, pipeline conversion rates, and team performance at a glance.' },
  { icon: Zap, title: 'AI-Powered Autofill', desc: 'Extract candidate details from resumes automatically with AI — no manual data entry.' },
  { icon: CheckCircle, title: 'Structured Interviews', desc: 'Standardized scorecards and feedback forms so every candidate gets a fair evaluation.' },
];

const audiences = [
  { title: 'Startups', desc: 'Move fast with a lightweight ATS that scales with your team.' },
  { title: 'SMBs', desc: 'Replace spreadsheets with a structured hiring process.' },
  { title: 'Growing Teams', desc: 'Coordinate across hiring managers and recruiters seamlessly.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-heading font-bold text-primary">HireLoom</Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
            <Link to="/signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(153 60% 28%), hsl(153 60% 42%), hsl(160 50% 35%))' }}>
        <div className="max-w-5xl mx-auto px-6 text-center text-white relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-sm font-medium tracking-widest uppercase mb-6 opacity-80"
          >Modern Hiring Platform</motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-8"
          >
            One Hiring System.<br />Every Candidate.<br />One Dashboard.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90"
          >
            HireLoom is the all-in-one applicant tracking system that helps growing teams hire faster, collaborate better, and never lose a candidate.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup" className="flex items-center gap-2 px-8 py-4 bg-white text-foreground rounded-xl font-semibold hover:bg-white/90 transition-colors">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
              See Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-4xl font-heading font-bold text-primary mb-2">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-4xl font-heading font-bold text-foreground">Everything you need to hire right</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">From job creation to offer letter — manage your entire hiring process in one place.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="about" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Built For</p>
            <h2 className="text-4xl font-heading font-bold text-foreground">Teams that want to grow</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card p-8 rounded-2xl border border-border text-center"
              >
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, hsl(153 60% 28%), hsl(153 60% 42%))' }}>
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-heading font-bold mb-6">Ready to transform your hiring?</h2>
          <p className="text-lg opacity-90 mb-10">Join hundreds of teams that use HireLoom to find, track, and hire the best talent.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-foreground rounded-xl font-semibold hover:bg-white/90 transition-colors">
            Start Hiring Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HireLoom. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
