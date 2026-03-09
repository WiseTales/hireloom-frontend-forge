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
  { icon: Target, title: 'Visual Pipeline', desc: 'Drag-and-drop Kanban board moves candidates from Applied → Interview → Hired in seconds.' },
  { icon: Zap, title: 'AI Resume Parser', desc: 'Gemini AI instantly extracts candidate data from resumes and LinkedIn — zero manual entry.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Dashboard shows active jobs, total applicants, hires, and weekly trends at a glance.' },
  { icon: Users, title: 'Multi-Tenant Secure', desc: 'Enterprise-grade RLS policies ensure each company only sees their candidates and data.' },
  { icon: Briefcase, title: 'Public Career Pages', desc: 'Instantly generate shareable career portals with your branding and active job listings.' },
  { icon: CheckCircle, title: 'Candidate Scoring', desc: 'AI-powered summaries and manual scoring help you identify top talent fast.' },
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
            Hire 10x Faster<br />With AI-Powered ATS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90"
          >
            HireLoom combines Kanban pipeline management, Gemini AI resume parsing, and real-time analytics in one beautiful dashboard. Built for startups that move fast.
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
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Production-Ready Features</p>
            <h2 className="text-4xl font-heading font-bold text-foreground">Built with enterprise-grade tech</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">React + TypeScript frontend, Supabase backend with RLS, Gemini AI integration, and real-time updates.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-card p-8 rounded-2xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-5 shadow-lg">
                  <f.icon className="w-7 h-7 text-white" />
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
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">See HireLoom in Action</h2>
          <p className="text-lg opacity-90 mb-10">Full-stack ATS demo ready for investors. AI resume parsing, real-time pipeline, and secure multi-tenant architecture — all built in 48 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-foreground rounded-xl font-semibold hover:shadow-2xl transition-all">
              Try Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:demo@hireloom.com" className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Schedule Demo
            </a>
          </div>
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
