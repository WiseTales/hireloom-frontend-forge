import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');

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
      toast.success('Welcome back!');
      navigate(from);
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (!email) {
      toast.error('Please enter your work email');
      return;
    }
    setStep('password');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Green Brand */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-xl font-heading font-bold text-primary-foreground">HireLoom</span>
          </div>
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-4 leading-tight">
            Your hiring command center.
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed">
            Manage jobs, track candidates, and collaborate with your team — all from one platform built for modern recruiting.
          </p>
          <div className="mt-8 space-y-3">
            {['Visual candidate pipeline', 'Multi-channel job posting', 'AI resume parsing'].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary-foreground/50 shrink-0" />
                <span className="text-sm text-primary-foreground/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <span className="text-xl font-heading font-bold text-primary">HireLoom</span>
          </div>

          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your work email to access your hiring dashboard.
            </p>
          </div>

          {step === 'email' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  autoFocus
                />
              </div>
              <Button onClick={handleEmailContinue} className="w-full h-11 font-semibold">
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-full justify-center"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-4">
            <Link to="/signup" className="hover:text-foreground transition-colors">Create Account</Link>
            <span>·</span>
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
