import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

const CompanySignup = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !companyEmail || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const emailDomain = companyEmail.split('@')[1];
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    if (publicDomains.includes(emailDomain?.toLowerCase())) {
      toast.error('Please use your official company email address');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: companyEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: companyName,
            role: 'recruiter',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          created_by: authData.user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          company_id: companyData.id,
          user_id: authData.user.id,
          role: 'super_admin',
        });

      if (companyUserError) throw companyUserError;

      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create company account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Navy Brand */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -right-40 w-[350px] h-[350px] bg-primary-foreground/3 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-md bg-primary-foreground/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-primary-foreground">HireLoom</span>
          </div>
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-6 leading-tight">
            Start hiring with confidence.
          </h2>
          <div className="space-y-3">
            {[
              'Post jobs and manage your pipeline',
              'Collaborate with your hiring team',
              'Track candidates from apply to offer',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary-foreground/50 shrink-0" />
                <span className="text-sm text-primary-foreground/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-heading font-bold">HireLoom</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up your company's hiring portal in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-1.5">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Work Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use your official company email address.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/jobs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View Open Positions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup;