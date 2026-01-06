import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from);
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate(from);
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (!email) {
      toast.error('Please enter your work email');
      return;
    }
    setShowPassword(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Sign in to HireLoom</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Company portal access
          </p>
        </div>

        {/* Email Form */}
        {!showPassword ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Enter your work email to continue
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
              />
              <Button 
                onClick={handleEmailContinue}
                className="h-12 px-6"
              >
                NEXT
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <button 
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
              onClick={() => setShowPassword(false)}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="text-center space-y-2 text-xs text-muted-foreground pt-8">
          <a href="/jobs" className="hover:underline">View Open Positions</a>
          <span className="mx-2">·</span>
          <a href="/signup" className="hover:underline">Create Company Account</a>
          <span className="mx-2">·</span>
          <a href="#" className="hover:underline">Privacy Notice</a>
        </div>
      </div>
    </div>
  );
};

export default Login;