import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';

const CompanySignup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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

    // Validate company email domain
    const emailDomain = companyEmail.split('@')[1];
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    if (publicDomains.includes(emailDomain?.toLowerCase())) {
      toast.error('Please use your official company email address');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: companyEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: companyName,
            role: 'recruiter', // Company owner gets recruiter role
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          created_by: authData.user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 3. Add user to company_users as super_admin
      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          company_id: companyData.id,
          user_id: authData.user.id,
          role: 'super_admin',
        });

      if (companyUserError) throw companyUserError;

      toast.success('Company account created successfully! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create company account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create Company Account</h1>
          <p className="text-muted-foreground text-sm">
            Set up your company's hiring portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium mb-2">
              Company Name
            </label>
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Corporation"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Company Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use your official company email address
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Company...' : 'Create Company Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have a company account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/jobs" className="text-xs text-muted-foreground hover:underline">
            View Open Positions →
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default CompanySignup;
